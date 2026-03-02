# fix-phone

A phone repair booking web app (Node.js/Express backend + static frontend).

## Docker deployment (Raspberry Pi / any host)

The Docker image is published automatically to the GitHub Container Registry as a multi-arch image (amd64, arm64, arm/v7), so it runs natively on Raspberry Pi 3/4/5.

### Quick start with Docker Compose

```bash
# Download the compose file
curl -O https://raw.githubusercontent.com/KoHaku743/fix-phone/main/docker-compose.yml

# Pull and start the container
docker compose up -d
```

The app will be available at `http://<your-pi-ip>:3000`.

### Quick start with Docker

```bash
docker run -d \
  --name fix-phone \
  -p 3000:3000 \
  -v fix-phone-data:/app/backend/data \
  --restart unless-stopped \
  ghcr.io/kohaku743/fix-phone:latest
```

### Updating

```bash
docker compose pull && docker compose up -d
```

## Development

```bash
cd backend
npm install
npm start
```
