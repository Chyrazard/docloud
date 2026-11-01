#!/usr/bin/env bash
# Run on belctech-vps as the authorized operator. The application user reads the data.
set -euo pipefail
sudo -n bash -c 'set -a; source /etc/docloud.env; set +a; cd /srv/docloud/app; exec sudo -E -u docloud /usr/bin/node --import tsx scripts/intake.ts "$@"' -- "$@"
