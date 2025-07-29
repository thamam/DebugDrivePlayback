# Docker Setup - Debug Player Framework
## Lightweight Alternative for Clean Development Environment

### Why Use Docker Setup?
- **No System Dependencies**: Avoid installing Python, Node.js, PostgreSQL on your main system
- **Clean Environment**: Isolated development environment
- **Quick Setup**: Single command to get started
- **Cross-Platform**: Works identically on Windows, Mac, and Linux

---

## Prerequisites (Minimal)

### Required (All Platforms)
- **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/)
- **Git**: For cloning the repository

### Repository Clone
```bash
git clone git@github.com:thamam/DebugDrivePlayback.git
cd DebugDrivePlayback
```

---

## Quick Start (Single Command)

```bash
# Start everything with Docker Compose
docker-compose up --build
```

**That's it!** The application will be available at http://localhost:5000

---

## Docker Configuration Files

### docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: debug_player
      POSTGRES_USER: debug_user
      POSTGRES_PASSWORD: debug_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "5000:5000"
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://debug_user:debug_pass@postgres:5432/debug_player
      NODE_ENV: development
    volumes:
      - .:/app
      - /app/node_modules
      - /app/venv
    depends_on:
      - postgres
    command: >
      bash -c "
        npm install &&
        python -m venv venv &&
        source venv/bin/activate &&
        pip install -r python_backend/requirements.txt &&
        npm run db:push &&
        npm run dev
      "

volumes:
  postgres_data:
```

### Dockerfile
```dockerfile
FROM node:22-bullseye

# Install Python 3.11 and system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY python_backend/requirements.txt ./python_backend/

# Set environment variables
ENV NODE_ENV=development
ENV PYTHON_VERSION=3.11

# Expose ports
EXPOSE 5000 8000

# Default command (overridden by docker-compose)
CMD ["npm", "run", "dev"]
```

---

## Docker Commands

### Development Workflow
```bash
# Start services
docker-compose up

# Start with rebuild
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Access container shell
docker-compose exec backend bash
```

### Database Operations
```bash
# Reset database
docker-compose down -v
docker-compose up --build

# Run database migrations
docker-compose exec backend npm run db:push

# Access PostgreSQL directly
docker-compose exec postgres psql -U debug_user -d debug_player
```

---

## Advantages vs Manual Setup

| Feature | Docker Setup | Manual Setup |
|---------|--------------|--------------|
| **Setup Time** | 5 minutes | 30+ minutes |
| **System Impact** | Minimal | High |
| **Dependencies** | Docker only | Python, Node.js, PostgreSQL |
| **Isolation** | Complete | None |
| **Cleanup** | `docker-compose down -v` | Manual uninstall |
| **Consistency** | Identical across platforms | Platform variations |

---

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Check what's using the port
docker-compose down
lsof -i :5000
# Kill the process or change ports in docker-compose.yml
```

**Permission Issues (Linux):**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

**Container Won't Start:**
```bash
# Clean rebuild
docker-compose down -v
docker system prune -a
docker-compose up --build
```

**Database Connection Issues:**
```bash
# Reset database
docker-compose down -v
docker-compose up --build
```

---

## Development Tips

### Hot Reloading
- Frontend and backend automatically reload on file changes
- No need to restart containers for code changes

### Debugging
```bash
# View container logs
docker-compose logs backend
docker-compose logs postgres

# Access backend container
docker-compose exec backend bash
source venv/bin/activate
python python_backend/run_server.py
```

### Data Persistence
- Database data persists in Docker volumes
- Trip data in `/data` directory is mounted and accessible

---

## When to Use Docker vs Manual Setup

### Use Docker When:
- You want minimal system impact
- You're on Windows or Mac
- You don't want to install dependencies
- You want consistent environment
- You're doing temporary development

### Use Manual Setup When:
- You need maximum performance
- You're processing large real datasets
- You want direct system access
- You're doing long-term development
- You prefer system-native tools

---

## Migration Between Setups

### From Manual to Docker:
```bash
# Backup any local data
cp -r data/ data_backup/

# Stop manual services
# Kill local PostgreSQL, Node.js processes

# Start Docker
docker-compose up --build
```

### From Docker to Manual:
```bash
# Export database (if needed)
docker-compose exec postgres pg_dump -U debug_user debug_player > backup.sql

# Stop Docker
docker-compose down

# Follow manual setup instructions
# Import database if needed
```

This Docker setup provides a clean, isolated development environment without cluttering your system with dependencies.
