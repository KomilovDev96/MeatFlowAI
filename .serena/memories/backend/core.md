# Backend Core (`backend/`)

NestJS modular monolith. Modules under `src/`: auth, users, super-admin, admins, companies, clients, products, sales, analytics, audit, storage, queue, telegram, dashboard, prisma, common, config.

`sales/` and `dashboard/` are NOT in the original `docs/GRAPHIFY.md` spec doc — added later during development. Treat them as current in-scope modules regardless of what that doc's "out of scope" list says (see `mem:core`).

Prisma models (`prisma/schema.prisma`): Company, User, Client, Product, Sale, RefreshToken, AuditLog. Enums: Role (SUPER_ADMIN/ADMIN/CLIENT), Status (ACTIVE/INACTIVE/BLOCKED), ProductUnit (KG/PIECE).

Non-obvious model split: `User` = staff (SUPER_ADMIN and ADMIN), has `login`/`passwordHash`/`role`, optional `companyId`. `Client` is a SEPARATE model = a company's business customer, no login/password, required `companyId`, has a `sales` relation. The `Role` enum's `CLIENT` value is not actually used to type a `User` row — don't assume "client" always means `User{role: CLIENT}`; check which model a piece of code means.

God-node services (high fan-in per `graphify-out/GRAPH_REPORT.md`): `PrismaService`, `AuditService`, `JwtAuthGuard`. Most feature services depend on these — use `find_referencing_symbols` before changing their signatures.

Docker Compose (`backend/docker-compose.yml`) uses non-default host ports — see `mem:suggested_commands`.
