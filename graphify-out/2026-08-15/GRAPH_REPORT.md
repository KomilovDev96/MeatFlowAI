# Graph Report - MeatFlowAI  (2026-08-14)

## Corpus Check
- 152 files · ~26,224 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 768 nodes · 1504 edges · 46 communities (34 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6c9ec70`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend Domain Services|Backend Domain Services]]
- [[_COMMUNITY_Backend Dependencies (package.json)|Backend Dependencies (package.json)]]
- [[_COMMUNITY_Frontend Dependencies (package.json)|Frontend Dependencies (package.json)]]
- [[_COMMUNITY_Project Docs & Infra Config|Project Docs & Infra Config]]
- [[_COMMUNITY_Backend App Bootstrap & Modules|Backend App Bootstrap & Modules]]
- [[_COMMUNITY_Backend Controllers & RBAC Guards|Backend Controllers & RBAC Guards]]
- [[_COMMUNITY_Auth Module (LoginJWT)|Auth Module (Login/JWT)]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Backend Dev Dependencies|Backend Dev Dependencies]]
- [[_COMMUNITY_Products Module (CRUD)|Products Module (CRUD)]]
- [[_COMMUNITY_Frontend tsconfig (App)|Frontend tsconfig (App)]]
- [[_COMMUNITY_Backend tsconfig|Backend tsconfig]]
- [[_COMMUNITY_Frontend tsconfig (Node)|Frontend tsconfig (Node)]]
- [[_COMMUNITY_Analytics Module|Analytics Module]]
- [[_COMMUNITY_Frontend App Bootstrap & Theme|Frontend App Bootstrap & Theme]]
- [[_COMMUNITY_Storage Module (MinIO)|Storage Module (MinIO)]]
- [[_COMMUNITY_Nest CLI Config|Nest CLI Config]]
- [[_COMMUNITY_Backend Build tsconfig|Backend Build tsconfig]]
- [[_COMMUNITY_Frontend tsconfig (Root)|Frontend tsconfig (Root)]]
- [[_COMMUNITY_Prisma Seed Script|Prisma Seed Script]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]

## God Nodes (most connected - your core abstractions)
1. `PrismaService` - 28 edges
2. `AuditService` - 25 edges
3. `MeatFlow AI Graphify` - 22 edges
4. `ClientsService` - 21 edges
5. `useAuthStore` - 20 edges
6. `TelegramService` - 19 edges
7. `displayName()` - 19 edges
8. `MeatFlow AI Graphify (Backend Compact Context Doc)` - 19 edges
9. `SalesService` - 17 edges
10. `compilerOptions` - 17 edges

## Surprising Connections (you probably didn't know these)
- `index.html Entry Point` --conceptually_related_to--> `MeatFlow AI Frontend Graphify (Frontend Compact Context Doc)`  [INFERRED]
  frontend/index.html → docs/FRONTEND_GRAPHIFY.md
- `index.html Entry Point` --references--> `MeatFlowAI`  [EXTRACTED]
  frontend/index.html → README.md
- `MeatFlowAI` --references--> `MeatFlow AI Frontend Graphify (Frontend Compact Context Doc)`  [EXTRACTED]
  README.md → docs/FRONTEND_GRAPHIFY.md
- `MeatFlowAI` --references--> `MeatFlow AI Graphify (Backend Compact Context Doc)`  [EXTRACTED]
  README.md → docs/GRAPHIFY.md
- `Serena Project Configuration` --references--> `MeatFlowAI`  [EXTRACTED]
  .serena/project.yml → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Docker Compose Infrastructure (postgres/redis/minio) across README, backend compose file, and backend graphify doc** — backend_docker_compose_postgres, backend_docker_compose_redis, backend_docker_compose_minio, readme_backend, docs_graphify_dockercompose [INFERRED 0.85]
- **RBAC Role Hierarchy Pattern spanning backend domain model and frontend routing** — docs_graphify_roles, docs_graphify_domaingraph, docs_graphify_companyscoperule, docs_frontend_graphify_roles [INFERRED 0.85]
- **Core Domain Models of the backend (Company, Admin, Client, Product, AuditLog)** — docs_graphify_company_model, docs_graphify_admin_model, docs_graphify_client_model, docs_graphify_product_model, docs_graphify_auditlog_model [EXTRACTED 1.00]

## Communities (46 total, 12 thin omitted)

### Community 1 - "Backend Domain Services"
Cohesion: 0.05
Nodes (17): AuditController, AuditService, JwtStrategy, CreateAdminDto, CreatePaymentDto, PaymentsController, PAYMENT_INCLUDE, PaymentsService (+9 more)

### Community 2 - "Backend Dependencies (package.json)"
Cohesion: 0.05
Nodes (41): dependencies, bcrypt, bullmq, class-transformer, class-validator, exceljs, helmet, ioredis (+33 more)

### Community 3 - "Frontend Dependencies (package.json)"
Cohesion: 0.05
Nodes (41): dependencies, @ant-design/icons, antd, axios, dayjs, framer-motion, @hookform/resolvers, leaflet (+33 more)

### Community 4 - "Project Docs & Infra Config"
Cohesion: 0.19
Nodes (15): Design System Tokens, Roles, Admin Model, AuditLog Model, Client Model, Company Model, Company Scope Rule, MeatFlow AI Graphify (Backend Compact Context Doc) (+7 more)

### Community 5 - "Backend App Bootstrap & Modules"
Cohesion: 0.08
Nodes (20): AdminsModule, AnalyticsController, AnalyticsModule, AnalyticsService, AuditModule, AuthModule, ClientsModule, CompaniesModule (+12 more)

### Community 7 - "Auth Module (Login/JWT)"
Cohesion: 0.19
Nodes (3): AuthController, AuthService, LoginDto

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (3): CompaniesController, CompaniesService, UpdateCompanyDto

### Community 9 - "Backend Dev Dependencies"
Cohesion: 0.11
Nodes (19): devDependencies, eslint, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, prisma, source-map-support (+11 more)

### Community 10 - "Products Module (CRUD)"
Cohesion: 0.06
Nodes (38): AdminFormModal(), baseFields, createSchema, editSchema, emptyValues, FormValues, locationSchema, auditApi (+30 more)

### Community 11 - "Frontend tsconfig (App)"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+10 more)

### Community 12 - "Backend tsconfig"
Cohesion: 0.12
Nodes (16): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, incremental, module (+8 more)

### Community 13 - "Frontend tsconfig (Node)"
Cohesion: 0.17
Nodes (11): compilerOptions, allowSyntheticDefaultImports, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+3 more)

### Community 14 - "Analytics Module"
Cohesion: 0.21
Nodes (3): AdminsController, AdminsService, UpdateAdminDto

### Community 15 - "Frontend App Bootstrap & Theme"
Cohesion: 0.10
Nodes (28): AdminsPage(), authApi, AppProviders(), queryClient, AuthBootstrap(), LoginForm, LoginPage(), schema (+20 more)

### Community 16 - "Storage Module (MinIO)"
Cohesion: 0.19
Nodes (6): UPLOAD_FOLDERS, UploadFolder, UploadUrlDto, StorageController, StorageModule, StorageService

### Community 17 - "Nest CLI Config"
Cohesion: 0.50
Nodes (3): collection, $schema, sourceRoot

### Community 27 - "Community 27"
Cohesion: 0.33
Nodes (5): Add/update threshold, Discovery Model, Maintenance Actions, Memory Maintenance, Style

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (16): API Layer, API Layer (Axios client.ts), Architecture, Components, Design System, MeatFlow AI Frontend Graphify (Frontend Compact Context Doc), Goal, Layout (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.14
Nodes (6): CreateSaleDto, CreateSaleItemDto, UpdateSaleDto, SalesController, SALE_INCLUDE, SalesService

### Community 34 - "Community 34"
Cohesion: 0.17
Nodes (9): index.html Entry Point, Backend commands, Folders, frontend/ Folder (Vite React Foundation), Frontend commands, MeatFlowAI, Project context, Serena Project Configuration (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (11): API Groups, Docker, Domain Graph, Final Result, Goal, Implementation Order, Important Indexes, MeatFlow AI Graphify (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.32
Nodes (8): minio service (Docker Compose), postgres service (Docker Compose), redis service (Docker Compose), Docker Compose Services (backend/postgres/redis/minio), Queue, Storage, Swagger, backend/ Folder (NestJS + Prisma)

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (7): Admin, AuditLog, Client, Company, Core Models, Product, User/Auth Shape

### Community 41 - "Community 41"
Cohesion: 0.40
Nodes (5): Analytics, SuperAdmin, Auth, Clients, Admin Scope, Products, Admin Scope, Required Endpoints

### Community 46 - "Community 46"
Cohesion: 0.05
Nodes (76): AdminDetailDrawer(), STATUS_COLOR, adminsApi, analyticsApi, clientsApi, paymentsApi, ProductPayload, productsApi (+68 more)

### Community 47 - "Community 47"
Cohesion: 0.10
Nodes (12): ClientsController, CurrentUser, Roles(), CreateClientDto, CreateProductDto, UpdateClientDto, UpdateProductDto, JwtAuthGuard (+4 more)

## Knowledge Gaps
- **257 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `name`, `version` (+252 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PrismaService` connect `Backend Domain Services` to `Community 32`, `Backend App Bootstrap & Modules`, `Community 47`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `TelegramService` connect `Community 45` to `Backend Domain Services`, `Backend App Bootstrap & Modules`, `Community 47`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `AuditService` connect `Backend Domain Services` to `Community 32`, `Backend App Bootstrap & Modules`, `Community 47`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _257 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Domain Services` be split into smaller, more focused modules?**
  _Cohesion score 0.05086071987480438 - nodes in this community are weakly interconnected._
- **Should `Backend Dependencies (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._