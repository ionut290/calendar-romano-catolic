/* Daily-only Firestore reader. No write permission or administrative credentials. */
(function () {
  "use strict";
  const PROJECT_ID = "ore-l-766fb";
  const API_KEY = "AIzaSyBqLHY8JlwEgnwrzyuFacf46CBzGMDYcQI";
  const CACHE_PREFIX = "calendar-firestore-today:";
  const NEGATIVE_CACHE_MS = 10 * 60 * 1000;
  let negativeUntil = 0;

  function todayInRome() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date());
    const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return p.year + "-" + p.month + "-" + p.day;
  }
  function clearOldCache(today) {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(CACHE_PREFIX) && key !== CACHE_PREFIX + today) {
          localStorage.removeItem(key);
        }
      }
    } catch (_) {}
  }
  function decodeFirestore(value) {
    if (!value || typeof value !== "object") return null;
    if (Object.prototype.hasOwnProperty.call(value, "stringValue")) return value.stringValue;
    if (Object.prototype.hasOwnProperty.call(value, "booleanValue")) return value.booleanValue;
    if (Object.prototype.hasOwnProperty.call(value, "integerValue")) return Number(value.integerValue);
    if (Object.prototype.hasOwnProperty.call(value, "doubleValue")) return Number(value.doubleValue);
    if (Object.prototype.hasOwnProperty.call(value, "nullValue")) return null;
    if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, decodeFirestore(v)]));
    if (value.arrayValue) return (value.arrayValue.values || []).map(decodeFirestore);
    return null;
  }
  function valid(data, date) {
    return data && data.source === "CEI" &&
      data.date === date && typeof data.letture?.vangelo?.testo === "string" &&
      data.letture.vangelo.testo.trim().length > 0;
  }
  async function read(date) {
    const today = todayInRome();
    clearOldCache(today);
    if (date !== today) return null; // Historical calendar remains on the existing provider.
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_PREFIX + today) || "null");
      if (valid(cached, today)) return cached;
    } catch (_) {}
    if (Date.now() < negativeUntil) return null;
    const endpoint = "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(PROJECT_ID) + "/databases/(default)/documents/dailyLiturgies/" +
      encodeURIComponent(today) + "?key=" + encodeURIComponent(API_KEY);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error("Firestore daily document unavailable: " + response.status);
      const raw = await response.json();
      const data = Object.fromEntries(Object.entries(raw.fields || {}).map(([k, v]) => [k, decodeFirestore(v)]));
      if (!valid(data, today)) throw new Error("Firestore daily document incomplete");
      try { localStorage.setItem(CACHE_PREFIX + today, JSON.stringify(data)); } catch (_) {}
      return data;
    } catch (error) {
      negativeUntil = Date.now() + NEGATIVE_CACHE_MS;
      console.warn("Today's Firebase liturgy unavailable; using current provider.", error);
      return null;
    }
  }
  window.CalendarFirebaseDaily = Object.freeze({ read, todayInRome });
})();
