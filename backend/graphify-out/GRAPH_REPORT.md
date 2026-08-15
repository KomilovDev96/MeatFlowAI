# Graph Report - backend  (2026-08-14)

## Corpus Check
- 65 files · ~7,292 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 335 nodes · 657 edges · 19 communities (16 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6c9ec70`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]

## God Nodes (most connected - your core abstractions)
1. `PrismaService` - 26 edges
2. `AuditService` - 23 edges
3. `ClientsService` - 20 edges
4. `compilerOptions` - 16 edges
5. `SalesService` - 15 edges
6. `JwtAuthGuard` - 13 edges
7. `RolesGuard` - 11 edges
8. `ProductsService` - 11 edges
9. `AuditModule` - 10 edges
10. `CurrentUser` - 10 edges

## Surprising Connections (you probably didn't know these)
- `UpdateSaleDto` --references--> `CreateSaleItemDto`  [EXTRACTED]
  src/sales/dto/update-sale.dto.ts → src/sales/dto/create-sale.dto.ts

## Import Cycles
- None detected.

## Communities (19 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (17): AdminsModule, AuditController, AuditModule, AuthModule, ClientsModule, CompaniesModule, HttpExceptionFilter, PrismaModule (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (6): AuditService, CreateAdminDto, PrismaService, SuperAdminController, SuperAdminService, UsersService

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (35): devDependencies, eslint, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, prisma, source-map-support (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (5): JwtStrategy, ClientsController, ClientsService, CreateClientDto, UpdateClientDto

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (6): CreateSaleDto, CreateSaleItemDto, UpdateSaleDto, SalesController, SALE_INCLUDE, SalesService

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (24): dependencies, bcrypt, bullmq, class-transformer, class-validator, helmet, ioredis, minio (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.37
Nodes (5): CurrentUser, Roles(), JwtAuthGuard, RolesGuard, ConnectTelegramDto

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (4): CreateProductDto, UpdateProductDto, ProductsController, ProductsService

### Community 8 - "Community 8"
Cohesion: 0.19
Nodes (6): UPLOAD_FOLDERS, UploadFolder, UploadUrlDto, StorageController, StorageModule, StorageService

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (16): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, incremental, module (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.19
Nodes (3): AuthController, AuthService, LoginDto

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (3): CompaniesController, CompaniesService, UpdateCompanyDto

### Community 12 - "Community 12"
Cohesion: 0.21
Nodes (3): AdminsController, AdminsService, UpdateAdminDto

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (3): AnalyticsController, AnalyticsModule, AnalyticsService

### Community 15 - "Community 15"
Cohesion: 0.50
Nodes (3): collection, $schema, sourceRoot

## Knowledge Gaps
- **79 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `name`, `version` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PrismaService` connect `Community 1` to `Community 0`, `Community 3`, `Community 4`, `Community 7`, `Community 14`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `ClientsService` connect `Community 3` to `Community 0`, `Community 1`, `Community 6`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `AuditService` connect `Community 1` to `Community 0`, `Community 3`, `Community 4`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09615384615384616 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1066066066066066 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._