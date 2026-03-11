# SAT — Next.js App on Replit

## Project Overview
A Next.js 16 application using PandaCSS for styling, Jotai for state management, and XYFlow/React for flow diagrams. Migrated from Vercel to Replit.

## Architecture
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: PandaCSS (`@pandacss/dev`) — generates `styled-system/` at build/dev time
- **State**: Jotai atoms
- **UI Components**: Ark UI, Framer Motion, XYFlow
- **Testing**: Vitest (unit), Playwright (e2e)
- **Package Manager**: npm

## Directory Structure
- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — React components
- `src/lib/` — Shared utilities
- `src/state/` — Jotai atoms
- `src/theme/` — PandaCSS theme tokens, recipes, styles
- `styled-system/` — Generated PandaCSS output (gitignored)
- `public/` — Static assets

## Running the App
The `dev` script runs PandaCSS in watch mode alongside Next.js dev server:
```
npm run dev
```
Serves on port 5000 at 0.0.0.0 (required for Replit preview).

## Replit Configuration
- **Workflow**: "Start application" → `npm run dev` → port 5000
- **Port**: 5000 (required for Replit webview)
- **Host**: 0.0.0.0 (required for Replit proxy)
- No environment secrets required for basic operation

## Key Notes
- PandaCSS generates `styled-system/` — this runs as a watcher in dev mode
- No instrumentation.ts file present (nothing to disable)
- No external API keys required
