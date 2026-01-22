# 5 Story Points – Mittlere Änderungen

> **Aufwand:** 1–2 Tage
> **Risiko:** Moderat
> **Tests:** Unit-, Integrations- und E2E-Tests empfohlen

---

## Beispiel 1: CSV-Export

**Titel:** Bestellungen als CSV exportieren

**Beschreibung:**
Ein Button in der Bestellübersicht ermöglicht den Download aller angezeigten Bestellungen als CSV-Datei.

**Akzeptanzkriterien:**

- [ ] Button "Als CSV exportieren"
- [ ] Spalten: Bestellnr, Datum, Kunde, Summe
- [ ] Deutsche Formatierung (Datum, Dezimalzahlen)
- [ ] UTF-8 mit BOM für Excel-Kompatibilität
- [ ] Download startet sofort

---

## Beispiel 2: Pagination

**Titel:** Serverseitige Pagination für Artikelliste

**Beschreibung:**
Die Artikelliste soll paginiert werden (20 Artikel pro Seite). Navigation über Seitenzahlen.

**Akzeptanzkriterien:**

- [ ] API-Endpunkt mit `page` und `limit`
- [ ] Seitennavigation (Vor/Zurück, Seitenzahlen)
- [ ] URL-Sync (`?page=2`)
- [ ] Loading-State während Laden
- [ ] Sprung zu Seite 1 bei Filteränderung

---

## Beispiel 3: Bildupload

**Titel:** Profilbild hochladen

**Beschreibung:**
User können ein Profilbild hochladen. Vorschau vor Upload, Validierung von Typ und Größe.

**Akzeptanzkriterien:**

- [ ] Drag & Drop oder Datei-Auswahl
- [ ] Erlaubt: JPG, PNG, max. 5 MB
- [ ] Vorschau vor Upload
- [ ] Fortschrittsanzeige
- [ ] Altes Bild ersetzen

---

## Warum 5 Punkte?

- Frontend + Backend betroffen
- Mehrere Komponenten
- Error-Handling nötig
- Testaufwand moderat bis hoch
