#!/bin/bash

# Debug Player Framework - One-Command Launcher
# Automatically detects setup and runs the application

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

echo "🚀 Debug Player Framework - One-Command Launcher"
echo "================================================"

# Check if already set up
if [[ -f ".env" && -d "venv" && -d "node_modules" ]]; then
    print_success "Setup detected, starting application..."
    echo ""
    print_info "🌐 Application will be available at:"
    echo -e "${GREEN}   → http://localhost:5000${NC}"
    echo -e "${BLUE}   → Click the link above to open the Debug Player Framework${NC}"
    echo ""
    npm run dev
    exit 0
fi

# First-time setup required
print_info "First-time setup required..."

# Check for Docker
if command -v docker >/dev/null 2>&1; then
    print_info "Docker detected, using Docker + manual setup..."
    
    # Setup PostgreSQL with Docker
    if ! docker ps | grep -q debug-postgres; then
        print_info "Setting up PostgreSQL with Docker..."
        ./start-postgres-only.sh
    else
        print_success "PostgreSQL already running in Docker"
    fi
    
    # Run local setup
    print_info "Running local setup..."
    ./local-setup.sh
    
    # Start application
    print_success "Starting application..."
    echo ""
    print_info "🌐 Application will be available at:"
    echo -e "${GREEN}   → http://localhost:5000${NC}"
    echo -e "${BLUE}   → Click the link above to open the Debug Player Framework${NC}"
    echo ""
    npm run dev
    
elif command -v psql >/dev/null 2>&1; then
    print_info "PostgreSQL detected, using fully manual setup..."
    
    # Setup database manually
    if ! psql -h localhost -U debug_user -d debug_player -c "\q" 2>/dev/null; then
        print_warning "Database not configured, setting up..."
        sudo -u postgres createuser debug_user 2>/dev/null || true
        sudo -u postgres createdb debug_player 2>/dev/null || true
        sudo -u postgres psql -c "ALTER USER debug_user WITH PASSWORD 'debug_pass';" 2>/dev/null || true
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE debug_player TO debug_user;" 2>/dev/null || true
        echo 'DATABASE_URL="postgresql://debug_user:debug_pass@localhost:5432/debug_player"' > .env
    fi
    
    # Run local setup
    print_info "Running local setup..."
    ./local-setup.sh
    
    # Start application
    print_success "Starting application..."
    echo ""
    print_info "🌐 Application will be available at:"
    echo -e "${GREEN}   → http://localhost:5000${NC}"
    echo -e "${BLUE}   → Click the link above to open the Debug Player Framework${NC}"
    echo ""
    npm run dev
    
else
    print_error "No database solution found!"
    echo ""
    print_info "Please install one of the following:"
    echo "1. Docker Desktop (recommended): https://docker.com/products/docker-desktop"
    echo "2. PostgreSQL: sudo apt install postgresql (Linux) or brew install postgresql (macOS)"
    echo ""
    print_info "Then run this script again: ./run.sh"
    exit 1
fi