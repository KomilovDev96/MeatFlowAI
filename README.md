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

## Deployment (CI/CD)

On every push to `main`, GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) lints/builds/tests both apps, builds Docker images for `backend` and `frontend`, pushes them to GHCR, then SSHes into the server and redeploys via `docker-compose.prod.yml`.

### One-time server setup (VPS)

```bash
# Docker + compose plugin must be installed
mkdir -p /opt/meatflowai && cd /opt/meatflowai
```

Copy [.env.production.example](.env.production.example) to `/opt/meatflowai/.env` and fill in real secrets (passwords, JWT secrets, etc). This file is never committed — it only ever lives on the server.

### One-time GitHub repo setup

Add these repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `SSH_HOST` | server IP/hostname |
| `SSH_USER` | SSH user (e.g. `deploy`) |
| `SSH_KEY` | private key with access to that user (public key added to `~/.ssh/authorized_keys` on server) |
| `SSH_PORT` | SSH port, optional (defaults to 22) |
| `DEPLOY_PATH` | absolute path on server, e.g. `/opt/meatflowai` |

`GITHUB_TOKEN` is provided automatically by Actions — no need to add it. It's used both to push images to GHCR and (short-lived, within the same job) to let the server pull them.

After the first successful deploy, the app is reachable at `http://SERVER_IP:8080` (frontend, proxies `/api` to the backend) and the API directly at `http://SERVER_IP:3000/api`. No domain/reverse proxy is configured yet — add one (nginx + TLS) in front of ports 8080/3000 when a domain is ready, then update `CORS_ORIGIN` and `VITE_API_BASE_URL` accordingly.
