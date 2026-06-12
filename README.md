# My Quizlet

Personal English vocabulary flashcard PWA — React + Node.js + PostgreSQL + Groq AI.

## Quick Start

### 1. Start the database

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env         # adjust DATABASE_URL if needed
npm install
npm run db:migrate:dev       # runs Prisma migrations
npm run dev                  # http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

Open http://localhost:5173. The frontend proxies `/api` → backend.

---

## Import Words

```bash
cd scripts
cp .env.example .env         # set DATABASE_URL + GROQ_API_KEY
npm install

# Create a plain-text file, one word/phrase per line
cat > words.txt <<EOF
latency
throughput
eventual consistency
trade-off
EOF

npx ts-node importWords.ts words.txt
```

The script:
1. Deduplicates against existing cards (case-insensitive, plural variants, hyphen variants)
2. Sends to Groq for translation, pronunciation, example sentence, and category
3. Upserts categories and inserts cards
4. Prints an import report

---

## Reorganise Categories

```bash
cd scripts
npx ts-node reorganizeCategories.ts
```

Analyses all categories and cards with AI:
- **Splits** categories with > 60 cards into focused subcategories
- **Merges** categories with < 10 cards into nearest peers
- Prints a reorganisation report

---

## Project Structure

```
my-quizlet/
├── backend/                  Node.js + Express + Prisma
│   ├── prisma/schema.prisma
│   └── src/
│       ├── repositories/     Data access layer
│       ├── services/         Business logic
│       ├── routes/           Express route handlers
│       └── middleware/       Error handling
├── frontend/                 React + Vite PWA
│   └── src/
│       ├── components/       Reusable UI
│       ├── hooks/            React Query hooks + session logic
│       ├── pages/            Home, Study, Search
│       └── services/api.ts   Typed fetch wrapper
├── scripts/                  AI-powered CLI tools
│   ├── importWords.ts
│   └── reorganizeCategories.ts
└── docker-compose.yml        PostgreSQL
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | All categories with card count |
| GET | `/cards` | All cards (weighted shuffle) |
| GET | `/cards?categoryId=<id>` | Cards in a category |
| GET | `/cards/difficult` | Cards with difficulty > 3, sorted |
| GET | `/cards/search?q=<query>` | Full-text search |
| POST | `/cards/:id/review` | `{ known: true/false }` — updates stats |
| GET | `/health` | Health check |

---

## Learning Algorithm

- Cards start in a weighted-shuffled queue (harder cards tend to come first)
- **I Know** → card removed from queue, `success_count++`, `difficulty--`
- **I Don't Know** → card reinserted 3 positions later, `failure_count++`, `difficulty++`
- Session ends when queue is empty; user can repeat or go back

---

## PWA

The frontend is a fully offline-capable PWA:
- Install via browser "Add to Home Screen"
- Cached shell + API responses via Workbox
- Mobile-first dark design, safe-area aware

---

## Environment Variables

### Backend `.env`

```
DATABASE_URL=postgresql://quizlet:quizlet@localhost:5432/quizlet
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Scripts `.env`

```
DATABASE_URL=postgresql://quizlet:quizlet@localhost:5432/quizlet
GROQ_API_KEY=gsk_...
```

### Frontend (optional)

```
VITE_API_URL=http://localhost:3000   # default: /api (uses Vite proxy in dev)
```

---

## Deployment

**Frontend** — build with `npm run build`, deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages). Set `VITE_API_URL` to your backend URL.

**Backend** — build with `npm run build`, deploy `dist/` to any Node host (Railway, Fly.io, Render). Run `npm run db:migrate` on startup.
