# Planning Poker 🃏

Ein modernes Planning Poker Tool für agile Teams, entwickelt mit Nuxt 3, TypeScript und Tailwind CSS.

## ✨ Features

- **Echtzeit-Schätzungen**: Schätze User Stories gemeinsam mit deinem Team
- **Fibonacci-Skala**: Standard Poker-Werte (0, 0.5, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕)
- **Statistiken**: Durchschnitt, Median und Vote-Verteilung
- **Konsens-Erkennung**: Automatische Erkennung wenn alle gleich abstimmen
- **Beobachter-Modus**: Teilnehmen ohne abzustimmen
- **Responsives Design**: Optimiert für Desktop und Mobile

## 🛠️ Technologie-Stack

- **Framework**: [Nuxt 3](https://nuxt.com/) (v4 Kompatibilität)
- **Sprache**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Package Manager**: [Bun](https://bun.sh/)
- **Icons**: [@nuxt/icon](https://icones.js.org/)
- **Fonts**: [@nuxt/fonts](https://fonts.nuxtjs.org/)

## 📁 Projektstruktur

```text
planning-poker/
├── app/
│   ├── assets/css/        # Globale Styles
│   ├── components/        # Vue-Komponenten
│   ├── composables/       # Wiederverwendbare Logik
│   ├── pages/             # Routen/Seiten
│   ├── types/             # TypeScript Typen
│   └── utils/             # Utility-Klassen
├── public/                # Statische Assets
├── nuxt.config.ts         # Nuxt Konfiguration
├── tailwind.config.ts     # Tailwind Konfiguration
└── package.json
```

## 🚀 Schnellstart

### Installation

```bash
bun install
```

### Entwicklung

```bash
# Entwicklungsserver starten (http://localhost:3000)
bun run dev
```

### Produktion

```bash
# Für Produktion bauen
bun run build

# Produktions-Build testen
bun run preview
```

## 📖 Architektur

Das Projekt folgt DRY und OOP-Prinzipien:

- **Composables**: Wiederverwendbare Logik in `composables/`
- **Utility-Klassen**: `Participant` und `Session` Klassen
- **Typen**: Zentrale TypeScript-Definitionen in `types/`

## 📄 Lizenz

MIT License
