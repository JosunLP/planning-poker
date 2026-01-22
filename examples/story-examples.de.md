# Beispiel-Storys je Story-Point-Größe

Diese Beispiele orientieren sich an den in der Codebase definierten Kartenwerten (`POKER_VALUES`).

## Übersicht

| Story Points | Beispiel-Story                | Kurzbeschreibung                                           | Warum diese Größe?                       |
| ------------ | ----------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| 0            | "Feature-Flag setzen"         | Flag in Konfiguration aktivieren, keine Codeänderung.      | Reine Konfig-Änderung, kein Risiko.      |
| 1            | "Icon im Button tauschen"     | Standard-Icon gegen neues Icon austauschen.                | Kleiner UI-Change, geringe Tests.        |
| 2            | "Neues Feld im Formular"      | Ein zusätzliches optionales Eingabefeld inkl. Validierung. | Überschaubar, 1–2 Komponenten betroffen. |
| 3            | "Einfache Liste filtern"      | Filter für Status in einer Liste hinzufügen.               | Mehrere States, UI + Logik.              |
| 5            | "CSV-Export"                  | Export einer Liste als CSV inkl. Header.                   | Logik + UI + Tests nötig.                |
| 8            | "E-Mail-Benachrichtigung"     | Versand einer Bestätigungs-E-Mail bei Aktion.              | Integration + Fehlerfälle.               |
| 13           | "Mehrstufiger Wizard"         | 3-Schritt-Wizard mit Zwischenspeicher.                     | Mehrere Views, State-Handling.           |
| 21           | "Rollenbasierte Sicht"        | Features nach Rollen ein-/ausblenden.                      | Breite Änderung in UI + Logik.           |
| 40           | "Caching-Layer"               | Serverseitiges Caching mit Invalidierung.                  | Architektur-Impact, viele Edge-Cases.    |
| 100          | "Systemweite Auth-Umstellung" | Wechsel auf neuen Auth-Provider.                           | Sehr groß, Risiko, viele Abhängigkeiten. |
| ?            | "Unklarer Import"             | Anforderungen für Datenimport fehlen.                      | Umfang unbekannt, zuerst klären.         |
| ☕            | "Pause / Break"               | Story wird nicht geschätzt.                                | Nicht Teil der Schätzung (z. B. Break).  |

## Hinweise

- Die Beispiele sind bewusst generisch gehalten und sollen nur als Richtwert dienen.
- Passen Sie die Storys an Ihre Teamkonventionen und Domäne an.
