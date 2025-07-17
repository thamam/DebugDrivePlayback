# Debug Player Framework - Local Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the Debug Player Framework locally on your machine. The application includes a React frontend, Express.js backend, Python FastAPI backend, and PostgreSQL database.

## Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+), macOS 11+, or Windows 10/11
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space minimum
- **Network**: Internet connection for package downloads

### Required Software

#### 1. Node.js (v18 or v20)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS (with Homebrew)
brew install node@20

# Windows (download from nodejs.org)
# https://nodejs.org/en/download/
```

#### 2. Python 3.8+ (Python 3.11 recommended)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv

# For Python 3.11 specifically (recommended for NumPy compatibility):
sudo apt install python3.11 python3.11-venv python3.11-dev

# macOS (with Homebrew)
brew install python@3.11

# Windows
# Download from python.org or use Microsoft Store
```

**Note**: Python 3.11 is recommended as it has better NumPy wheel support and avoids common build issues.

#### 3. PostgreSQL 13+
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (with Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### 4. Git
```bash
# Ubuntu/Debian
sudo apt install git

# macOS
# Already installed or via Homebrew: brew install git

# Windows
# Download from https://git-scm.com/download/win
```

## Installation Steps

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd debug-player-framework
```

### 2. Install Node.js Dependencies
```bash
# Install all dependencies
npm install

# Verify installation
npm run check
```

### 3. Set Up Python Environment
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r python_backend/requirements.txt
```

#### Troubleshooting Python Dependencies

If you encounter the error `BackendUnavailable: Cannot import 'setuptools.build_meta'`, this is typically due to NumPy 1.24.3 not having a prebuilt wheel for Python 3.12 on Linux. Here's how to fix it:

**Step 1: Verify the issue**
```bash
# In your activated venv, test if setuptools.build_meta is available
source venv/bin/activate
python3 -c "import setuptools.build_meta"
```

**Step 2: Upgrade build tools**
```bash
# Upgrade pip, setuptools, and wheel (these provide PEP 517 build hooks)
pip install --upgrade pip setuptools wheel

# Try installing Python dependencies again
pip install -r python_backend/requirements.txt
```

**Step 3: Install build prerequisites (if Step 2 fails)**
```bash
# Install OS-level build prerequisites for NumPy compilation
sudo apt-get update
sudo apt-get install -y build-essential python3-dev gfortran libopenblas-dev liblapack-dev

# Retry the pip install
pip install -r python_backend/requirements.txt
```

**Alternative: Use Python 3.11 (Recommended)**
If the above steps fail, you can switch to Python 3.11 (which has official NumPy wheels):
```bash
# Ubuntu/Debian - Install Python 3.11 and required packages
sudo apt install python3.11 python3.11-venv python3.11-dev

# Remove existing venv (if it exists)
rm -rf venv

# Create venv with Python 3.11
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip and install dependencies
pip install --upgrade pip setuptools wheel
pip install -r python_backend/requirements.txt
```

**Common Python 3.12 Issues**
If you encounter `AttributeError: module 'pkgutil' has no attribute 'ImpImporter'` with Python 3.12:
- This is due to compatibility issues between Python 3.12 and older NumPy versions
- The cleanest solution is to use Python 3.11 as shown above
- Python 3.12 support for NumPy 1.24.3 requires building from source, which is complex

### 4. Database Setup

#### Create PostgreSQL Database
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user (run these commands inside the psql prompt)
CREATE DATABASE debug_player_framework;
CREATE USER debug_user WITH PASSWORD 'debug_password';
GRANT ALL PRIVILEGES ON DATABASE debug_player_framework TO debug_user;

# Connect to the database to grant schema permissions
\c debug_player_framework
GRANT ALL ON SCHEMA public TO debug_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO debug_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO debug_user;

# Exit PostgreSQL
\q
```

**If you need to recreate the user:**
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# If the user already exists, revoke privileges first
REVOKE ALL PRIVILEGES ON DATABASE debug_player_framework FROM debug_user;
\c debug_player_framework
REVOKE ALL ON SCHEMA public FROM debug_user;
\c postgres
DROP USER debug_user;

# Then recreate as shown above
```

#### Alternative: Using Docker for PostgreSQL
```bash
# Run PostgreSQL in Docker
docker run --name debug-postgres \
  -e POSTGRES_DB=debug_player_framework \
  -e POSTGRES_USER=debug_user \
  -e POSTGRES_PASSWORD=debug_password \
  -p 5432:5432 \
  -d postgres:13
```

### 5. Environment Configuration

#### Create .env File
```bash
# Create .env file in project root (there's no .env.example, so create directly)
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://debug_user:debug_password@localhost:5432/debug_player_framework

# Application Configuration
NODE_ENV=development
PORT=5000
PYTHON_BACKEND_PORT=8000

# Optional: Python Backend Configuration
PYTHON_BACKEND_HOST=localhost
PYTHON_BACKEND_URL=http://localhost:8000
EOF
```

#### Verify Environment Variables
```bash
# Check that the file was created correctly
cat .env
```

### 6. Database Migration
```bash
# Test database connection first
psql -d debug_player_framework -U debug_user -h localhost -c "\dt"
# Password: debug_password
# Expected output: "Did not find any relations." (this is normal for empty database)

# Install dotenv package (required for environment variables)
npm install dotenv

# Push database schema
npm run db:push

# Verify tables were created
psql -d debug_player_framework -U debug_user -h localhost -c "\dt"
```

### 7. Real Data Setup

#### Download Real Trip Data
The application comes with authentic Kia Niro EV trip data in the `data/trips/2025-07-15T12_06_02/` directory.

#### Verify Data Files
```bash
# Check if data files exist
ls -la data/trips/2025-07-15T12_06_02/

# Should contain files like:
# - gps_latitude.csv
# - gps_longitude.csv
# - wheel_speed_fl.csv
# - wheel_speed_fr.csv
# - vehicle_speed.csv
# - throttle_pedal.csv
# - brake_pedal.csv
# - steering_wheel_angle.csv
# ... and more
```

#### Add Your Own Data
To add your own trip data:

1. Create a new directory in `data/trips/`:
```bash
mkdir -p data/trips/your-trip-name
```

2. Add CSV files with format:
```csv
time_stamp,data_value
1752570362,0.0
1752570363,1.5
...
```

3. Required signals (minimum):
- `vehicle_speed.csv`
- `gps_latitude.csv`
- `gps_longitude.csv`
- `steering_wheel_angle.csv`

## Running the Application

### 1. Start the Python Backend
```bash
# Activate Python environment
source venv/bin/activate

# Start FastAPI server
cd python_backend
python run_server.py

# Or directly with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start the Frontend & Express Backend
```bash
# Check if port 5000 is available
sudo lsof -i :5000

# Kill any existing processes if needed
sudo pkill -f node

# Start the development server
npm run dev
```

### 3. Access the Application
- **Frontend**: http://localhost:5000
- **Python Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Testing the Setup

### 1. Load Real Data
1. Open http://localhost:5000 in your browser
2. Navigate to "Trip Loader" tab
3. Enter path: `data/trips/2025-07-15T12_06_02`
4. Click "Load Trip Data"
5. Verify data loads successfully

### 2. Test Python Backend
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test plugins endpoint
curl http://localhost:8000/plugins

# Test signals endpoint
curl http://localhost:8000/signals
```

### 3. Run Test Suite
```bash
# Run all tests
npm test

# Run specific tests
npm run test:unit
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## Development Workflow

### 1. Daily Development
```bash
# Start Python backend
source venv/bin/activate
cd python_backend && python run_server.py

# Start frontend (in new terminal)
npm run dev

# Both services will auto-reload on changes
```

### 2. After System Reboot
```bash
# Reactivate Python environment
source venv/bin/activate

# Verify Python dependencies are still installed
pip list | grep -E "(fastapi|uvicorn|numpy|pandas)"

# If packages are missing, reinstall
pip install -r python_backend/requirements.txt

# Start Python backend
cd python_backend && python run_server.py
```

## Common Issues and Solutions

### 1. NumPy Installation Issues
**Error**: `BackendUnavailable: Cannot import 'setuptools.build_meta'`
**Solution**: Use Python 3.11 instead of Python 3.12 (see troubleshooting section above)

### 2. PostgreSQL Authentication Failed
**Error**: `password authentication failed for user "debug_user"`
**Solution**: Recreate the user with proper privileges (see database setup section)

### 3. Environment Variables Not Loading
**Error**: `DATABASE_URL must be set`
**Solution**: Install dotenv package: `npm install dotenv`

### 4. Port Already in Use
**Error**: `EADDRINUSE: address already in use 0.0.0.0:5000`
**Solution**: Kill existing processes: `sudo pkill -f node` or `sudo lsof -i :5000`

### 5. Virtual Environment Creation Failed
**Error**: `No module named venv`
**Solution**: Install venv package: `sudo apt install python3.11-venv`

### 6. Package Lock File Conflicts
**Issue**: Many changed files in `package-lock.json`
**Explanation**: This is normal when switching between local and Replit environments
**Solution**: Commit your local changes if the setup is working correctly

### 7. Vite Version Conflict
**Error**: `ERESOLVE could not resolve` with @tailwindcss/vite and Vite version mismatch
**Cause**: Local Node.js/npm version differs from project requirements
**Solution**: 
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Use npm ci to install exact versions from package-lock.json
npm ci

# Or if that fails, clean install
npm install
```

### 8. Database Connection Test
**Expected Output**: `Did not find any relations.` (this means connection works, just no tables yet)
**Next Step**: Run `npm run db:push` to create the tables

## Environment Differences

### Local vs Replit
- **Node.js Version**: Local may differ from Replit's Node.js version
- **Package Lock**: Different environments generate different lock files
- **Python Version**: Local Python version may differ from Replit
- **Database**: Local PostgreSQL vs Replit's managed database

### Keeping Environments in Sync
1. Use the same Node.js version (check `package.json` engines field)
2. Use Python 3.11 for consistency
3. Commit working `package-lock.json` for your environment
4. Document any environment-specific configurations

### Node.js Version Compatibility
**Issue**: Your local Node.js v22.17.0 with npm v11.4.2 may have different dependency resolution than Replit
**Recommendation**: Use Node.js v20.x for better compatibility
```bash
# Check your current versions
node --version
npm --version

# Install Node.js v20 (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or use nvm for version management
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 2. Database Changes
```bash
# After modifying shared/schema.ts
npm run db:push
```

### 3. Adding New Dependencies
```bash
# Frontend dependencies
npm install package-name

# Python dependencies
pip install package-name
pip freeze > python_backend/requirements.txt
```

## Production Deployment

### 1. Build for Production
```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

### 2. Environment Variables
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=5000
```

### 3. Process Management
```bash
# Using PM2 for Node.js
npm install -g pm2
pm2 start npm --name "debug-player" -- start

# Using systemd for Python backend
sudo nano /etc/systemd/system/debug-player-python.service
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=3000 npm run dev
```

#### 2. Database Connection Error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -d debug_player_framework -U debug_user -h localhost
```

#### 3. Python Backend Not Starting
```bash
# Check Python version
python --version

# Check virtual environment
which python

# Install missing dependencies
pip install -r python_backend/requirements.txt
```

#### 4. Real Data Not Loading
```bash
# Check data directory permissions
ls -la data/trips/2025-07-15T12_06_02/

# Verify CSV file format
head -5 data/trips/2025-07-15T12_06_02/vehicle_speed.csv
```

### Performance Optimization

#### 1. Database Indexing
```sql
-- Add indexes for common queries
CREATE INDEX idx_vehicle_data_session_id ON vehicle_data(session_id);
CREATE INDEX idx_vehicle_data_timestamp ON vehicle_data(timestamp);
```

#### 2. Python Backend Caching
```python
# Enable Redis caching (optional)
pip install redis
# Configure in python_backend/main.py
```

## Support

### Documentation
- **API Documentation**: http://localhost:8000/docs (when running)
- **Frontend Components**: Check `client/src/components/`
- **Backend API**: Check `server/routes.ts`
- **Python Backend**: Check `python_backend/main.py`

### Getting Help
1. Check the troubleshooting section above
2. Review the test files in `tests/` for examples
3. Check the browser console for frontend errors
4. Check the terminal output for backend errors

## Next Steps

After successful setup:
1. **Load Real Data**: Use the Trip Loader to load your vehicle data
2. **Create Widgets**: Use the Widget Wizard to create custom visualizations
3. **Develop Plugins**: Create custom plugins for your specific data analysis needs
4. **Extend Functionality**: Add new features using the extensible architecture

The application is now ready for local development with real vehicle data!