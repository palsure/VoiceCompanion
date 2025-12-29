# Quick Start with Docker

## Prerequisites

1. **Docker Desktop** must be installed and running
   - Check: `docker --version`
   - If not installed: https://www.docker.com/products/docker-desktop

2. **Environment Variables**
   - Create `.env` file in project root (see `.env.example`)
   - Add your API keys:
     ```env
     ELEVENLABS_API_KEY=your_key
     GEMINI_API_KEY=your_key
     ```

## Start the Application

### Option 1: Using the startup script
```bash
./start-docker.sh
```

### Option 2: Manual start
```bash
# Build and start
docker compose -f docker-compose.dev.yml up --build

# Or in background
docker compose -f docker-compose.dev.yml up -d --build
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Common Commands

```bash
# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop containers
docker compose -f docker-compose.dev.yml down

# Rebuild
docker compose -f docker-compose.dev.yml build --no-cache
```

## Troubleshooting

### Docker not running
```bash
# Check Docker status
docker info

# If error, start Docker Desktop
```

### Port conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :5000

# Change ports in docker-compose.dev.yml if needed
```

### View container logs
```bash
# All services
docker compose -f docker-compose.dev.yml logs

# Specific service
docker compose -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.dev.yml logs frontend
```

For more details, see [DOCKER_SETUP.md](DOCKER_SETUP.md)

