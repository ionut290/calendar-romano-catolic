#!/usr/bin/env python3
"""Publish one verified CEI liturgy per Italian day in isolated Firebase project.
Requires FIREBASE_SERVICE_ACCOUNT secret and google-auth, beautifulsoup4.
Runs in GitHub Actions; NEVER place service account data into the repository.
"""
import json
import os
import re
import sys
from datetime import datetime
from zoneinfo import ZoneInfo
from urllib.request import Request, urlopen

import google.auth
from google.auth.transport.requests import AuthorizedSession
from bs4 import BeautifulSoup

PROJECT = "ore-l-766fb"
ROOT = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"
DATE = datetime.now(ZoneInfo("Europe/Rome")).strftime("%Y-%m-%d")
HEADINGS = ["Prima Lettura", "Salmo Responsoriale", "Seconda Lettura", "Acclamazione al Vangelo", "Vangelo", "Sulle offerte", "Antifona alla comunione", "Dopo la comunione"]
REF_PATTERN = re.compile(r"\b((?:1|2|3)?\s?[A-ZÀ-Ý][a-zà-ÿ]{0,8})\s+(\d+[\s,.-]+\d+(?:[-–]\d+)?)")
REF_REMOVE = re.compile(r"\b(?:Is|Ger|Ez|Dn|Os|Gl|Am|Abd|Gio|Mi|Na|Ab|Sof|Ag|Zc|Ml|Mt|Mc|Lc|Gv|At|Rm|1Cor|2Cor|Gal|Ef|Fil|Col|1Ts|2Ts|1Tm|2Tm|Tt|Fm|Eb|Gc|1Pt|2Pt|1Gv|2Gv|3Gv|Gd|Ap)\s+\d+[\s,.-]+\d+(?:[-–]\d+)?")

def firestore_value(value):
    if value is None:
        return {"nullValue": None}
    if isinstance(value, str):
        return {"stringValue": value}
    if isinstance(value, bool):
        return {"booleanValue": value}
    if isinstance(value, int):
        return {"integerValue": str(value)}
    if isinstance(value, dict):
        return {"mapValue": {"fields": {k: firestore_value(v) for k, v in value.items()}}}
    raise TypeError(f"Unsupported Firestore value: {type(value)}")

def parse_cei(day):
    url = "https://www.chiesacattolica.it/liturgia-del-giorno/?data-liturgia=" + day.replace("-", "")
    request = Request(url, headers={"User-Agent": "CalendarioCattolico/1.0"})
    with urlopen(request, timeout=35) as reply:
        html = reply.read().decode("utf-8", errors="replace")
    soup = BeautifulSoup(html, "html.parser")
    head = soup.find("h3")
    title = head.get_text(" ", strip=True) if head else ""
    match = re.search(r"Colore Liturgico\s*([^<\n]+)", html, re.I)
    color = BeautifulSoup(match.group(1), "html.parser").get_text(" ", strip=True) if match else ""
    h2s = soup.find_all("h2")
    def reading(label):
        start = next((h for h in h2s if h.get_text(" ", strip=True).casefold() == label.casefold()), None)
        if not start:
            return None
        parts = []
        for item in start.next_elements:
            if getattr(item, "name", None) == "h2" and item is not start:
                break
            if getattr(item, "name", None) is None and isinstance(item, str):
                text = item.strip()
                if text:
                    parts.append(text)
        raw = " ".join(parts)
        raw = re.sub(r"\s+", " ", raw).strip()
        ref = REF_PATTERN.search(raw)
        reference = (ref.group(1).strip() + " " + ref.group(2).replace("–", "-")) if ref else ""
        body = REF_REMOVE.sub("", raw).strip()
        body = re.sub(r"^(?:[^.]{0,180})?(Dal libro|Dalla lettera|Dagli Atti|Dal Vangelo)", r"\1", body, flags=re.I)
        return {"riferimento": reference, "testo": body} if body else None
    readings = {"prima": reading("Prima Lettura"), "salmo": reading("Salmo Responsoriale"),
                "seconda": reading("Seconda Lettura"), "vangelo": reading("Vangelo")}
    gospel = readings["vangelo"]
    if not gospel or len(gospel["testo"]) < 80:
        raise RuntimeError("CEI gospel missing or incomplete; abort without deleting any data")
    return {"date": day, "source": "CEI", "sourceUrl": url, "celebrazione": title,
            "colore": color, "letture": readings, "audio": {}, "schemaVersion": 1}

def main():
    if os.environ.get("FIREBASE_PROJECT_ID", PROJECT) != PROJECT:
        raise RuntimeError("Wrong project ID: refusing to write")
    if os.environ.get("GITHUB_EVENT_NAME") == "schedule":
        utc_hour = datetime.now(ZoneInfo("UTC")).hour
        # Cron at 22:15 and 23:15 UTC; only accept 00:xx in Rome.
        if datetime.now(ZoneInfo("Europe/Rome")).hour != 0:
            print("Not Italian midnight hour; skipping.")
            return
    # GitHub OIDC -> Workload Identity Federation -> dedicated service account.
    # google-github-actions/auth provides GOOGLE_APPLICATION_CREDENTIALS.
    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        raise RuntimeError("GitHub Workload Identity credentials unavailable; refusing writes")
    creds, authenticated_project = google.auth.default(
        scopes=["https://www.googleapis.com/auth/datastore"])
    if authenticated_project and authenticated_project != PROJECT:
        raise RuntimeError("Authenticated Google Cloud project differs; refusing writes")
    session = AuthorizedSession(creds)
    url = ROOT + "/dailyLiturgies/" + DATE
    existing = session.get(url, timeout=25)
    if existing.status_code == 200:
        fields = existing.json().get("fields", {})
        if fields.get("source", {}).get("stringValue") == "CEI" and fields.get("date", {}).get("stringValue") == DATE:
            print("Today's liturgy already exists; skipping publication")
        else:
            raise RuntimeError("Today's document exists but is unrecognized: refusing overwrite")
    elif existing.status_code == 404:
        data = parse_cei(DATE)
        response = session.patch(url + "?currentDocument.exists=false",
            json={"fields": {key: firestore_value(value) for key, value in data.items()}}, timeout=30)
        response.raise_for_status()
        print("Published current-day liturgy", DATE)
    else:
        existing.raise_for_status()

    # Cleanup only this dedicated collection, and only after current data was validated.
    listing = session.get(ROOT + "/dailyLiturgies?pageSize=100", timeout=30)
    listing.raise_for_status()
    for doc in listing.json().get("documents", []):
        date_id = doc["name"].rsplit("/", 1)[-1]
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_id) and date_id != DATE:
            deletion = session.delete(ROOT + "/dailyLiturgies/" + date_id, timeout=30)
            deletion.raise_for_status()
            print("Removed non-current daily document", date_id)
    # Iterate if more than 100 documents exist; no silent incomplete cleanup.
    if listing.json().get("nextPageToken"):
        raise RuntimeError("Unexpected >100 documents: pagination must be implemented before cleanup")
    print("Done. Current day:", DATE)

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("Publication failed:", exc, file=sys.stderr)
        raise
