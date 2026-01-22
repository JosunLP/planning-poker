# 3 Story Points – Kleine bis mittlere Änderungen

> **Aufwand:** 0,5–1 Tag
> **Risiko:** Moderat
> **Tests:** Unit- und Integrationstests empfohlen

---

## Beispiel 1: Filterbare Liste

**Titel:** Aufgabenliste nach Status filtern

**Beschreibung:**
Die Aufgabenliste soll nach Status (Offen, In Bearbeitung, Erledigt) filterbar sein. Filter-Buttons oberhalb der Liste.

**Akzeptanzkriterien:**

- [ ] Filter-Buttons für jeden Status
- [ ] "Alle"-Option
- [ ] URL-Parameter für Filter (`?status=open`)
- [ ] Leere State-Anzeige bei 0 Treffern

---

## Beispiel 2: Formular mit Validierung

**Titel:** Registrierungsformular mit Echtzeit-Validierung

**Beschreibung:**
Felder: E-Mail, Passwort, Passwort-Wiederholung. Validierung bei Blur und Submit.

**Akzeptanzkriterien:**

- [ ] E-Mail-Format prüfen
- [ ] Passwort min. 8 Zeichen
- [ ] Passwörter müssen übereinstimmen
- [ ] Fehler inline anzeigen

---

## Beispiel 3: Einfache Drag & Drop-Sortierung

**Titel:** Aufgaben per Drag & Drop umsortieren

**Beschreibung:**
Aufgaben in einer Liste sollen per Drag & Drop neu angeordnet werden können. Neue Reihenfolge wird gespeichert.

**Akzeptanzkriterien:**

- [ ] Drag-Handle an jeder Aufgabe
- [ ] Visuelle Vorschau während Drag
- [ ] Speichern nach Drop
- [ ] Touch-Support

---

## Warum 3 Punkte?

- Mehrere States zu verwalten
- UI- und Logik-Änderungen
- Moderate Komplexität
- Eventuell Edge-Cases
