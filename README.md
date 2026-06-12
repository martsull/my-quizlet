# My Quizlet

Personal English vocabulary flashcard PWA.

**Production stack:** GitHub Pages → Cloudflare Worker → Neon PostgreSQL

---

## Architecture

```
GitHub Pages  (frontend PWA)
      ↓  HTTPS
Cloudflare Worker  (Hono API — vocab-api.*.workers.dev)
      ↓  SQL over HTTP
Neon PostgreSQL  (serverless Postgres)
```

---

## Repository layout

```
my-quizlet/
├── frontend/          React + Vite PWA  →  GitHub Pages
├── worker/            Hono API          →  Cloudflare Worker
├── scripts/           AI import tools   →  run locally against Neon
├── backend/           Express scaffold  (local dev reference, not deployed)
└── .github/workflows/ CI/CD pipelines
```

---

## First-time setup

### 1. Neon database

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string: `postgresql://user:pass@host/db?sslmode=require`
3. Run the Prisma migration from the backend folder to create the schema:

```bash
cd backend
cp .env.example .env         # paste your Neon DATABASE_URL
npm install
npx prisma migrate deploy
```

---

### 2. Cloudflare Worker

```bash
cd worker
npm install
npx wrangler login

# Store the Neon connection string as a secret (not in wrangler.toml)
npx wrangler secret put DATABASE_URL

# Deploy
npm run deploy
# → note the *.workers.dev URL it prints
```

---

### 3. GitHub repository

```bash
# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/my-quizlet.git
git push -u origin main
```

Add these **Repository Secrets** (Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Worker:Edit permission |
| `DATABASE_URL` | Neon connection string |
| `VITE_API_URL` | Your worker URL, e.g. `https://vocab-api.xyz.workers.dev` |

Enable GitHub Pages (Settings → Pages → Source: `gh-pages` branch).

On every push to `main`:
- Changes in `frontend/` → auto-deploys to GitHub Pages
- Changes in `worker/` → auto-deploys to Cloudflare

---

## Local development

### Frontend (against production worker)

```bash
cd frontend
cp .env.example .env         # set VITE_API_URL to your worker URL
npm install
npm run dev                  # http://localhost:5173
```

### Frontend (against local Express backend)

```bash
# Terminal 1 — start local Postgres
docker compose up -d

# Terminal 2 — start Express backend
cd backend && cp .env.example .env && npm install && npm run dev

# Terminal 3 — start frontend (proxy → localhost:3000)
cd frontend
# VITE_API_URL must be unset so the Vite proxy kicks in
npm run dev
```

### Worker (local)

```bash
cd worker
cp .env.example .dev.vars    # wrangler reads .dev.vars for local secrets
npm run dev                  # http://localhost:8787
```

---

## Import words with AI

```bash
cd scripts
cp .env.example .env         # set DATABASE_URL + GROQ_API_KEY
npm install

cat > words.txt <<EOF
latency
throughput
eventual consistency
trade-off
EOF

npx ts-node importWords.ts words.txt
```

---

## Reorganise categories

```bash
cd scripts
npx ts-node reorganizeCategories.ts
```

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | All categories with card count |
| GET | `/cards` | All cards (weighted shuffle) |
| GET | `/cards?categoryId=<id>` | Cards in category |
| GET | `/cards/difficult` | difficulty > 3, sorted desc |
| GET | `/cards/search?q=<query>` | Full-text search |
| POST | `/cards/:id/review` | `{ known: true\|false }` — update stats |
| GET | `/health` | Health check |

---

## Environment variables

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | prod only | Worker URL |
| `VITE_BASE_PATH` | CI only | GitHub Pages base path (e.g. `/my-quizlet/`) |

### Worker (secrets via `wrangler secret put`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | Neon connection string |

### Scripts

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | Neon connection string |
| `GROQ_API_KEY` | yes | Groq API key |
