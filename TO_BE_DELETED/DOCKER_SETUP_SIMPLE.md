# Simple Docker Setup - Debug Player Framework

**Last Certified: 2025-07-30**

## Quick Start with Standard Python

If the main Docker setup fails, use this simplified version:

### Option 1: Simple Dockerfile (Uses system Python)

**Create this Dockerfile:**
```dockerfile
FROM node:22

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy files
COPY package*.json ./
COPY python_backend/requirements.txt ./python_backend/

# Install Node.js dependencies
RUN npm install --legacy-peer-deps

# Create Python virtual environment
RUN python3 -m venv venv

# Expose ports
EXPOSE 5000 8000

# Start command
CMD ["npm", "run", "dev"]
```

**Simple docker-compose.yml:**
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

  app:
    build: .
    ports:
      - "5000:5000"
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://debug_user:debug_pass@postgres:5432/debug_player
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
    command: >
      bash -c "
        source venv/bin/activate &&
        pip install -r python_backend/requirements.txt &&
        npm run db:push &&
        npm run dev
      "
```

### Option 2: PostgreSQL Only (Recommended for Build Issues)

**This is the most reliable approach when Docker builds fail:**

```bash
# Quick setup script
chmod +x start-postgres-only.sh
./start-postgres-only.sh

# Then continue with manual setup
npm install --legacy-peer-deps
python3 -m venv venv
source venv/bin/activate
pip install -r python_backend/requirements.txt
npm run db:push
npm run dev
```

**Or manually:**
```bash
# Start only PostgreSQL in Docker
docker run --name debug-postgres \
  -e POSTGRES_PASSWORD=debug_pass \
  -e POSTGRES_USER=debug_user \
  -e POSTGRES_DB=debug_player \
  -p 5432:5432 \
  -d postgres:15

# Create environment file
echo 'DATABASE_URL="postgresql://debug_user:debug_pass@localhost:5432/debug_player"' > .env

# Then run the app manually on your system
npm install --legacy-peer-deps
python3 -m venv venv
source venv/bin/activate
pip install -r python_backend/requirements.txt
npm run db:push
npm run dev
```

### Troubleshooting Docker Issues

**Build Fails with Python Package Errors:**
```bash
# Use Option 2 (PostgreSQL only)
# Or use manual setup from MANUAL_SETUP_STREAMLINED.md
```

**Port Already in Use:**
```bash
docker stop debug-postgres
docker rm debug-postgres
```

**Permission Denied:**
```bash
sudo docker-compose down
sudo docker-compose up --build
```

This simplified approach avoids complex Python version issues while still providing Docker benefits for the database.
