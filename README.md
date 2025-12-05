# Planning Poker 🃏

A modern Planning Poker tool for agile teams, built with Nuxt 3, TypeScript and Tailwind CSS.

## ✨ Features

- **Real-time Estimation**: Estimate user stories together with your team
- **Fibonacci Scale**: Standard poker values (0, 0.5, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕)
- **Statistics**: Average, median and vote distribution
- **Consensus Detection**: Automatic detection when everyone votes the same
- **Observer Mode**: Participate without voting
- **Responsive Design**: Optimized for desktop and mobile

## 🛠️ Technology Stack

- **Framework**: [Nuxt 3](https://nuxt.com/) (v4 compatibility)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Package Manager**: [Bun](https://bun.sh/)
- **Icons**: [@nuxt/icon](https://icones.js.org/)
- **Fonts**: [@nuxt/fonts](https://fonts.nuxtjs.org/)

## 📁 Project Structure

```text
planning-poker/
├── app/
│   ├── assets/css/        # Global styles
│   ├── components/        # Vue components
│   ├── composables/       # Reusable logic
│   ├── pages/             # Routes/pages
│   ├── types/             # TypeScript types
│   └── utils/             # Utility classes
├── public/                # Static assets
├── nuxt.config.ts         # Nuxt configuration
├── tailwind.config.ts     # Tailwind configuration
└── package.json
```

## 🚀 Quick Start

### Installation

```bash
bun install
```

### Development

```bash
# Start development server (http://localhost:3000)
bun run dev
```

### Production

```bash
# Build for production
bun run build

# Test production build
bun run preview
```

## 📖 Architecture

The project follows DRY and OOP principles:

- **Composables**: Reusable logic in `composables/`
- **Utility Classes**: `Participant` and `Session` classes
- **Types**: Central TypeScript definitions in `types/`

## 📄 License

MIT License
