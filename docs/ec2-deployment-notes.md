# EC2 Deployment Migration — Session Notes

Migrating production deploy from Coolify (webhook-triggered) to a self-managed EC2 instance, pulling prebuilt images from GHCR over SSH.

## Decisions made

| Question | Decision | Why |
|---|---|---|
| Deploy method to EC2 | SSH + `docker compose pull && up -d` | Matches existing `docker-compose.yml` shape, no extra AWS services needed |
| Postgres on EC2 | Same `docker-compose.yml`, not RDS | Simplicity, mirrors local dev setup |
| `.env` management | Manual on server, not auto-written by CI | Avoids duplicating ~18 secrets into GitHub Actions; smaller leak surface; values rarely change |
| Registry | Keep GHCR (not switch to ECR) | Already wired into CI; ECR would only gain IAM-based auth at the cost of extra setup |
| Image strategy | Pull prebuilt image, don't `git clone` + build on EC2 | CI already builds/validates; building on a small EC2 instance is slow/memory-heavy and redundant |

## What was built

- **[`.github/workflows/deploy-ec2.yml`](../.github/workflows/deploy-ec2.yml)** — new workflow: build & push image to GHCR (same as the Coolify one), then SSH into EC2 and run `docker compose pull && docker compose up -d`.
- Committed on `staging` (commit `96efadf`), already merged into `main`.
- Old **`deploy-production.yml`** (Coolify webhook) left in place, **not yet disabled** — both currently fire on the same CI-success trigger.

### Required GitHub Actions secrets
- `EC2_HOST` — EC2 public IP (currently `47.128.1.225`; **not an Elastic IP yet**, will change on instance stop/start)
- `EC2_USERNAME` — `ec2-user` (Amazon Linux 2023)
- `EC2_SSH_KEY` — full contents of the `.pem` private key (not the PuTTY `.ppk`)
- `GHCR_PAT` — reused from the existing Coolify workflow (`read:packages`/`write:packages` scope)

## EC2 server setup (Amazon Linux 2023, ECS-optimized AMI)

```bash
# Docker Compose plugin — apt-get does NOT exist on this AMI, use this instead:
mkdir -p ~/.docker/cli-plugins/
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose
docker compose version

# nano editor isn't preinstalled either
sudo dnf install -y nano

# App directory
sudo mkdir -p /opt/news-media-app
sudo chown $USER:$USER /opt/news-media-app
cd /opt/news-media-app
```

`docker-compose.yml` and `.env` live in `/opt/news-media-app` on the server — pulls `ghcr.io/forhu/news-media-app:latest`, `env_file: .env` for runtime config. (Full file contents are in chat history / can be regenerated — see "Recreating files safely" below.)

```bash
# GHCR auth (one-time, manual)
echo "<PAT>" | docker login ghcr.io -u <github-username> --password-stdin

# First manual run
docker compose pull && docker compose up -d
docker compose ps
curl localhost:3000/api/health
```

### Recreating files safely (avoid the corruption issue below)

```bash
cat > docker-compose.yml << 'EOF'
... paste full content as ONE block, not line by line ...
EOF
```

## Problems hit & fixes

| Problem | Fix |
|---|---|
| `sudo apt-get install docker-compose-plugin` → `apt-get: command not found` | This AMI is Amazon Linux 2023, not Ubuntu — use `dnf`, and `docker-compose-plugin` isn't in AL2023 repos either → installed the Compose binary directly from Docker's GitHub releases instead |
| `mkdir -p /opt/newsmedia` (typo, wrong dir name) then `chown`/`cd` into `/opt/news-media-app` failed | `sudo rmdir /opt/newsmedia` (safe since empty) and recreated with correct name |
| `nano: command not found` | `sudo dnf install -y nano` |
| Pasting multi-line YAML into `nano` over PuTTY produced **corrupted/duplicated content** (interleaved lines, garbled text) | Deleted the file and recreated it with a single `cat > file << 'EOF' ... EOF` heredoc paste instead of pasting into nano line-by-line |
| `curl http://169.254.169.254/latest/meta-data/public-ipv4` returned **nothing** | Instance enforces IMDSv2 — needed a token first: `TOKEN=$(curl -s -X PUT ".../latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")` then pass `-H "X-aws-ec2-metadata-token: $TOKEN"` |
| Browser to `http://47.128.1.225` timed out | Missing `:3000` port in the URL, **and** EC2 Security Group likely doesn't have an inbound rule for port 3000 yet — needs to be added (Type: Custom TCP, Port 3000, Source: My IP or 0.0.0.0/0 for testing) |

## Confirmed working

- `docker compose ps` → both `news-media-app` and `news-media-crawler-postgres` `Up ... (healthy)`
- `curl localhost:3000/api/health` → `{"status":"ok",...}` from inside the EC2 instance
- GitHub Actions run **"Build, Push & Deploy (EC2)"** → succeeded end-to-end (checkout → buildx → GHCR login → build/push → SSH deploy), ~4m total

## Outstanding TODOs

- [ ] Confirm port 3000 reachable externally (Security Group inbound rule) and re-test `http://47.128.1.225:3000` in browser
- [ ] Allocate an **Elastic IP** so `EC2_HOST` doesn't break on instance restart
- [ ] Disable the old `deploy-production.yml` (Coolify) workflow via GitHub UI (Actions → Deploy Production → `...` → Disable workflow) once EC2 path is fully confirmed
- [ ] **Rotate `EXTERNAL_API_WEBHOOK_SECRET`** — value was exposed in a terminal screenshot during this session, treat as compromised
- [ ] Add a reverse proxy (nginx or Caddy) + domain + TLS — currently serving plain HTTP on port 3000, not production-grade as-is
- [ ] Once confident, consider removing `deploy-production.yml` entirely (not just disabling)

## Key commands reference

```bash
# Server status
docker compose ps
docker compose logs -f news-media-app
docker compose images

# Restart after .env change
docker compose up -d

# Add a single new env var
echo 'NEW_KEY=value' >> .env
docker compose up -d

# Rollback to a previous image (by commit SHA tag)
docker pull ghcr.io/forhu/news-media-app:<old-sha>
docker compose up -d

# Full teardown (keeps DB volume)
docker compose down

# Full teardown including DB data (destructive)
docker compose down -v
```
