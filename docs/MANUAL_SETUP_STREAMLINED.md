# Streamlined Manual Setup - Debug Player Framework
## Essential Dependencies Only

### Node.js Version Management (Required)

**Install nvm and Node.js 22:**
```bash
# Download and install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# Reload shell or restart terminal, then:
. "$HOME/.nvm/nvm.sh"

# Install Node.js 22
nvm install 22
nvm use 22

# Verify versions
node -v    # Should print "v22.17.1"
npm -v     # Should print "10.9.2"
```

### Repository Setup

```bash
# Clone repository
git clone git@github.com:thamam/DebugDrivePlayback.git
cd DebugDrivePlayback

# Install Node.js dependencies
npm install --legacy-peer-deps
```

### Python Environment (Minimal)

**Option A: System Python (if Python 3.11+ available)**
```bash
# Check Python version
python3 --version  # Should be 3.11 or higher

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r python_backend/requirements.txt
```

**Option B: Install Python 3.11 (if needed)**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev

# macOS (with Homebrew)
brew install python@3.11

# Then follow Option A steps
```

### Database Setup (PostgreSQL)

**Option A: Docker PostgreSQL (Recommended - no system install)**
```bash
# Start PostgreSQL in Docker (lightweight approach)
docker run --name debug-postgres -e POSTGRES_PASSWORD=debug_pass -e POSTGRES_USER=debug_user -e POSTGRES_DB=debug_player -p 5432:5432 -d postgres:15

# Set environment variable
echo 'DATABASE_URL="postgresql://debug_user:debug_pass@localhost:5432/debug_player"' > .env
```

**Option B: System PostgreSQL (if you prefer)**
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Create database and user
sudo -u postgres createuser debug_user
sudo -u postgres createdb debug_player
sudo -u postgres psql -c "ALTER USER debug_user WITH PASSWORD 'debug_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE debug_player TO debug_user;"

# Set environment variable
echo 'DATABASE_URL="postgresql://debug_user:debug_pass@localhost:5432/debug_player"' > .env
```

### Environment Configuration

```bash
# Install dotenv for Node.js environment variables
npm install dotenv

# Push database schema
npm run db:push
```

### Start Application

```bash
# Terminal 1: Start Python backend
cd python_backend
source ../venv/bin/activate
python run_server.py

# Terminal 2: Start Node.js frontend
npm run dev
```

**Application URL:** http://localhost:5000

---

## Essential Dependencies Summary

**Always Required:**
- Git (for repository cloning)
- Node.js 22 with npm (via nvm)

**Python Options:**
- System Python 3.11+ OR
- Install Python 3.11

**Database Options:**
- Docker PostgreSQL (recommended) OR  
- System PostgreSQL

**Why This Approach:**
- **Minimal System Impact:** Only installs truly essential components
- **Flexibility:** Choose database approach that fits your system
- **Performance:** Full native performance for data processing
- **Clean:** Easy to remove when done

---

## Troubleshooting

**Node.js Issues:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall with legacy peer deps
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**Python Issues:**
```bash
# Recreate virtual environment
rm -rf venv
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r python_backend/requirements.txt
```

**Database Connection:**
```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"

# For Docker PostgreSQL
docker exec -it debug-postgres psql -U debug_user -d debug_player -c "SELECT version();"
```

**Port Conflicts:**
```bash
# Check what's using port 5000
lsof -i :5000
# Kill the process if needed
kill -9 <PID>
```

This streamlined approach gives you maximum performance with minimal system dependencies.
