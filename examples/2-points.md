# 2 Story Points – Kleine Änderungen

> **Aufwand:** Halber Tag
> **Risiko:** Gering bis moderat
> **Tests:** Unit-Tests empfohlen

---

## Beispiel 1: Neues Formularfeld

**Titel:** Optionales Telefonnummer-Feld im Kontaktformular

**Beschreibung:**
Ein optionales Eingabefeld für die Telefonnummer soll im Kontaktformular ergänzt werden. Format-Validierung für deutsche Nummern.

**Akzeptanzkriterien:**

- [ ] Neues Feld `phone` im Formular
- [ ] Label: "Telefon (optional)"
- [ ] Validierung: Nur Zahlen, +, -, Leerzeichen
- [ ] Feld wird ans Backend übermittelt

---

## Beispiel 2: Sortieroption hinzufügen

**Titel:** Artikelliste nach Preis sortieren

**Beschreibung:**
In der Artikelübersicht soll eine Sortieroption "Preis aufsteigend/absteigend" hinzugefügt werden.

**Akzeptanzkriterien:**

- [ ] Dropdown mit Sortieroptionen
- [ ] Sortierung client-seitig
- [ ] Aktive Sortierung visuell erkennbar

---

## Beispiel 3: Bestätigungsdialog

**Titel:** Bestätigungsdialog beim Löschen anzeigen

**Beschreibung:**
Vor dem Löschen eines Eintrags soll ein Modal erscheinen: "Wirklich löschen?"

**Akzeptanzkriterien:**

- [ ] Modal mit "Ja" / "Abbrechen"
- [ ] Löschen nur bei Bestätigung
- [ ] Modal ist per ESC schließbar

---

## Warum 2 Punkte?

- Mehrere Komponenten betroffen
- Einfache Logik
- Überschaubarer Testaufwand
- Wenig Risiko für Seiteneffekte
