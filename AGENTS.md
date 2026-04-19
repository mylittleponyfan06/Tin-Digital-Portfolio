# Repository Guidelines

## Project Structure & Module Organization
This repository currently has two layers:

- Root: the legacy static portfolio, including `index.html`, section pages like `about.html`, folder-based redirects such as `about/`, and shared assets in `assets/` and `data/`.
- `web/`: the active Next.js app that will replace the static site over time.

Inside `web/src/`, keep App Router routes in `app/`, reusable UI in `components/`, shared helpers and Supabase logic in `lib/`, and shared types in `types/`. Database migrations live in `web/supabase/migrations/`.

## Build, Test, and Development Commands
Run app commands from `web/`:

- `npm run dev` starts the Next.js app locally.
- `npm run build` creates the production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint with Next.js rules.
- `npm run typecheck` runs strict TypeScript checks.

The root static site has no build step; update its HTML, CSS, and JS files directly when maintaining legacy pages.

## Coding Style & Naming Conventions
Use TypeScript for all new app code and match the existing style:

- 2-space indentation in TS, TSX, CSS, and SQL files
- PascalCase for React components
- camelCase for variables and functions
- kebab-case for route folders and most file names

Keep Tailwind utilities readable and grouped logically. Put secure game logic in server actions or Supabase SQL, not in client-only checks.

## Testing Guidelines
There is no formal automated test suite yet. Every app change should pass:

- `npm run lint`
- `npm run typecheck`
- manual smoke testing for auth, navigation, and Imposter room flows

When tests are added, place them near the feature or under `web/src/__tests__/` and use `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Recent commits use short subjects such as `Fix custom domain paths and redirects`, plus mixed prefixes like `Feat:` and `update:`. Keep new commits short, imperative, and specific. Prefer one consistent pattern, for example: `feat: add imposter lobby refresh`.

Pull requests should include a short summary, linked issue or task when applicable, screenshots for visible UI changes, and notes for any new env vars, SQL migrations, or Vercel/Supabase setup steps.

## Security & Configuration Tips
Keep secrets in `web/.env.local` and mirror required keys in `web/.env.example`. Never commit live credentials. For protected flows, prefer Supabase RPC, Row Level Security, and server-side checks over trusting the client.
