# Planning Poker - Copilot Instructions

## Projektübersicht
Ein Planning Poker Tool entwickelt mit Nuxt 3, TypeScript und Tailwind CSS.

## Technologie-Stack
- **Framework**: Nuxt 3
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: Bun
- **Architektur**: DRY, OOP-Prinzipien

## Code-Konventionen

### TypeScript
- Strenge Typisierung verwenden
- Interfaces für alle Datenstrukturen definieren
- Klassen für wiederverwendbare Logik nutzen
- JSDoc-Kommentare für öffentliche Methoden

### Komponenten
- Composition API mit `<script setup lang="ts">`
- Props und Emits typisieren
- Composables für wiederverwendbare Logik

### Styling
- Tailwind Utility-Klassen bevorzugen
- Konsistente Farbpalette aus tailwind.config

### Architektur
- DRY: Wiederverwendbare Composables und Utils
- OOP: Klassen für komplexe Geschäftslogik
- Separation of Concerns

## Projektstruktur
```
├── components/     # Vue-Komponenten
├── composables/    # Wiederverwendbare Logik
├── pages/          # Routen
├── types/          # TypeScript Typdefinitionen
├── utils/          # Hilfsfunktionen
└── assets/         # Styles und Assets
```

## Befehle
```bash
bun install         # Abhängigkeiten installieren
bun run dev         # Entwicklungsserver starten
bun run build       # Produktion bauen
bun run preview     # Produktion testen
```
