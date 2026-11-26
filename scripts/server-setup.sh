#!/usr/bin/env bash
# One-time server preparation for the GitHub Actions deploy (.github/workflows/deploy.yml).
# Run as root ON THE SERVER:   bash server-setup.sh [domain-or-ip]
# With a key made on your PC:  PUBKEY="ssh-ed25519 AAAA... comment" bash server-setup.sh [domain-or-ip]
# Safe to re-run: it never overwrites an existing .env or SSH key.
set -euo pipefail

HOST_NAME="${1:-$(hostname -I | awk '{print $1}')}"
DEPLOY_USER=deploy
DEPLOY_DIR="/home/${DEPLOY_USER}/meatflowai"

[ "$(id -u)" -eq 0 ] || { echo "Run as root"; exit 1; }

# 1. Docker + compose plugin
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null

# 2. Non-root deploy user (docker group, key-only, no password)
id "$DEPLOY_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$DEPLOY_USER"
usermod -aG docker "$DEPLOY_USER"

# 3. SSH key pair for CI, generated here so the private key never travels through chat
SSH_DIR="/home/${DEPLOY_USER}/.ssh"
KEY="${SSH_DIR}/github_actions"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$SSH_DIR"
if [ -n "${PUBKEY:-}" ]; then
  # A key pair made elsewhere (e.g. on your PC): authorize its public half, keep the private one off the server
  grep -qxF "$PUBKEY" "${SSH_DIR}/authorized_keys" 2>/dev/null || echo "$PUBKEY" >> "${SSH_DIR}/authorized_keys"
  chown "$DEPLOY_USER:$DEPLOY_USER" "${SSH_DIR}/authorized_keys"
  chmod 600 "${SSH_DIR}/authorized_keys"
  NEW_KEY=2
elif [ ! -f "$KEY" ]; then
  sudo -u "$DEPLOY_USER" ssh-keygen -t ed25519 -N "" -C "github-actions-deploy" -f "$KEY" >/dev/null
  cat "${KEY}.pub" >> "${SSH_DIR}/authorized_keys"
  chown "$DEPLOY_USER:$DEPLOY_USER" "${SSH_DIR}/authorized_keys"
  chmod 600 "${SSH_DIR}/authorized_keys"
  NEW_KEY=1
else
  NEW_KEY=0
fi

# 4. App directory and .env with random secrets
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$DEPLOY_DIR"
ENV_FILE="${DEPLOY_DIR}/.env"
if [ ! -f "$ENV_FILE" ]; then
  DB_PASS=$(openssl rand -hex 16)
  MINIO_PASS=$(openssl rand -hex 16)
  cat > "$ENV_FILE" <<EOF
POSTGRES_DB=meatflow
POSTGRES_USER=meatflow
POSTGRES_PASSWORD=${DB_PASS}

MINIO_ROOT_USER=meatflow
MINIO_ROOT_PASSWORD=${MINIO_PASS}

NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://meatflow:${DB_PASS}@postgres:5432/meatflow?schema=public
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
REDIS_HOST=redis
REDIS_PORT=6379
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=meatflow
MINIO_SECRET_KEY=${MINIO_PASS}
MINIO_BUCKET=meatflow
STORAGE_PUBLIC_URL=http://${HOST_NAME}:9000
# The bot token is managed from the super-admin panel; leave empty here.
TELEGRAM_BOT_TOKEN=
# Telegram Mini App needs HTTPS: set this once the domain + certificate exist.
TELEGRAM_WEBAPP_URL=
CORS_ORIGIN=http://${HOST_NAME}:8080,http://${HOST_NAME}
IMAGE_TAG=latest
EOF
  chown "$DEPLOY_USER:$DEPLOY_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "Created ${ENV_FILE}"
else
  echo "${ENV_FILE} already exists, left untouched"
fi

# 5. What to put into GitHub
echo
echo "=============== GitHub -> Settings -> Secrets and variables -> Actions ==============="
echo "SSH_HOST     = ${HOST_NAME}"
echo "SSH_USER     = ${DEPLOY_USER}"
echo "SSH_PORT     = 22"
echo "DEPLOY_PATH  = ${DEPLOY_DIR}"
if [ "$NEW_KEY" -eq 2 ]; then
  echo "SSH_KEY      = the PRIVATE key file you generated on your PC (the public half is now authorized)"
elif [ "$NEW_KEY" -eq 1 ]; then
  echo "SSH_KEY      = (the whole private key below, including the BEGIN/END lines)"
  echo "----------------------------------------------------------------------------------"
  cat "$KEY"
  echo "----------------------------------------------------------------------------------"
  echo "After you saved it in GitHub, delete the private key from the server:"
  echo "  shred -u ${KEY}"
else
  echo "SSH_KEY      = already generated earlier (${KEY}); not printed again"
fi
