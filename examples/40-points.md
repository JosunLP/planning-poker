# 40 Story Points – Epische Änderungen

> **Aufwand:** 2–4 Wochen
> **Risiko:** Sehr hoch
> **Tests:** Vollständige Regression + Performance-Tests
> ⚠️ **Empfehlung:** In kleinere Stories aufteilen!

---

## Beispiel 1: Echtzeit-Collaboration

**Titel:** Gleichzeitiges Bearbeiten von Dokumenten

**Beschreibung:**
Mehrere User können dasselbe Dokument gleichzeitig bearbeiten. Änderungen werden in Echtzeit synchronisiert (Google Docs-Stil).

**Akzeptanzkriterien:**

- [ ] Operational Transformation oder CRDT
- [ ] WebSocket-basierte Synchronisation
- [ ] Cursor-Position anderer User sichtbar
- [ ] Konfliktauflösung
- [ ] Offline-Unterstützung mit Sync
- [ ] Versionshistorie
- [ ] Performance bei 10+ gleichzeitigen Usern

---

## Beispiel 2: Workflow-Engine

**Titel:** Konfigurierbarer Genehmigungsworkflow

**Beschreibung:**
Admins können Genehmigungsworkflows definieren: Schritte, Bedingungen, Eskalationen, Benachrichtigungen.

**Akzeptanzkriterien:**

- [ ] Visueller Workflow-Editor
- [ ] Schritte: Genehmigung, Bedingung, Aktion
- [ ] Rollen-basierte Genehmiger
- [ ] Eskalation bei Timeout
- [ ] E-Mail- und In-App-Benachrichtigungen
- [ ] Audit-Trail
- [ ] Parallele und sequenzielle Pfade

---

## Beispiel 3: Reporting-Modul

**Titel:** Individuelles Report-System

**Beschreibung:**
User können eigene Reports erstellen: Datenquellen wählen, Filter setzen, Visualisierung auswählen, als PDF/Excel exportieren.

**Akzeptanzkriterien:**

- [ ] Report-Builder UI
- [ ] Datenquellen-Auswahl
- [ ] Filter und Gruppierung
- [ ] Chart-Typen: Balken, Linie, Pie, Tabelle
- [ ] Speicherbare Reports
- [ ] Zeitgesteuerte Ausführung
- [ ] Export: PDF, Excel, CSV
- [ ] Berechtigungen pro Report

---

## Warum 40 Punkte?

- Mehrere Wochen Entwicklungszeit
- Hochkomplexe Architektur
- Viele Abhängigkeiten
- Hohes Risiko
- **Sollte in kleinere Stories zerlegt werden!**
