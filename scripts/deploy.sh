#!/usr/bin/env bash
# Run as ubuntu on belctech-vps. Changes only DOCLOUD files and its service.
set -euo pipefail
cd /srv/docloud/app
exec 9>/srv/docloud/deploy.lock
flock -n 9 || { echo 'Another deployment is running'; exit 1; }
git fetch origin main
git pull --ff-only origin main
npm ci
npm run typecheck
npm test
npm run build
sudo systemctl start docloud-backup.service
sudo systemctl restart docloud
for attempt in {1..15}; do
 if curl --fail --silent http://127.0.0.1:3270/api/health; then exit 0; fi
 sleep 1
done
echo 'Health check failed. Inspect: journalctl -u docloud -n 50'
exit 1
