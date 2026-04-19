# Qwiosky App

Portfolio-first Next.js app scaffold for `qwiosky.lol`, built to replace the static HTML site over time without forcing a repo split on day one.

## Recommended repo setup

Use the current repo and keep the real app in `web/`.

Why this is the best fit right now:

- Your static portfolio can stay at the repo root while the app grows safely in parallel.
- Vercel can point the project Root Directory to `web`.
- If you later want a dedicated repo, the `web/` folder is already self-contained.

When to split into a new repo later:

- The app becomes the primary product and the static root files are no longer useful.
- You want cleaner CI, PR history, and deployment ownership around the app only.

## Folder structure

```text
web/
  src/
    app/
      about/
      account/
      auth/
      games/
        imposter/
          rooms/[roomCode]/
      projects/
      auth/confirm/route.ts
      layout.tsx
      page.tsx
    components/
      account/
      auth/
      games/imposter/
      layout/
      ui/
    lib/
      actions/
      imposter/
      supabase/
      auth.ts
      env.ts
      site.ts
      utils.ts
    proxy.ts
    types/database.ts
  supabase/
    migrations/0001_portfolio_app.sql
  .env.example
```

## Route structure

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

## Tech decisions

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Supabase SSR client setup for browser and server
- Supabase Auth + Postgres + Realtime
- Vercel deployment
- Server-side room actions via Supabase RPC for secure game logic

## Auth setup

Environment variables used by the app:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Use the exact production hostname you actually serve. This project is now standardized on `https://qwiosky.lol`. Keep Vercel, Supabase Site URL, and this env var consistent.

The app uses a URL helper that supports:

- `http://localhost:3000`
- Vercel preview deployments via the auto-provided `VERCEL_URL`
- production via `NEXT_PUBLIC_SITE_URL`

Optional note:

- `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_URL` are provided by Vercel on the server side.
- You usually only need to set `NEXT_PUBLIC_SITE_URL` yourself for the production domain.

Recommended Supabase redirect URL configuration:

- Site URL: `https://qwiosky.lol`
- Additional Redirect URLs:
  - `http://localhost:3000/**`
  - `https://*-<your-vercel-team-or-account>.vercel.app/**`
  - `https://qwiosky.lol/**`

If you use email confirmation, update Supabase email templates to prefer `{{ .RedirectTo }}` where needed.

## Vercel setup

1. Keep the Git repo as-is.
2. In Vercel Project Settings, set Root Directory to `web`.
3. Add environment variables:
   - `NEXT_PUBLIC_SITE_URL=https://qwiosky.lol`
   - `NEXT_PUBLIC_SUPABASE_URL=...`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...`
4. Redeploy.

Notes:

- You do not need the old GitHub Pages path assumptions anymore.
- Porkbun only needs to point the domain to Vercel as you already have.
- The app is intentionally Vercel + Supabase only for MVP. No home-server dependency is required.

## Supabase setup

1. Open the SQL editor.
2. Run `supabase/migrations/0001_portfolio_app.sql`.
3. Verify the tables were added to the `supabase_realtime` publication.
4. Confirm auth email settings and redirect URLs.
5. Run `npm run check:backend` from `web/` to confirm the configured Supabase URL behaves like an API endpoint.

## Realtime architecture

Room pages subscribe to:

- `rooms`
- `room_players`
- `rounds`
- `votes`

The client does not calculate trusted game state.

Instead:

- Room create/join/start/vote/submit flows call server actions.
- Server actions call Supabase RPC functions.
- RPC functions handle imposter assignment, host checks, round transitions, and leaderboard updates.
- Realtime changes trigger `router.refresh()` so the room view stays current.

## Security model

The migration includes:

- Row Level Security on every app table
- room-member-only room access
- prompt privacy per player
- host-only round control
- authenticated-only protected data access
- unique vote constraint per round per player

Important security choice:

- Sensitive game logic lives in Postgres functions with explicit membership and host checks.
- The browser never decides who the imposter is or who wins a round.

## Migration path from the static site

Current path:

- Keep the legacy HTML files at the repo root
- Point Vercel to `web`
- Move traffic to the new app

Then, over time:

1. Recreate the core portfolio pages in the app
2. Move project content from old JSON/static markup into app-native content modules or database tables
3. Retire root-level static pages once the new app fully replaces them

## Phase plan

### Phase 1

- Portfolio shell
- Auth
- Create/join room
- Lobby
- One Imposter round
- Voting
- Results
- Leaderboard

### Phase 2

- Friend system
- Match history
- Multiple games
- Better host controls
- Categories/topics management
- Better polish and motion

### Phase 3

- Optional home-server integrations
- Secure file upload/download UI
- Media dashboard links
- Private authenticated tools

## Local development

```bash
cd web
cp .env.example .env.local
npm install
npm run check:backend
npm run dev
```

## Notes

- The `supabase/` directory is intentionally inside `web/` so this app can be moved into its own repo later with minimal friction.
- If you decide to keep everything in one repo long-term, this structure still works well with Vercel Root Directory settings.
