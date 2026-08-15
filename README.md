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

Runs as a non-root `deploy` user (member of the `docker` group, key-only SSH — no password/sudo) so the CI SSH key can't touch anything outside its own directory:

```bash
# Docker + compose plugin must be installed; deploy user needs to be in the docker group
mkdir -p ~/meatflowai && cd ~/meatflowai
```

Copy [.env.production.example](.env.production.example) to `~/meatflowai/.env` (as that `deploy` user) and fill in real secrets (passwords, JWT secrets, Telegram bot token, etc). This file is never committed — it only ever lives on the server.

### One-time GitHub repo setup

Add these repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `SSH_HOST` | server IP/hostname |
| `SSH_USER` | SSH user (e.g. `deploy`) |
| `SSH_KEY` | private key with access to that user (public key added to `~/.ssh/authorized_keys` on server) |
| `SSH_PORT` | SSH port, optional (defaults to 22) |
| `DEPLOY_PATH` | absolute path on server, e.g. `/home/deploy/meatflowai` |

`GITHUB_TOKEN` is provided automatically by Actions — no need to add it. It's used both to push images to GHCR and (short-lived, within the same job) to let the server pull them.

After the first successful deploy, `docker-compose.prod.yml` exposes the frontend on host port 8080 (proxies `/api` to the backend container) and the backend directly on 3000.

### Domain + HTTPS

These two are host-level (outside Docker) and not managed by CI — set up once per server, `certbot` handles renewal on its own:

- **nginx** (`apt install nginx`) reverse-proxies `:80`/`:443` on the host to `127.0.0.1:8080` (the frontend container), config at `/etc/nginx/sites-available/<domain>.conf`.
- **certbot** (`apt install certbot python3-certbot-nginx`) issues the Let's Encrypt cert and rewrites that nginx config for HTTPS + redirect:
  ```bash
  certbot --nginx -d your-domain.example -d www.your-domain.example --agree-tos -m you@example.com --redirect
  ```
- Point the domain's DNS `A` records (root + `www`) at the server's IP before running certbot.
- After the domain is live, update on the server: `CORS_ORIGIN` (both apex and `www`, `https://`) and, if using the Telegram bot, `TELEGRAM_WEBAPP_URL=https://your-domain.example` (Telegram requires HTTPS for Mini App / `web_app` buttons) — then `docker compose -f docker-compose.prod.yml up -d backend` to pick up the new `.env`.
