# Conventions

RBAC roles (Prisma enum `Role`): SUPER_ADMIN, ADMIN, CLIENT. Enforced via `@Roles(...)` decorator + `JwtAuthGuard`/`RolesGuard` (see `mem:backend/core` for the guard chain).

Company-scope rule (the primary security invariant, tested across the codebase): every Admin-scoped query MUST filter `WHERE companyId = currentUser.companyId`. An Admin must never read/write another company's Client/Product/Sale/Analytics data. Check for this filter whenever touching clients/products/sales/analytics services or controllers — it's the thing security review focuses on in this repo.

Never return `passwordHash` or secrets in API responses; never store passwords/secrets in `AuditLog.metadata`.

DTOs (class-validator/class-transformer) required on every endpoint; Swagger docs served at `/api/docs` with Bearer auth scheme.

Object storage (avatars, product images) via MinIO — only the object key/URL is persisted in Postgres, never binary blobs in the DB.

Frontend: centralized design tokens in `frontend/src/styles/tokens.ts` + `theme.ts` (light/dark) — don't hardcode colors/spacing in components. Single Axios instance with 401 handling in `frontend/src/api/client.ts`; one API file per feature domain under `frontend/src/api/` (e.g. `admins.api.ts`, `companies.api.ts`).
