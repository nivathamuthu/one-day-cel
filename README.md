# Birthday Moments

Make a birthday surprise (cake, balloons of reasons, photos on fairy lights, a letter) and send it as a short link that opens on any phone.

## Architecture

```
Phone / browser
   │  https://<your-site>.vercel.app/view/#s=<id>
   ▼
Vercel ── static React (Vite) site
   │  fetch(VITE_API_BASE_URL + /api/surprises/<id>)
   ▼
Render ── Express REST API  (backend/)
   │  SQL over TLS (pg)
   ▼
Supabase ── PostgreSQL table `surprises`
```

- The frontend never talks to Supabase directly and contains no database keys.
- The Render API is the only component that knows `DATABASE_URL`.
- Share links keep the existing format: `/view/#s=<10-character id>`. Older `/view/#draft=…` links still work without the server.
- Add `?preview=1` (`/view/?preview=1#s=<id>`) to open a surprise before the birthday.

## Repository layout

| Path | What it is |
| --- | --- |
| `src/` | React app (builder at `/`, viewer at `/view/`) |
| `src/lib/api.js` | API base URL, timeouts and network error handling |
| `backend/src/app.js` | Express routes, validation, CORS, rate limiting |
| `backend/src/stores/` | Storage: `postgres.js` (production), `file.js` (local), `memory.js` (tests) |
| `backend/schema.sql` | Supabase table definition |
| `backend/scripts/migrate-json.js` | Imports `data/surprises/*.json` into Supabase |
| `scripts/surprise-store.mjs` | Runs the same API inside `npm run dev` / `npm run preview` |
| `render.yaml`, `vercel.json` | Deployment configuration |

## Local development

Requires Node.js 22 or newer.

```bash
npm install
npm install --prefix backend
npm run dev            # http://localhost:5173
```

With `VITE_API_BASE_URL` empty, the Vite server answers `/api/*` itself and saves surprises as JSON files in `data/surprises/` (git-ignored). Nothing else is needed.

To test against a real database instead, run the API separately:

```bash
cp backend/.env.example backend/.env    # fill in DATABASE_URL
npm run dev --prefix backend            # http://localhost:3001
```

Then create `.env.local` in the project root containing `VITE_API_BASE_URL=http://localhost:3001` and run `npm run dev`.

Checks:

```bash
npm run build
npm run lint
npm test --prefix backend
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine). Save the database password.
2. Open **SQL Editor → New query**, paste the contents of `backend/schema.sql`, and run it.
3. Open **Project Settings → Database** (or the **Connect** button):
   - Copy the **Session pooler** connection string (port 5432). Render needs the pooler because the direct host is IPv6-only. Replace `[YOUR-PASSWORD]` with the database password. This is `DATABASE_URL`.
   - Optional but recommended: under **SSL Configuration** download the CA certificate. Its contents are `DATABASE_CA_CERT`, which makes the API verify the database certificate.

Do not use the `anon` or `service_role` API keys anywhere in this project; the API connects with the database connection string only.

### Database schema

```sql
create table if not exists public.surprises (
  id         text primary key check (id ~ '^[a-z0-9]{10}$'),
  data       jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now()
);
alter table public.surprises enable row level security;
revoke all on table public.surprises from anon, authenticated;
```

`data` holds the surprise exactly as the frontend sends it:
`{ v: 1, name, from, age, birthday: "DD-MM" | "", theme, reasons[], photos[] (data:image/… URLs), captions[], message }`.

## Deploy the API on Render

1. Push this repository to GitHub.
2. In Render: **New → Blueprint**, choose the repository. Render reads `render.yaml` and creates `birthday-moments-api` (root directory `backend`, `npm ci`, `npm start`, health check `/health`).
3. Enter the secret environment variables when asked:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase session pooler connection string |
| `DATABASE_CA_CERT` | Supabase CA certificate contents (optional, recommended) |
| `ALLOWED_ORIGINS` | Your Vercel site, e.g. `https://birthday-moments-sigma.vercel.app` (comma-separate several; `*` is refused) |
| `PUBLIC_BASE` | Same Vercel site address |

4. After the deploy, open `https://<service>.onrender.com/health`. It must return `{"status":"ok","storage":"postgres"}`.

The free plan sleeps after 15 minutes without traffic; the first request then takes up to about a minute. The site shows a "waking up" message during that time.

## Deploy the site on Vercel

1. Import the GitHub repository in Vercel (or open the existing project). Framework preset: Vite. `vercel.json` already sets the build and the `/view/` routing.
2. **Settings → Environment Variables**: add `VITE_API_BASE_URL` = `https://<service>.onrender.com` (no trailing slash) for Production.
3. Redeploy (Vite reads the variable at build time).
4. Create a test surprise on the live site and open the link on a phone.

GitHub Pages / Netlify still work as static fallbacks (`404.html` is generated, `netlify.toml` has the routes), but they also need `VITE_API_BASE_URL` set at build time to save surprises.

## Environment variables

| Where | Variable | Required | Purpose |
| --- | --- | --- | --- |
| Vercel (build) | `VITE_API_BASE_URL` | yes in production | Render API address |
| Render | `NODE_ENV` | set by `render.yaml` | `production` enables strict checks |
| Render | `DATABASE_URL` | yes | Supabase connection string |
| Render | `DATABASE_CA_CERT` | recommended | Verifies the database TLS certificate |
| Render | `ALLOWED_ORIGINS` | yes | Websites allowed to call the API |
| Render | `PUBLIC_BASE` | optional | Site address used for links created from localhost |
| Render | `RATE_LIMIT_MAX` | optional | Surprises per visitor per 15 minutes (default 30) |
| Render | `PORT` | set by Render | Listening port (local default 3001) |
| Local only | `DATA_DIR` | optional | Folder for the JSON file store |

Secrets live only in the Render dashboard or in git-ignored `.env` files.

## Migrating existing surprises

Surprises created before the cloud move are JSON files in `data/surprises/`. Import them once so old links keep working:

```bash
cd backend
cp .env.example .env          # set DATABASE_URL (and DATABASE_CA_CERT)
npm run migrate -- --dry-run  # validates every file, writes nothing
npm run migrate               # imports
```

- IDs are kept, so `/view/#s=<id>` links keep working on the new site.
- Rows that already exist are skipped, never overwritten; running it twice is safe.
- The report lists imported, skipped and failed records; the exit code is 1 if any failed.
- The JSON files are never deleted. A different folder can be passed: `npm run migrate -- path/to/folder`.

## API

All responses are JSON. Requests from browsers must come from an origin in `ALLOWED_ORIGINS`, otherwise `403`.

### `GET /health`
`200 {"status":"ok","storage":"postgres"}`, or `503` when the database is unreachable.

### `POST /api/surprises`
Body: a surprise object (`Content-Type: application/json`, max 3 MB, up to 5 photos as `data:image/…` URLs of up to 500,000 characters each).

| Status | Meaning |
| --- | --- |
| `201 {"id":"ab3kz9qmxw"}` | Saved |
| `400` | Malformed JSON or invalid fields (message in `error`) |
| `403` | Origin not allowed |
| `413` | Body too large |
| `415` | Body is not JSON |
| `429` | Too many surprises from this address; try later |
| `503` | Database unavailable; nothing was saved |

### `GET /api/surprises/:id`
`200` with the surprise, `400` for an ID that is not 10 lowercase letters/digits, `404` if not found, `503` if the database is unavailable.

### `GET /api/public-base`
`200 {"origin":"https://…"}`: the public site address used when a link is created from localhost.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Could not reach the birthday server" on the live site | `VITE_API_BASE_URL` missing or wrong in Vercel; set it and redeploy. |
| Browser console shows a CORS error / API returns 403 | Add the exact site origin (scheme + host, no trailing slash) to `ALLOWED_ORIGINS` on Render. |
| `/health` returns 503 | Wrong `DATABASE_URL` or password, or the direct (IPv6) host was used instead of the session pooler. |
| `self-signed certificate in certificate chain` | `DATABASE_CA_CERT` does not match your Supabase project; download it again or remove it. |
| Render deploy fails with `DATABASE_URL must be set` | Fill in the secret variables in the Render dashboard. |
| First load takes ~50 seconds | Render free plan waking up; expected. |
| "This surprise could not be found" for an old link | Run the migration for that machine's `data/surprises/`. |
| Links created on localhost point to localhost | Set `PUBLIC_BASE` (Render, or the environment of `npm run preview`). |
