# MadFood

MadFood is a React + TypeScript PWA for meal planning, recipes, and shopping lists, powered by Supabase.

## Tech stack

- React + TypeScript + Vite
- React Router
- Supabase (Auth + Postgres + Storage)
- date-fns
- lucide-react
- vite-plugin-pwa
- gh-pages

## Local development

1. Install Node.js 20+.
2. Install dependencies:

```bash
npm install
```

3. Set environment variables in `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Apply the database schema in Supabase SQL editor:

- Run [`supabase/schema.sql`](./supabase/schema.sql)

5. Start dev server:

```bash
npm run dev
```

## Supabase setup notes

- Authentication uses email/password via Supabase Auth.
- Password reset links return to `/update-password`.
- All application tables use row-level security with per-user ownership.
- `recipe-images` storage bucket and policies are scaffolded in the schema.

## Build and preview

```bash
npm run build
npm run preview
```

The build step also creates `dist/404.html` from `dist/index.html` so GitHub Pages SPA routes resolve correctly.

## GitHub Pages deployment

1. Ensure your repository name is `madfood` (or update `base` in `vite.config.ts`).
2. Commit and push your code.
3. Deploy manually:

```bash
npm run deploy
```

4. In GitHub repo settings:
- Open **Settings -> Pages**
- Set source branch to `gh-pages`

After deployment, the app is available at:

`https://<your-username>.github.io/madfood/`
