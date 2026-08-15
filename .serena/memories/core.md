MeatFlowAI — meat-product company operations platform (SUPER_ADMIN/ADMIN/CLIENT roles, multi-company SaaS).

Two independent npm projects, no root package.json/workspace tool: `backend/` (NestJS+Prisma API) and `frontend/` (React/Vite SPA). No shared root scripts — run npm commands inside each dir.

A pre-built knowledge graph lives at `graphify-out/graph.json` (repo root `CLAUDE.md` mandates using the `graphify` CLI — `query`/`path`/`explain` — before grepping for architecture/relationship questions; read `graphify-out/GRAPH_REPORT.md` for community/god-node overview). Treat that workflow as already in effect; this memory graph is complementary, not a replacement.

Original spec docs `docs/GRAPHIFY.md` (backend) and `docs/FRONTEND_GRAPHIFY.md` (frontend) are compact AI-context docs written as the initial ТЗ (task spec, in Russian/English mix). They are PARTIALLY STALE: e.g. GRAPHIFY.md explicitly lists sales/orders as out of scope, but `backend/src/sales/` (Sale model, SalesController/Service/Module) now exists, plus a `dashboard/` module not in the spec. Treat these docs as historical intent, not ground truth — verify against actual `src/` structure and `prisma/schema.prisma`.

Domain: SUPER_ADMIN creates ADMIN + COMPANY, sees all companies/analytics/audit. ADMIN scoped to exactly one COMPANY, manages that company's Clients/Products/Sales. CLIENT belongs to one COMPANY. Security invariant and RBAC details: `mem:conventions`.

Module/module-map details: `mem:backend/core`, `mem:frontend/core`.
Runnable commands: `mem:suggested_commands`. Done-checklist: `mem:task_completion`.
