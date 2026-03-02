# fix-phone

A phone repair booking web app (Node.js/Express backend + static frontend).

## Features

- 📅 Online appointment booking with form validation
- 🛠️ Admin panel for managing appointments, services, and repair types  
- 🔐 Admin panel protected by password authentication
- 🌐 English / Slovak i18n
- 🐳 Multi-arch Docker image (amd64, arm64, arm/v7) — runs on Raspberry Pi

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ADMIN_PASSWORD` | **Yes** | Password for the admin panel (`/admin`). **Change from default before deploying.** |
| `JWT_SECRET` | **Yes** | Secret used to sign admin session tokens. Use `openssl rand -hex 32`. |
| `PORT` | No | HTTP port (default `3000`) |
| `DB_PATH` | No | Path to the SQLite database file |

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
# Edit .env and set strong values for ADMIN_PASSWORD and JWT_SECRET
```

## Docker deployment (Raspberry Pi / any host)

The Docker image is published automatically to the GitHub Container Registry as a multi-arch image (amd64, arm64, arm/v7), so it runs natively on Raspberry Pi 3/4/5.

### Quick start with Docker Compose

```bash
# Download the compose file
curl -O https://raw.githubusercontent.com/KoHaku743/fix-phone/main/docker-compose.yml

# Edit ADMIN_PASSWORD and JWT_SECRET in docker-compose.yml, then:
docker compose up -d
```

The app will be available at `http://<your-pi-ip>:3000`.  
The admin panel is at `http://<your-pi-ip>:3000/admin`.

### Quick start with Docker

```bash
docker run -d \
  --name fix-phone \
  -p 3000:3000 \
  -v fix-phone-data:/app/backend/data \
  --restart unless-stopped \
  -e ADMIN_PASSWORD=your-strong-password \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  ghcr.io/kohaku743/fix-phone:latest
```

### Updating

```bash
docker compose pull && docker compose up -d
```

## Development

```bash
cp .env.example .env   # set ADMIN_PASSWORD and JWT_SECRET
cd backend
npm install
node server.js
```

> **Note:** After the PR is merged to `main`, make the `fix-phone` package public via  
> GitHub → Packages → fix-phone → Package settings → Change visibility → Public.

