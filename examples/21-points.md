# 21 Story Points – Sehr große Änderungen

> **Aufwand:** 1–2 Wochen
> **Risiko:** Hoch
> **Tests:** Umfangreiche Test-Suite + QA-Review

---

## Beispiel 1: Rollenbasierte Berechtigungen

**Titel:** Rollen- und Rechtesystem implementieren

**Beschreibung:**
Einführung von Rollen (Admin, Manager, User) mit granularen Berechtigungen. UI-Elemente und API-Endpunkte werden entsprechend geschützt.

**Akzeptanzkriterien:**

- [ ] Rollen: Admin, Manager, User, Gast
- [ ] Berechtigungen pro Feature (CRUD)
- [ ] Admin-UI zur Rollenverwaltung
- [ ] Frontend: Bedingte Anzeige von Elementen
- [ ] Backend: Middleware für Autorisierung
- [ ] Audit-Log für Rechteänderungen
- [ ] Migration bestehender User

---

## Beispiel 2: Multi-Tenancy

**Titel:** Mandantenfähigkeit einführen

**Beschreibung:**
Die Anwendung soll mehrere unabhängige Mandanten (Firmen) unterstützen. Strikte Datentrennung.

**Akzeptanzkriterien:**

- [ ] Tenant-ID in allen relevanten Tabellen
- [ ] Subdomain- oder Header-basierte Tenant-Erkennung
- [ ] Tenant-Switcher für Super-Admins
- [ ] Isolierte Daten pro Tenant
- [ ] Tenant-spezifische Konfiguration
- [ ] Migration bestehender Daten

---

## Beispiel 3: Internationalisierung (i18n)

**Titel:** Komplette Mehrsprachigkeit (DE, EN, FR)

**Beschreibung:**
Die gesamte Anwendung soll in drei Sprachen verfügbar sein. Dynamischer Sprachwechsel ohne Reload.

**Akzeptanzkriterien:**

- [ ] Alle UI-Texte externalisiert
- [ ] Sprachdateien für DE, EN, FR
- [ ] Sprachwechsler im Header
- [ ] Sprache in User-Einstellungen speicherbar
- [ ] Datums- und Zahlenformate lokalisiert
- [ ] RTL-Support vorbereitet

---

## Warum 21 Punkte?

- Breite Änderungen im gesamten System
- Architektur-Impact
- Hohes Risiko für Regressionen
- Aufwändige Migration
- Intensives Testing nötig
