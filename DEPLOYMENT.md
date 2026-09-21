# Deployment guide — artiqusurface.com

Production stack (Docker Compose, in `deploy/`):

| URL | App | Container |
|---|---|---|
| https://artiqusurface.com (+ www → redirects) | Public website (`artiqusite`) | `site` :3002 |
| https://admin.artiqusurface.com | CRM admin panel (`wall-texture-crm`) | `crm` :3000 |
| https://api.artiqusurface.com | API, uploads, WhatsApp (`wall-texture-crm-api`) | `backend` :3001 |
| — | MySQL 9.1 (InnoDB), Redis 7 | `mysql`, `redis` (private network only) |
| 80/443 | Caddy: reverse proxy + automatic HTTPS | `caddy` |

Server: Ubuntu VPS, code in `/opt/artiqu` (a git checkout of `main`), secrets in `/opt/artiqu/deploy/.env`,
runtime data in `/opt/artiqu/deploy/data/` (uploads, WhatsApp session, backups) and Docker volumes (database, Redis, certificates).

Shorthand used below (run in `/opt/artiqu/deploy`):
```bash
alias dc='docker compose -f docker-compose.prod.yml --env-file .env'
```

---

## 1. DNS (do this first — HTTPS depends on it)
All records must point at the **server's IP** (`187.126.112.202`):

| Type | Name | Value |
|---|---|---|
| A | `@` | server IP |
| A | `admin` | server IP |
| A | `api` | server IP |
| CNAME | `www` | `artiqusurface.com` |

Check: `nslookup api.artiqusurface.com` must show the server IP. Caddy then obtains the certificates by itself
(within a minute or two); until then browsers show a certificate error. If it doesn't, see *Troubleshooting → HTTPS*.

## 2. First-time deployment (a brand-new server)
```bash
# as root on a fresh Ubuntu server
apt-get update && apt-get install -y docker.io docker-compose-v2 git openssl
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 443/udp && ufw --force enable

git clone https://github.com/anantorix-debug/artiqutextures.git /opt/artiqu
cd /opt/artiqu/deploy
cp .env.example .env            # then fill it in:
#   DOMAIN=artiqusurface.com
#   DB_ROOT_PASSWORD / REDIS_PASSWORD / JWT_*_SECRET  ->  openssl rand -hex 32   (one per value)
chmod 600 .env
mkdir -p data/uploads data/whatsapp-sessions data/backups

docker compose -f docker-compose.prod.yml --env-file .env up -d --build   # 5-10 min first time
docker compose -f docker-compose.prod.yml --env-file .env exec -T backend npx prisma migrate deploy
```
Create the first admin user (empty database only):
```bash
dc exec -T backend npx prisma db seed        # prints the admin email/password it creates
```
Sign in at https://admin.artiqusurface.com and **change the password** (Settings → Security).

## 3. Update the live site (normal workflow)
Work on a feature branch off `develop` → merge to `develop` → test → merge `develop` into `main` → push.
On the server:
```bash
bash /opt/artiqu/deploy/update.sh
```
It runs `git pull`, rebuilds changed images, restarts containers and applies new database migrations.
Public-site/CRM changes rebuild those images; `NEXT_PUBLIC_API_URL` is baked in at build time (it is set in the compose file).

## 4. Rollback
```bash
cd /opt/artiqu && git log --oneline -10          # find the last good commit
git checkout <good-commit-sha>                   # or: git revert <bad-sha> on your PC, push, then update.sh
bash deploy/update.sh                            # (skip `git pull` failing on a detached HEAD: run the `dc up -d --build` line manually)
```
Database migrations are not automatically reversed — restore a backup (section 6) if a migration must be undone.

## 5. Logs, status, restart
```bash
dc ps                          # status
dc logs -f backend             # follow a service's logs (backend | crm | site | caddy | mysql | redis)
dc restart backend             # restart one service
dc down && dc up -d            # restart everything (data is kept in volumes)
```

## 6. Backups & restore
**Database** (do this regularly, e.g. a nightly cron, and before every risky update):
```bash
set -a; . ./.env; set +a
dc exec -T mysql mysqldump -uroot -p"$DB_ROOT_PASSWORD" --single-transaction walltextures > /root/db-$(date +%F).sql
```
**Files:** `tar czf /root/files-$(date +%F).tgz -C /opt/artiqu/deploy data/uploads .env`
(`data/uploads` = customer photos/logos; `.env` = the secrets — keep it safe and private).
**Restore database:**
```bash
dc exec -T mysql mysql -uroot -p"$DB_ROOT_PASSWORD" -e 'DROP DATABASE walltextures; CREATE DATABASE walltextures CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
dc exec -T mysql mysql -uroot -p"$DB_ROOT_PASSWORD" walltextures < /root/db-YYYY-MM-DD.sql
dc restart backend
```
Also copy backups **off the server** (your PC or cloud storage). Enable Hostinger's VPS snapshots as a second layer.

## 7. Moving to a different server
1. Back up the database and `data/uploads` + `.env` (section 6).
2. On the new server follow section 2, but restore the `.env` and `data/uploads`, then import the database dump instead of running the seed.
3. Point DNS at the new IP (lower the TTL to 300 beforehand). Old server can be switched off once traffic has moved.

## 8. WhatsApp
- Open https://admin.artiqusurface.com → WhatsApp → scan the QR code with the business phone (the session on your PC is **not** copied to the server; only one location should be linked).
- The session is stored in `deploy/data/whatsapp-sessions` and survives restarts/updates. Back it up if you want to avoid re-scanning.
- If sending stops after a WhatsApp update: `dc logs backend | grep -i whatsapp`; a fix usually needs an updated `whatsapp-web.js`. Long-term, WhatsApp's official Business API is the stable option.

## 9. Changing the domain
1. Change `DOMAIN=` in `deploy/.env`, update DNS (section 1).
2. `bash deploy/update.sh` (rebuilds the frontends with the new API address and reconfigures CORS/Caddy).

## 10. Email (password reset)
Fill `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL` in `deploy/.env` (Gmail needs an *app password*), then `dc up -d backend`.

## 11. Security checklist
- Change the root password you shared earlier, and prefer SSH keys: add your key to `/root/.ssh/authorized_keys`, then set `PasswordAuthentication no` in `/etc/ssh/sshd_config` and `systemctl restart ssh`.
- Keep only ports 22/80/443 open (`ufw status`). MySQL/Redis are not published — keep it that way.
- Optional: `apt-get install -y fail2ban` (blocks repeated SSH login attempts) and `unattended-upgrades`.
- Never commit `.env` files (they are git-ignored). Rotate secrets by editing `deploy/.env` and `dc up -d` (this logs everyone out).
- Change the default admin password after the first login.

## 12. Troubleshooting
| Symptom | Check / fix |
|---|---|
| Browser certificate error / site not HTTPS | DNS must point to this server (`nslookup`); then `dc logs caddy`. Let's Encrypt limits repeated failures, so fix DNS first, then `dc restart caddy`. |
| 502 Bad Gateway | The app container is down/restarting: `dc ps`, `dc logs <service>`. |
| Admin loads but data/login fails ("Network Error") | API URL/CORS: `NEXT_PUBLIC_API_URL` must be `https://api.<domain>/api` (rebuild frontends) and backend `CORS_ORIGIN` must include the admin/public origins. |
| Images missing on the public site | The API host must serve `/uploads` over https; rebuild `site` after changing the domain. |
| `prisma migrate deploy` fails | Read the error; never edit applied migrations on a live DB. Restore a backup if needed. |
| Backend restarts in a loop | `dc logs backend` — usually DB not reachable/wrong password in `.env`. |
| Disk full | `docker system df`; `docker image prune -f`; remove old backups in `deploy/data/backups`. |
| WhatsApp shows disconnected | Re-scan the QR (section 8). Chrome needs `shm_size` (already set to 1 GB). |

## 13. Without Docker (alternative)
Possible with Node 22 + PM2 + nginx + MySQL + Redis + Chromium, but not recommended: you would run
`npm ci && npm run build` in each app, `prisma migrate deploy` in the API, `pm2 start` each app on ports 3000/3001/3002,
and reverse-proxy the three hostnames (nginx `proxy_pass`) with certbot for HTTPS. The Docker setup above does all of this reproducibly.

## 14. Local development
Local URLs stay `http://localhost:3000` (CRM), `:3001` (API), `:3002` (public site). Local `.env` files are not used on the server.
Start with `docker compose up` (root `docker-compose.yml`) or run each app with `npm run dev` / `start:dev`.
