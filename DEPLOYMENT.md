# Production Deployment Guide

This guide details how to deploy the University Football Platform to a production environment using Docker Compose.

## Prerequisites

- **Server**: Ubuntu 22.04 LTS (recommended)
- **RAM**: Minimum 4GB (8GB recommended for production)
- **Software**: Docker, Docker Compose, Git
- **Domains**: 
  - `platform.com` (Frontend)
  - `api.platform.com` (Backend)

## 1. Environment Setup

Clone the repository and set up environment variables:

```bash
git clone <your-repo-url>
cd football-platform
```

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://dbuser:dbpassword@postgres:5432/football_db?schema=public"

# Redis
REDIS_URL="redis://redis:6379"

# Security (Generate strong random strings)
JWT_SECRET="your-super-strong-jwt-secret"
JWT_REFRESH_SECRET="your-super-strong-refresh-secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# App
NODE_ENV="production"
PORT=5000
CLIENT_URL="https://platform.com"
```

## 2. Docker Compose Deployment

The platform is orchestrated via `docker-compose.yml`.

Run the full stack in detached mode:

```bash
docker compose up -d --build
```

### Services Started:
- `postgres`: PostgreSQL 15 Database (Port 5432 exposed to localhost only)
- `redis`: Redis 7 Cache/Session Store (Port 6379 exposed to localhost only)
- `backend`: Node.js API (Port 5000 mapped to host)
- `frontend`: Nginx serving React Vite Build (Port 80 mapped to host)
- `pgadmin`: Database Management UI (Port 5050 mapped to host, secure it via reverse proxy)

## 3. Database Initialization

After containers start, push the Prisma schema and seed initial data (Super Admin):

```bash
docker compose exec backend npx prisma db push
docker compose exec backend npx ts-node prisma/seed.ts
```

## 4. Reverse Proxy Setup (Nginx + Certbot)

For production, you should put a reverse proxy (e.g., Nginx on the host machine) in front of the Docker containers to handle SSL/TLS via Let's Encrypt.

Example `nginx.conf`:

```nginx
server {
    server_name api.platform.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Run Certbot:
```bash
sudo certbot --nginx -d api.platform.com -d platform.com
```

## 5. Security & Maintenance

### Backups
The platform supports Level 3 Reset backups. In production, also set up a cron job on the host machine for pg_dump:

```bash
0 3 * * * docker compose exec postgres pg_dump -U dbuser -d football_db -F c -f /var/lib/postgresql/data/backups/db-$(date +\%F).dump
```

### Cloudinary
Ensure `publicId` mappings are correctly saved in the DB. Level 3 Reset completely wipes the Cloudinary folder. Use isolated Cloudinary folders for staging vs production.

### Redis
Rate limits, session handling, and Socket.IO Pub/Sub are managed via Redis. Ensure Redis ports are closed to the public internet (handled via Docker networks by default).
