# 8 Story Points – Größere Änderungen

> **Aufwand:** 2–3 Tage
> **Risiko:** Mittel bis hoch
> **Tests:** Umfangreiche Test-Suite erforderlich

---

## Beispiel 1: E-Mail-Benachrichtigungen

**Titel:** Bestätigungs-E-Mail bei Registrierung

**Beschreibung:**
Nach erfolgreicher Registrierung erhält der User eine Bestätigungs-E-Mail mit Aktivierungslink.

**Akzeptanzkriterien:**

- [ ] E-Mail-Template erstellen (HTML + Text)
- [ ] Token-basierter Aktivierungslink
- [ ] Link 24h gültig
- [ ] Fehlerbehandlung bei ungültigem/abgelaufenem Token
- [ ] Resend-Option auf der Login-Seite
- [ ] Rate-Limiting für Resend

---

## Beispiel 2: Volltextsuche

**Titel:** Artikelsuche mit Highlighting

**Beschreibung:**
Suchfeld durchsucht Titel und Beschreibung von Artikeln. Treffer werden hervorgehoben.

**Akzeptanzkriterien:**

- [ ] Suchfeld mit Debounce (300ms)
- [ ] Suche in Titel + Beschreibung
- [ ] Highlighting der Suchbegriffe
- [ ] Min. 2 Zeichen für Suche
- [ ] Leere State-Anzeige
- [ ] Performance bei 10.000+ Artikeln

---

## Beispiel 3: Kommentarsystem

**Titel:** Kommentarfunktion für Blogbeiträge

**Beschreibung:**
Eingeloggte User können Kommentare zu Blogbeiträgen schreiben. Verschachtelte Antworten möglich.

**Akzeptanzkriterien:**

- [ ] Kommentar schreiben (max. 1000 Zeichen)
- [ ] Antworten auf Kommentare (1 Ebene)
- [ ] Bearbeiten/Löschen eigener Kommentare
- [ ] Zeitstempel und Autor anzeigen
- [ ] Echtzeit-Updates (WebSocket optional)

---

## Warum 8 Punkte?

- Mehrere Systeme integriert
- Komplexe Fehlerbehandlung
- Sicherheitsaspekte
- Umfangreiche Tests nötig
