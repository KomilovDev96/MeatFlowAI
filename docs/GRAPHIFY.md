# MeatFlow AI Graphify

Короткая карта проекта для экономии токенов. Используй этот файл как сжатый контекст вместо полного ТЗ.

## Goal

Построить production-ready backend MeatFlow AI, Part 1: роли, компании, клиенты, продукты, базовая Telegram-интеграция, аналитика, аудит, Docker-инфраструктура.

## Stack

NestJS, TypeScript, PostgreSQL, Prisma, Redis, BullMQ, MinIO/S3, JWT access/refresh, RBAC, Swagger, class-validator/class-transformer, Pino, Helmet, CORS, rate limiting, Docker Compose.

Не использовать пока: микросервисы, RabbitMQ, Kafka, Kubernetes, ClickHouse, Elasticsearch, продажи, закупки, заказы, финансы, CRM, AI, frontend, mobile.

## Domain Graph

```text
SUPER_ADMIN
  -> creates ADMIN
  -> creates/links COMPANY
  -> sees all companies/admins/platform analytics/audit

ADMIN
  -> belongs to one COMPANY
  -> manages only own COMPANY scope
  -> creates/updates CLIENTS
  -> creates/updates PRODUCTS
  -> can use web + Telegram

CLIENT
  -> belongs to one COMPANY
  -> can use web + Telegram
  -> sees only own data

COMPANY
  -> has many ADMINS
  -> has many CLIENTS
  -> has many PRODUCTS
```

## Roles

```text
SUPER_ADMIN
ADMIN
CLIENT
```

Required auth features: login, logout, current user, password hashing, access token, refresh token, refresh token rotation/storage, RBAC decorators/guards, company-level authorization on backend.

Example decorators:

```ts
@Roles('SUPER_ADMIN')
@Roles('ADMIN')
@Roles('CLIENT')
```

## Core Models

Use UUID ids, timestamps, enums, indexes, unique constraints, and safe relations.

### User/Auth Shape

Keep separate role-aware access. Never return `passwordHash` or secrets.

### Company

Fields: `id`, `name`, `avatar/logo`, `phone`, `address`, `description`, `currency`, `measurementUnit`, `status`, `createdAt`, `updatedAt`.

### Admin

Fields: `id`, `fullName`, `login`, `passwordHash`, `phone`, `avatar`, `telegramId`, `telegramUsername`, `telegramConnected`, `status`, `companyId`, `createdAt`, `updatedAt`, `lastLoginAt`, `lastActivityAt`.

### Client

Fields: `id`, `companyId`, `firstName`, `lastName`, `phone`, `telegramId`, `telegramUsername`, `avatar`, `status`, `notes`, `createdAt`, `updatedAt`, `lastActivityAt`.

### Product

Fields: `id`, `companyId`, `name`, `description`, `category`, `image`, `unit`, `purchasePrice`, `salePrice`, `stock`, `status`, `createdAt`, `updatedAt`.

Product units: at least `kg`, `piece`; design enum/extensions for future units.

### AuditLog

Fields: `id`, `userId`, `companyId`, `action`, `entity`, `entityId`, `metadata`, `ip`, `userAgent`, `createdAt`.

Never store passwords/secrets in audit metadata.

## Important Indexes

Index: `companyId`, `telegramId`, `login`, `phone`, `status`, `createdAt`.

Unique candidates: admin login, telegram ids where present, scoped phone rules as appropriate.

## Modules

```text
src/
  auth/
  users/
  super-admin/
  admins/
  companies/
  clients/
  products/
  telegram/
  analytics/
  audit/
  storage/
  queue/
  prisma/
  common/
  config/
  main.ts
```

Can adjust structure, but keep modular monolith boundaries clean.

## API Groups

```text
/auth
/super-admin
/admins
/companies
/clients
/products
/telegram
/analytics
/audit
/storage
```

Each endpoint needs DTO validation, auth, correct HTTP status, safe errors, Swagger docs.

## Required Endpoints

### Auth

```text
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

### Clients, Admin Scope

```text
POST   /clients
GET    /clients
GET    /clients/:id
PATCH  /clients/:id
DELETE /clients/:id
```

All client operations are restricted to current admin company.

### Products, Admin Scope

```text
POST   /products
GET    /products
GET    /products/:id
PATCH  /products/:id
DELETE /products/:id
```

All product operations are restricted to current admin company.

### Analytics, SuperAdmin

```text
GET /analytics/platform
GET /analytics/companies/:companyId
```

Company analytics: clients count, products count, admins count, user activity, company created date, last activity, company status. No sales/profit metrics yet.

## SuperAdmin Flow

SuperAdmin can create Admin via API. Payload includes admin name, company name, company avatar/logo, login, password, phone, Telegram data, status.

Create/link relation correctly:

```text
Admin -> Company
```

SuperAdmin can list companies/admins, view platform/company analytics, activate/deactivate admin, block/unblock company, view company details.

## Company Scope Rule

Admin must never access another company data. Enforce in backend queries:

```text
WHERE companyId = currentUser.companyId
```

Security tests must prove:

```text
Admin A cannot read Client B
Admin A cannot update Product B
Admin A cannot read Analytics B
Admin A cannot update Company B
SuperAdmin can read both companies
```

## Telegram Foundation

Create Telegram module/service. Use Bot API token from env only. Prepare `/start`, save Telegram ID, connect Telegram ID to Admin/Client, find user by Telegram ID, detect role and company. Architecture should allow future scenarios.

## Storage

Use MinIO/S3-compatible storage for company avatars, user avatars, product images. Store only metadata/object key/URL in PostgreSQL, not binary files.

## Queue

Connect Redis and BullMQ. Prepare queues for Telegram notifications, background jobs, analytics processing.

## Swagger

Serve docs at:

```text
/api/docs
```

Document Auth, Admin, Company, Client, Product, Telegram, Analytics, Audit Logs. Add Bearer auth.

## Validation/Security

Use DTOs everywhere. Validate required fields, strings, lengths, phone/email where needed, numbers, enums, UUIDs, prices, stock.

Enable Helmet, CORS, rate limiting, JWT, refresh tokens, RBAC, company scope, safe env vars, safe response serialization, safe error format, Pino logging.

No stack traces, DB internals, passwords, secrets in API responses.

## Docker

Docker Compose services:

```text
backend
postgres
redis
minio
```

Add healthchecks where useful. Add `.env.example`. Do not commit real secrets.

## Seed

Local seed creates:

```text
SuperAdmin
Admin
Company linked to Admin
Several Clients
Several Products
```

Development credentials may be documented, never production secrets.

## Verification Checklist

Run and fix until green:

```text
npm run build
prisma generate
migrations
seed
Docker Compose infrastructure
backend startup
Swagger
auth login/refresh/logout/me
RBAC
company isolation
basic unit/integration/e2e tests
```

## Implementation Order

```text
1 analyze repo
2 architecture
3 Docker infrastructure
4 PostgreSQL + Prisma
5 Redis
6 MinIO
7 Auth + RBAC
8 SuperAdmin/Admin/Company
9 Client/Product
10 Telegram foundation
11 Analytics
12 Audit Log
13 Swagger
14 Seed
15 Tests
16 Build/test
17 Fix errors
18 Final report
```

## Final Result

Backend must allow:

```text
SuperAdmin login
SuperAdmin creates Admin + Company link
Admin login
Admin sees only own Company
Admin creates Client
Admin creates Product
Client belongs to Company
Admin/Client can link Telegram
SuperAdmin sees company analytics
Important actions go to Audit Log
PostgreSQL via Prisma works
Redis works
MinIO works
Telegram module is prepared
Swagger works
Docker Compose starts infrastructure
Critical APIs are verified
```
