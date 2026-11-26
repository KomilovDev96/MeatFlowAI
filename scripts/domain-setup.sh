#!/usr/bin/env bash
# Puts the app behind nginx + Let's Encrypt HTTPS on a real domain.
# Run as root ON THE SERVER, after server-setup.sh and after the DNS A records exist:
#
#   bash domain-setup.sh <domain> <email-for-certbot>
#   bash domain-setup.sh meatflowai.uz you@example.com
#
# DNS needed first:  <domain> and www.<domain> -> this server.
# Optional:          storage.<domain> -> this server (HTTPS for image uploads).
#                    Without it the script skips the storage part and uploads keep
#                    using http://<ip>:9000 (browsers block that on an https site).
# Safe to re-run.
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
[ -n "$DOMAIN" ] && [ -n "$EMAIL" ] || { echo "Usage: bash domain-setup.sh <domain> <email>"; exit 1; }
[ "$(id -u)" -eq 0 ] || { echo "Run as root"; exit 1; }
# fail early on a placeholder / typo: Let's Encrypt rejects invalid addresses
echo "$EMAIL" | grep -Eq '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' || { echo "'$EMAIL' is not a valid email address (use your real one, Latin letters only)."; exit 1; }
command -v apt-get >/dev/null 2>&1 || { echo "This script supports Debian/Ubuntu (apt-get)."; exit 1; }

DEPLOY_USER=deploy
APP_DIR="/home/${DEPLOY_USER}/meatflowai"
ENV_FILE="${APP_DIR}/.env"
STORAGE_HOST="storage.${DOMAIN}"
SERVER_IP=$(curl -fsS -4 https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

resolves_here() { getent ahostsv4 "$1" 2>/dev/null | awk '{print $1}' | grep -qx "$SERVER_IP"; }

echo "Server IP: ${SERVER_IP}"
for h in "$DOMAIN" "www.${DOMAIN}"; do
  resolves_here "$h" || { echo "DNS: $h does not point to ${SERVER_IP} yet. Fix the A record and retry."; exit 1; }
done
WITH_STORAGE=0
if resolves_here "$STORAGE_HOST"; then WITH_STORAGE=1; else echo "Note: ${STORAGE_HOST} has no A record to ${SERVER_IP} - skipping the storage (HTTPS uploads) part."; fi

# 1. Packages
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx

# 2. nginx: site -> frontend container (8080); storage subdomain -> storage container (9000)
cat > /etc/nginx/sites-available/meatflowai.conf <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
if [ "$WITH_STORAGE" -eq 1 ]; then
cat >> /etc/nginx/sites-available/meatflowai.conf <<EOF

server {
    listen 80;
    server_name ${STORAGE_HOST};
    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        # the upload URL is signed for this exact Host header
        proxy_set_header Host \$http_host;
        proxy_request_buffering off;
        proxy_buffering off;
    }
}
EOF
fi
ln -sf /etc/nginx/sites-available/meatflowai.conf /etc/nginx/sites-enabled/meatflowai.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

# 3. Open the web ports if ufw is in use
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp
  ufw allow 443/tcp
fi

# 4. Certificates (certbot edits the nginx config: adds 443 and the http -> https redirect)
CERT_ARGS=(-d "$DOMAIN" -d "www.${DOMAIN}")
[ "$WITH_STORAGE" -eq 1 ] && CERT_ARGS+=(-d "$STORAGE_HOST")
certbot --nginx "${CERT_ARGS[@]}" --agree-tos -m "$EMAIL" --redirect --non-interactive

# 5. App settings that must now be https
set_env() { # set_env KEY VALUE  (replace the line or append it)
  if grep -q "^$1=" "$ENV_FILE"; then sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"; else echo "$1=$2" >> "$ENV_FILE"; fi
}
[ -f "$ENV_FILE" ] || { echo "$ENV_FILE not found - run server-setup.sh first"; exit 1; }
set_env CORS_ORIGIN "https://${DOMAIN},https://www.${DOMAIN}"
set_env TELEGRAM_WEBAPP_URL "https://${DOMAIN}"
[ "$WITH_STORAGE" -eq 1 ] && set_env STORAGE_PUBLIC_URL "https://${STORAGE_HOST}"
chown "$DEPLOY_USER:$DEPLOY_USER" "$ENV_FILE"

# 6. Restart the backend so it reads the new .env
sudo -u "$DEPLOY_USER" bash -c "cd '${APP_DIR}' && docker compose -f docker-compose.prod.yml up -d backend"

echo
echo "Done."
echo "  Site:    https://${DOMAIN}"
[ "$WITH_STORAGE" -eq 1 ] && echo "  Storage: https://${STORAGE_HOST}  (image uploads)"
echo "Certificates renew automatically (certbot timer)."
