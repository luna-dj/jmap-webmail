# Docker Deployment Guide

This guide explains how to deploy JMAP Webmail using Docker.

## Quick Start

### Production Deployment

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f webmail

# Stop the container
docker-compose down
```

The application will be available at `http://localhost:3000`.

### Development Mode

For development with hot reload:

```bash
docker-compose -f docker-compose.dev.yml up
```

## Manual Docker Commands

### Build the Image

```bash
docker build -t jmap-webmail .
```

### Run the Container

```bash
docker run -d \
  --name jmap-webmail \
  -p 3000:3000 \
  -e NODE_ENV=production \
  jmap-webmail
```

### With Environment Variables

```bash
docker run -d \
  --name jmap-webmail \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_JMAP_SERVER_URL=https://your-jmap-server.com \
  jmap-webmail
```

### With Environment File

```bash
docker run -d \
  --name jmap-webmail \
  -p 3000:3000 \
  --env-file .env \
  jmap-webmail
```

## Configuration

### Environment Variables

You can configure the application using environment variables:

- `NODE_ENV`: Set to `production` for production builds
- `NEXT_PUBLIC_JMAP_SERVER_URL`: Your JMAP server URL
- `NEXT_PUBLIC_APP_NAME`: Application name displayed in the UI
- `PORT`: Port to run the server on (default: 3000)
- `HOSTNAME`: Hostname to bind to (default: 0.0.0.0)

### Using docker-compose.yml

Edit `docker-compose.yml` and add your environment variables:

```yaml
services:
  webmail:
    environment:
      - NEXT_PUBLIC_JMAP_SERVER_URL=https://your-jmap-server.com
      - NEXT_PUBLIC_APP_NAME=My Webmail
```

Or use an environment file:

```yaml
services:
  webmail:
    env_file:
      - .env
```

## Health Checks

The docker-compose configuration includes a health check that verifies the application is running. You can check the health status:

```bash
docker-compose ps
```

## Troubleshooting

### View Logs

```bash
# All logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Container

```bash
docker-compose restart
```

### Rebuild After Changes

```bash
# Rebuild and restart
docker-compose up -d --build
```

### Access Container Shell

```bash
docker-compose exec webmail sh
```

## Production Considerations

1. **Reverse Proxy**: Use a reverse proxy (nginx, Traefik, etc.) for SSL/TLS termination
2. **Environment Variables**: Store sensitive configuration in environment variables or secrets
3. **Resource Limits**: Set appropriate CPU and memory limits in docker-compose.yml
4. **Persistent Storage**: If needed, mount volumes for persistent data
5. **Monitoring**: Set up health checks and monitoring for production deployments

### Example with Resource Limits

```yaml
services:
  webmail:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Multi-Architecture Support

The Dockerfile uses `node:20-alpine` which supports multiple architectures. To build for a specific architecture:

```bash
# For ARM64 (Apple Silicon, Raspberry Pi, etc.)
docker buildx build --platform linux/arm64 -t jmap-webmail .

# For AMD64 (Intel/AMD)
docker buildx build --platform linux/amd64 -t jmap-webmail .
```
