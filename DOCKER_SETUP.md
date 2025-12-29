# Docker Setup Guide for VoiceCompanion

## Prerequisites

1. **Docker Desktop** must be installed and running
   - Download from: https://www.docker.com/products/docker-desktop
   - Make sure Docker Desktop is running (you should see the Docker icon in your system tray)

2. **Docker Compose** (usually included with Docker Desktop)

## Quick Start

### 1. Start Docker Desktop

Make sure Docker Desktop is running before proceeding.

### 2. Create Environment File

Create a `.env` file in the project root (or copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
ELEVENLABS_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

### 3. Build and Start Containers

**Development Mode (with hot reload):**
```bash
docker compose -f docker-compose.dev.yml up --build
```

**Production Mode:**
```bash
docker compose up --build
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Docker Commands

### Build containers
```bash
docker compose -f docker-compose.dev.yml build
```

### Start containers
```bash
docker compose -f docker-compose.dev.yml up
```

### Start in background (detached mode)
```bash
docker compose -f docker-compose.dev.yml up -d
```

### View logs
```bash
docker compose -f docker-compose.dev.yml logs -f
```

### View logs for specific service
```bash
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
```

### Stop containers
```bash
docker compose -f docker-compose.dev.yml down
```

### Stop and remove volumes
```bash
docker compose -f docker-compose.dev.yml down -v
```

### Rebuild without cache
```bash
docker compose -f docker-compose.dev.yml build --no-cache
```

### Execute commands in container
```bash
# Backend container
docker compose -f docker-compose.dev.yml exec backend sh

# Frontend container
docker compose -f docker-compose.dev.yml exec frontend sh
```

## Troubleshooting

### Docker daemon not running
**Error**: `Cannot connect to the Docker daemon`

**Solution**: 
1. Start Docker Desktop
2. Wait for it to fully start (check system tray icon)
3. Try the command again

### Port already in use
**Error**: `port is already allocated`

**Solution**: 
1. Check what's using the port:
   ```bash
   lsof -i :3000  # Frontend
   lsof -i :5000  # Backend
   ```
2. Stop the process using the port, or change ports in `docker-compose.dev.yml`

### Build fails
**Error**: Build errors during `docker compose build`

**Solutions**:
1. Check Dockerfile syntax
2. Ensure all required files exist
3. Try rebuilding without cache:
   ```bash
   docker compose -f docker-compose.dev.yml build --no-cache
   ```

### Container exits immediately
**Error**: Container starts then stops

**Solution**:
1. Check logs:
   ```bash
   docker compose -f docker-compose.dev.yml logs backend
   docker compose -f docker-compose.dev.yml logs frontend
   ```
2. Common issues:
   - Missing environment variables
   - Port conflicts
   - Build errors

### API connection issues
**Error**: Frontend can't connect to backend

**Solution**:
1. Check both containers are running:
   ```bash
   docker compose -f docker-compose.dev.yml ps
   ```
2. Verify network connectivity:
   ```bash
   docker compose -f docker-compose.dev.yml exec frontend ping backend
   ```
3. Check backend health:
   ```bash
   curl http://localhost:5000/health
   ```

### Permission errors
**Error**: Permission denied errors

**Solution**:
1. On Linux/Mac, you might need to add your user to docker group:
   ```bash
   sudo usermod -aG docker $USER
   ```
2. Restart Docker Desktop

## Development vs Production

### Development Mode (`docker-compose.dev.yml`)
- Hot reload enabled
- Source code mounted as volumes
- Faster iteration
- More verbose logging

### Production Mode (`docker-compose.yml`)
- Optimized builds
- No source code volumes
- Production-ready configuration
- Smaller image sizes

## Environment Variables

Required environment variables:
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key
- `GEMINI_API_KEY` - Your Google Cloud Gemini API key

Optional (for Vision API features):
- `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud project ID
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account key
- `VERTEX_AI_LOCATION` - Vertex AI location (default: us-central1)

## Network Architecture

```
┌─────────────┐
│  Frontend   │ (Port 3000)
│  (Nginx)    │
└──────┬──────┘
       │
       │ /api proxy
       │
┌──────▼──────┐
│   Backend   │ (Port 5000)
│  (Express)  │
└─────────────┘
```

Both services are on the same Docker network (`voicecompanion-network`) for internal communication.

## Next Steps

1. Start Docker Desktop
2. Run `docker compose -f docker-compose.dev.yml up --build`
3. Open http://localhost:3000 in your browser
4. Check logs if you encounter any issues

