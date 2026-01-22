# 0 Story Points – Triviale Änderungen

> **Aufwand:** Minimal, oft unter 15 Minuten
> **Risiko:** Nahezu keines
> **Tests:** Meist nicht erforderlich

---

## Beispiel 1: Feature-Flag aktivieren

**Titel:** Feature-Flag für Dark Mode aktivieren

**Beschreibung:**
Das Dark-Mode-Feature ist bereits implementiert, aber deaktiviert. Das Feature-Flag in der Konfigurationsdatei auf `true` setzen.

**Akzeptanzkriterien:**

- [ ] `config/features.json` → `darkMode: true`
- [ ] Deployment durchführen

---

## Beispiel 2: Umgebungsvariable anpassen

**Titel:** API-Timeout von 5s auf 10s erhöhen

**Beschreibung:**
Der Timeout-Wert für API-Calls soll in der `.env`-Datei von 5000ms auf 10000ms geändert werden.

**Akzeptanzkriterien:**

- [ ] `API_TIMEOUT=10000` in `.env.production`
- [ ] Keine Code-Änderung nötig

---

## Beispiel 3: Statischen Text korrigieren

**Titel:** Tippfehler im Footer korrigieren

**Beschreibung:**
Im Footer steht "Kontkat" statt "Kontakt". Korrektur in der entsprechenden Komponente.

**Akzeptanzkriterien:**

- [ ] Tippfehler behoben
- [ ] Visuelle Prüfung im Browser

---

## Warum 0 Punkte?

- Keine Logik betroffen
- Änderung ist atomar und isoliert
- Kein Risiko für Seiteneffekte
- Kann während eines Meetings erledigt werden
