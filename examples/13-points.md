# 13 Story Points – Große Änderungen

> **Aufwand:** 3–5 Tage
> **Risiko:** Hoch
> **Tests:** Vollständige Test-Abdeckung erforderlich

---

## Beispiel 1: Mehrstufiger Wizard

**Titel:** Onboarding-Wizard für neue Kunden

**Beschreibung:**
Ein 4-stufiger Wizard führt neue Kunden durch die Einrichtung: Firmendaten, Kontaktperson, Zahlungsmethode, Zusammenfassung.

**Akzeptanzkriterien:**

- [ ] 4 Schritte mit Fortschrittsanzeige
- [ ] Validierung pro Schritt
- [ ] Zurück-Navigation ohne Datenverlust
- [ ] Zwischenspeicherung (Session/LocalStorage)
- [ ] Finale Übersicht vor Absenden
- [ ] Fehlerbehandlung beim Submit
- [ ] Mobile-optimiert

---

## Beispiel 2: Dashboard mit Widgets

**Titel:** Anpassbares Dashboard

**Beschreibung:**
User können ihr Dashboard mit Widgets personalisieren: Hinzufügen, Entfernen, Größe ändern, Position ändern.

**Akzeptanzkriterien:**

- [ ] Widget-Bibliothek (min. 5 Widgets)
- [ ] Drag & Drop für Positionierung
- [ ] Resize per Handle
- [ ] Layout wird gespeichert
- [ ] Reset auf Standard-Layout
- [ ] Responsive Grid

---

## Beispiel 3: Benachrichtigungszentrale

**Titel:** In-App-Benachrichtigungen

**Beschreibung:**
Zentrale für alle Benachrichtigungen: Glocke mit Badge, Dropdown mit Liste, Gelesen/Ungelesen-Status.

**Akzeptanzkriterien:**

- [ ] Glocken-Icon mit Ungelesen-Zähler
- [ ] Dropdown mit Benachrichtigungsliste
- [ ] Als gelesen markieren (einzeln/alle)
- [ ] Verlinkung zur relevanten Seite
- [ ] Echtzeit-Updates (WebSocket)
- [ ] Persistenz in Datenbank

---

## Warum 13 Punkte?

- Komplexes State-Management
- Mehrere Ansichten/Komponenten
- Persistenz erforderlich
- Hoher Testaufwand
- Potenzielle Edge-Cases
