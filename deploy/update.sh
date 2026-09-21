#!/usr/bin/env bash
# Pull the latest code from git and rebuild/restart the stack. Run on the server: bash deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
cd deploy
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
# apply any new database migrations
docker compose -f docker-compose.prod.yml --env-file .env exec -T backend npx prisma migrate deploy
docker image prune -f >/dev/null
docker compose -f docker-compose.prod.yml --env-file .env ps
