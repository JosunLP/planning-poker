# 1 Story Point – Sehr kleine Änderungen

> **Aufwand:** 1–2 Stunden
> **Risiko:** Gering
> **Tests:** Smoke-Test empfohlen

---

## Beispiel 1: Icon austauschen

**Titel:** Button-Icon durch neues Icon ersetzen

**Beschreibung:**
Der "Speichern"-Button verwendet aktuell ein Disketten-Icon. Dieses soll durch ein modernes Checkmark-Icon ersetzt werden.

**Akzeptanzkriterien:**

- [ ] Icon in `SaveButton.vue` austauschen
- [ ] Icon-Import aktualisieren
- [ ] Visuelle Prüfung auf Desktop und Mobile

---

## Beispiel 2: Tooltip hinzufügen

**Titel:** Tooltip für Info-Icon hinzufügen

**Beschreibung:**
Das Info-Icon neben dem Preisfeld soll beim Hover einen Tooltip mit dem Text "Inkl. MwSt." anzeigen.

**Akzeptanzkriterien:**

- [ ] Tooltip-Komponente nutzen
- [ ] Text: "Inkl. MwSt."
- [ ] Tooltip erscheint bei Hover/Focus

---

## Beispiel 3: CSS-Anpassung

**Titel:** Button-Farbe an Styleguide anpassen

**Beschreibung:**
Der primäre Button verwendet `#0066cc`, laut neuem Styleguide soll es `#0052a3` sein.

**Akzeptanzkriterien:**

- [ ] Farbe in Tailwind-Config oder CSS anpassen
- [ ] Alle primären Buttons betroffen
- [ ] Keine funktionalen Änderungen

---

## Warum 1 Punkt?

- Klar abgegrenzte Aufgabe
- Nur 1–2 Dateien betroffen
- Geringe Komplexität
- Schnell testbar
