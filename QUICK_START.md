# Debug Player Framework - Quick Start

## Absolute Simplest (1 Command)

```bash
./run.sh
```

**That's it!** The script automatically detects your system and sets everything up.

---

## Manual Options (If You Prefer Control)

### Option 1: Docker Database (2 Commands)

**Prerequisites:** Docker Desktop only

```bash
# 1. Setup database
./start-postgres-only.sh

# 2. Run application  
./local-setup.sh && npm run dev
```

**That's it!** Open http://localhost:5000

---

### Option 2: Fully Manual (1-2 Commands)

**Prerequisites:** Node.js 22, Python 3.11+

```bash
# If you have all prerequisites installed:
./local-setup.sh && npm run dev

# If you need to install prerequisites first:
# Ubuntu/Debian: sudo apt install nodejs python3.11 python3.11-venv postgresql
# macOS: brew install node python@3.11 postgresql  
# Then run: ./local-setup.sh && npm run dev
```

**That's it!** Open http://localhost:5000

---

## What These Commands Do

### `./start-postgres-only.sh` (Docker option)
- Starts PostgreSQL in Docker container
- Creates `.env` file with database connection
- No system PostgreSQL installation needed

### `./local-setup.sh`
- Installs Node.js 22 via nvm (if needed)
- Creates Python virtual environment
- Installs all dependencies (Node.js + Python)
- Sets up database schema
- Takes 2-5 minutes

### `npm run dev`
- Starts both frontend and backend servers
- Application available at http://localhost:5000

---

## Troubleshooting

**Command not found: ./local-setup.sh**
```bash
chmod +x local-setup.sh start-postgres-only.sh
```

**Docker issues:**
```bash
# Use manual PostgreSQL instead
sudo apt install postgresql  # or brew install postgresql
./local-setup.sh && npm run dev
```

**Python/Node.js not found:**
```bash
# Install prerequisites, then retry
./local-setup.sh && npm run dev
```

**Port 5000 already in use:**
```bash
# Kill existing process
lsof -ti:5000 | xargs kill -9
npm run dev
```

---

## After Setup

**Start application (after initial setup):**
```bash
npm run dev
```

**Stop application:**
```bash
Ctrl+C (in terminal)
```

**Reset everything:**
```bash
docker stop debug-postgres; docker rm debug-postgres
rm -rf venv node_modules .env
```

That's all you need to know! The setup scripts handle everything else automatically.