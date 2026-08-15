# Task Completion Checklist

Backend change (`backend/`): `npm run lint` && `npm run build`; run `npm test` if service/controller logic changed. If `prisma/schema.prisma` changed: `npm run prisma:generate` (and `npm run prisma:push` against the local Docker Compose Postgres) before build — this project uses `db push`, not migration files.

Frontend change (`frontend/`): `npm run lint` && `npm run build` (build runs `tsc -b`, so it also type-checks — a passing build is a passing typecheck).

After any code change, from repo root: `graphify update .` (AST-only, no API cost) to keep `graphify-out/graph.json` current — required by root `CLAUDE.md`. See `mem:suggested_commands`.
