# Suggested Commands (Darwin)

Backend (run from `backend/`):
- `npm run start:dev` — Nest watch mode
- `npm run build` — nest build
- `npm run lint` — eslint `src/**/*.ts`
- `npm test` — jest --passWithNoTests
- `npm run prisma:generate` / `npm run prisma:push` / `npm run prisma:seed` — Prisma client gen / schema push (no migrations dir, push-based) / `tsx prisma/seed.ts`
- `docker compose -f backend/docker-compose.yml up -d` — postgres, redis, minio. Non-default HOST ports (see `backend/.env.example`): postgres 5435, redis 6385, minio API 9010 / console 9011. Don't assume standard 5432/6379/9000 when connecting local tools.

Frontend (run from `frontend/`):
- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build` (also type-checks)
- `npm run lint` — eslint `src/**/*.{ts,tsx}`
- `npm run preview`

Graphify (repo root, after any code change — see root `CLAUDE.md`): `graphify update .` — AST-only re-extraction, no LLM/API cost, keeps `graphify-out/graph.json` current. Prefer `graphify query "<question>"` / `graphify path "<A>" "<B>"` / `graphify explain "<concept>"` over raw grep for architecture questions.

Darwin note: BSD `find`/`grep` (no GNU extensions like `-regextype posix-extended`); prefer `rg` (ripgrep) when available for content search.
