#!/bin/bash

# Debug Player Framework - Docker Setup Script
# Simplifies installation and setup using Docker Compose

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

echo "🚀 Debug Player Framework - Docker Setup"
echo "========================================"

# Check Docker installation
if ! command -v docker >/dev/null 2>&1; then
    print_error "Docker is not installed!"
    echo ""
    print_info "Please install Docker first:"
    echo "  Ubuntu/Debian: sudo apt install docker.io docker-compose"
    echo "  macOS: brew install docker docker-compose"
    echo "  Windows: Download Docker Desktop from docker.com"
    exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
    print_error "Docker Compose is not installed!"
    echo ""
    print_info "Please install Docker Compose:"
    echo "  pip install docker-compose"
    echo "  or use Docker Desktop which includes Compose"
    exit 1
fi

print_success "Docker and Docker Compose are installed"

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker daemon is not running!"
    echo ""
    print_info "Run the fix script first:"
    echo "  ./fix-docker.sh"
    echo ""
    print_info "Or start Docker manually:"
    echo "  Ubuntu/Debian: sudo systemctl start docker"
    echo "  macOS/Windows: Start Docker Desktop"
    echo ""
    print_info "If you get permission errors, add your user to docker group:"
    echo "  sudo usermod -aG docker \$USER"
    echo "  newgrp docker"
    exit 1
fi

print_success "Docker daemon is running"

# Copy environment file
if [ ! -f .env ]; then
    print_info "Creating .env file from Docker template..."
    cp .env.docker .env
    print_success ".env file created"
else
    print_warning ".env file already exists, keeping existing configuration"
fi

# Stop any existing containers
print_info "Stopping any existing containers..."
docker-compose -f docker-compose-dev.yml down 2>/dev/null || true

# Build and start services
print_info "Building and starting services..."
docker-compose -f docker-compose-dev.yml up --build -d

# Wait for services to be healthy
print_info "Waiting for services to be ready..."

# Wait for PostgreSQL
print_info "Waiting for PostgreSQL..."
timeout=60
counter=0
while ! docker-compose -f docker-compose-dev.yml exec -T postgres pg_isready -U debug_user -d debug_player_framework >/dev/null 2>&1; do
    sleep 2
    counter=$((counter + 2))
    if [ $counter -ge $timeout ]; then
        print_error "PostgreSQL failed to start within $timeout seconds"
        docker-compose -f docker-compose-dev.yml logs postgres
        exit 1
    fi
done
print_success "PostgreSQL is ready"

# Wait for Python backend
print_info "Waiting for Python backend..."
timeout=120
counter=0
while ! curl -s http://localhost:8000/health >/dev/null 2>&1; do
    sleep 3
    counter=$((counter + 3))
    if [ $counter -ge $timeout ]; then
        print_error "Python backend failed to start within $timeout seconds"
        docker-compose -f docker-compose-dev.yml logs python-backend
        exit 1
    fi
done
print_success "Python backend is ready"

# Initialize database schema
print_info "Initializing database schema..."
docker-compose -f docker-compose-dev.yml exec -T app-dev npm run db:push 2>/dev/null || {
    print_warning "Database schema initialization failed, will retry when app starts"
}

# Wait for main application
print_info "Waiting for main application..."
timeout=60
counter=0
while ! curl -s http://localhost:5000/api/health >/dev/null 2>&1; do
    sleep 3
    counter=$((counter + 3))
    if [ $counter -ge $timeout ]; then
        print_error "Main application failed to start within $timeout seconds"
        docker-compose -f docker-compose-dev.yml logs app-dev
        exit 1
    fi
done
print_success "Main application is ready"

echo ""
print_success "🎉 Setup complete!"
echo ""
print_info "Services are now running:"
echo -e "${GREEN}   → Frontend & API: http://localhost:5000${NC}"
echo -e "${GREEN}   → Python Backend: http://localhost:8000${NC}"
echo -e "${GREEN}   → API Documentation: http://localhost:8000/docs${NC}"
echo ""
print_info "Useful commands:"
echo "  View logs:           docker-compose -f docker-compose-dev.yml logs -f"
echo "  Stop services:       docker-compose -f docker-compose-dev.yml down"
echo "  Restart services:    docker-compose -f docker-compose-dev.yml restart"
echo "  Update containers:   docker-compose -f docker-compose-dev.yml up --build -d"
echo ""
print_info "To load real trip data, visit the Trip Loader page and use:"
echo -e "${BLUE}   data/trips/2025-07-15T12_06_02${NC}"
echo ""

# Test data loading
print_info "Testing data loading capability..."
if curl -s -X POST http://localhost:5000/api/sessions/load \
   -H "Content-Type: application/json" \
   -d '{"path": "data/trips/2025-07-15T12_06_02"}' >/dev/null 2>&1; then
    print_success "Data loading test passed"
else
    print_warning "Data loading test failed - check that data directory is mounted correctly"
fi

echo ""
print_success "Ready to debug! Open http://localhost:5000 in your browser."
