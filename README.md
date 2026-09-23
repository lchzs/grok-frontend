# Grok Frontend

Codex-style web UI for **Grok** (xAI): multi-conversation sidebar, model switcher, agent modes, and local history.

![Grok Frontend](https://img.shields.io/badge/xAI-Grok-7c9cff) ![Vite](https://img.shields.io/badge/Vite-React_TS-646cff)

## Features

- **Conversations** — create, search, rename, pin, delete; grouped by time
- **Model switcher** — Grok 4 / Fast / 3 / Mini / 2
- **Modes** — Agent · Ask · Chat
- **Streaming replies** — token-by-token when API key is set
- **Demo mode** — works offline without a key
- **Settings** — API key, base URL, system prompt, temperature, import/export
- **Local persistence** — everything stays in `localStorage`

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## Live API (optional)

1. Open **Settings**
2. Paste an [xAI API key](https://console.x.ai/)
3. Keep base URL as `https://api.x.ai/v1` (or your proxy)

Keys are stored only in the browser.

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Dev server with HMR      |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |

## Stack

- Vite + React 19 + TypeScript
- lucide-react icons
- No backend required

## License

MIT
