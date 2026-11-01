#!/usr/bin/env bash
# Initial installation for the existing belctech-vps nginx layout.
set -euo pipefail
if ! id docloud >/dev/null 2>&1; then
 sudo -n useradd --system --user-group --home-dir /srv/docloud --shell /usr/sbin/nologin docloud
fi
sudo -n install -d -o ubuntu -g docloud -m 755 /srv/docloud
sudo -n install -d -o docloud -g docloud -m 700 /srv/docloud/data /srv/docloud/backups
if [[ ! -d /srv/docloud/app/.git ]]; then
 git clone https://github.com/Chyrazard/docloud.git /srv/docloud/app
fi
cd /srv/docloud/app
git pull --ff-only origin main
sudo -n python3 - <<'PY'
import os,secrets
path='/etc/docloud.env'
if not os.path.exists(path):
 fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with os.fdopen(fd,'w') as f:
  f.write('APP_URL=https://dogs.belctech.com\nDATA_DIR=/srv/docloud/data\nBACKUP_DIR=/srv/docloud/backups\nENCRYPTION_KEY='+secrets.token_hex(32)+'\n')
PY
npm ci
npm run build
npm run typecheck
npm test
sudo -n install -m 644 deploy/docloud.service deploy/docloud-backup.service deploy/docloud-backup.timer /etc/systemd/system/
sudo -n install -m 644 deploy/nginx.conf /etc/nginx/sites-available/dogs.belctech.com
sudo -n nginx -t
sudo -n systemctl daemon-reload
sudo -n systemctl enable --now docloud.service
healthy=0
for attempt in {1..20}; do
 if curl --fail --silent http://127.0.0.1:3270/api/health; then healthy=1; break; fi
 sleep 1
done
[[ $healthy = 1 ]] || { echo 'DOCLOUD failed its health check'; exit 1; }
sudo -n systemctl reload nginx
sudo -n systemctl enable --now docloud-backup.timer
sudo -n systemctl start docloud-backup.service
sudo -n install -m 755 deploy/certbot-reload.sh /etc/letsencrypt/renewal-hooks/deploy/docloud-reload-nginx
printf '\nDOCLOUD installed successfully.\n'
