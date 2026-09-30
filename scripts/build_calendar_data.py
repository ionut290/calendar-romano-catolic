#!/usr/bin/env python3
import json, sys, time
from datetime import date, timedelta
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

API="https://parolaviva.art/api/v1/letture"

def fetch_json(url, retries=4):
    last=None
    for attempt in range(retries):
        try:
            req=Request(url, headers={"User-Agent":"calendar-romano-catolic/1.0"})
            with urlopen(req, timeout=30) as r:
                return json.load(r)
        except (HTTPError, URLError, TimeoutError) as e:
            last=e; time.sleep(1.5*(attempt+1))
    raise last

def build(year):
    out={"year":year,"source":API,"days":{}}
    d=date(year,1,1); end=date(year+1,1,1)
    while d<end:
        key=d.isoformat()
        url=f"{API}/{year}/{d.month:02d}-{d.day:02d}.json"
        try:
            out["days"][key]=fetch_json(url)
            print("OK",key)
        except Exception as e:
            print("WARN",key,e)
        d+=timedelta(days=1)
        time.sleep(.05)
    Path("data").mkdir(exist_ok=True)
    Path(f"data/{year}.json").write_text(json.dumps(out,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    print(f"Creato data/{year}.json: {len(out['days'])} giorni")
    if len(out["days"]) < 360:
        raise SystemExit(f"Dati incompleti per {year}: {len(out['days'])} giorni")

for y in map(int,sys.argv[1:] or [date.today().year,date.today().year+1]):
    build(y)
