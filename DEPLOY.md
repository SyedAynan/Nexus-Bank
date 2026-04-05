# NEXA — Production Deployment Guide

## Quick Deploy (Docker Compose)

```bash
# 1. Clone and configure
git clone <repo-url> && cd nexa
cp .env.example .env
# Edit .env: set SECRET_KEY, DATABASE_URL, REDIS_URL

# 2. Build and start
docker-compose up -d --build

# 3. Run migrations
docker-compose exec web alembic upgrade head

# 4. Verify
curl http://localhost:8000/health
```

---

## Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name nexa.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name nexa.example.com;

    ssl_certificate     /etc/ssl/certs/nexa.crt;
    ssl_certificate_key /etc/ssl/private/nexa.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;

    # API backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Frontend (serve built React assets)
    location / {
        root /var/www/nexa/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d nexa.example.com
sudo certbot renew --dry-run  # test auto-renewal
```

---

## Production .env

```env
APP_NAME=NEXA — Beyond Fintech
ENVIRONMENT=production
DEBUG=false

DATABASE_URL=postgresql+psycopg2://nexa_prod:STRONG_PASSWORD@db:5432/nexa_prod
REDIS_URL=redis://redis:6379/0
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_urlsafe(64))">

ACCESS_TOKEN_EXPIRES_MINUTES=15
REFRESH_TOKEN_EXPIRES_MINUTES=1440
```

---

## AWS Deployment (EC2 + RDS)

1. **EC2 Instance**: t3.medium or larger, Ubuntu 22.04
2. **RDS**: PostgreSQL 15, db.t3.micro (dev) or db.r6g.large (prod)
3. **ElastiCache**: Redis 7, cache.t3.micro
4. **Security Groups**: Only allow 80/443 from ALB, 5432 from EC2 SG, 6379 from EC2 SG
5. **ALB**: Application Load Balancer with SSL termination

```bash
# On EC2
sudo apt update && sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER

# Deploy
scp -r . ec2-user@<ip>:/opt/nexa
ssh ec2-user@<ip> "cd /opt/nexa && docker-compose up -d --build"
```

---

## Monitoring

- **Health**: `GET /health` returns `{"status": "ok"}`
- **Logs**: `docker-compose logs -f web`
- **Metrics**: Integrate Prometheus + Grafana via `/metrics` endpoint
- **Alerts**: Configure CloudWatch or Datadog for error rate > 1%
