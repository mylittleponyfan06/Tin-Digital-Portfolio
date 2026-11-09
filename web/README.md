# Qwiosky App

Portfolio-first Next.js app for `qwiosky.lol`, built to replace the legacy static site over time.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Local JSON storage in `web/.data/app.json`
- Cookie-based local auth
- Vercel-compatible frontend build

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

Use `npm.cmd run ...` in PowerShell if `npm.ps1` is blocked by execution policy.

## Routes

- `/`
- `/projects`
- `/about`
- `/games`
- `/games/imposter`
- `/games/imposter/rooms/[roomCode]`
- `/auth/sign-in`
- `/auth/sign-up`
- `/auth/error`
- `/account`

## Local Data

The app stores users, profiles, Imposter rooms, rounds, votes, and leaderboard data in:

```text
web/.data/app.json
```

That directory is gitignored. Delete the file to reset local app data.

## Current Tradeoff

This is intentionally light: no external database, no email confirmation, no realtime push updates. Imposter rooms use a manual Refresh button after another player acts. Add a real database again only when persistence across deployments or multi-instance hosting matters.
