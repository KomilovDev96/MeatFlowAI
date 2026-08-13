# MeatFlowAI
Hisob Kitobchi ! Aqili funksiyalar Suniy Entelekt yordamidagi hisobchi endilikda siz hisoblaringiz toliq nazorat ostida!

## Project context

Use [docs/GRAPHIFY.md](docs/GRAPHIFY.md) as the compact project graph/context for token-efficient implementation work.
Use [docs/FRONTEND_GRAPHIFY.md](docs/FRONTEND_GRAPHIFY.md) for frontend foundation context.

## Folders

- `backend/` - NestJS + Prisma backend for MeatFlow AI Part 1.
- `frontend/` - Vite React frontend foundation and design system.

## Backend commands

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run build
```

Infrastructure:

```bash
cd backend
docker compose up -d postgres redis minio
npm run prisma:push
npm run prisma:seed
npm run start:dev
```

Swagger: `http://localhost:3000/api/docs`

Local seed credentials:

```text
superadmin / Password123!
admin / Password123!
```

## Frontend commands

```bash
cd frontend
npm install
npm run dev
npm run build
npm run lint
```

App: `http://localhost:5173`
