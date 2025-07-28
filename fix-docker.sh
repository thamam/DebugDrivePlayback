#!/bin/bash

# Debug Player Framework - Docker Service Fix
# Helps diagnose and fix Docker daemon issues

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

echo "🔧 Debug Player Framework - Docker Service Fix"
echo "==============================================="

# Check Docker installation
if ! command -v docker >/dev/null 2>&1; then
    print_error "Docker is not installed!"
    echo ""
    print_info "Install Docker:"
    echo "  sudo apt update"
    echo "  sudo apt install docker.io docker-compose-plugin"
    echo "  sudo usermod -aG docker \$USER"
    echo "  newgrp docker"
    exit 1
fi

print_success "Docker is installed"

# Check Docker daemon status
if ! docker info >/dev/null 2>&1; then
    print_warning "Docker daemon is not running"
    echo ""
    print_info "Attempting to start Docker daemon..."
    
    # Try to start Docker service
    if command -v systemctl >/dev/null 2>&1; then
        echo "Using systemctl to start Docker..."
        echo "You may be prompted for your password:"
        if sudo systemctl start docker; then
            print_success "Docker service started"
            
            # Enable Docker to start on boot
            sudo systemctl enable docker
            print_success "Docker enabled for auto-start"
            
            # Add user to docker group if not already
            if ! groups | grep -q docker; then
                print_info "Adding user to docker group..."
                sudo usermod -aG docker $USER
                print_warning "You need to log out and log back in for group changes to take effect"
                print_info "Or run: newgrp docker"
            fi
        else
            print_error "Failed to start Docker service"
            exit 1
        fi
    else
        print_error "systemctl not found. Please start Docker manually:"
        echo "  - On Ubuntu/Debian: sudo service docker start"
        echo "  - On macOS/Windows: Start Docker Desktop"
        exit 1
    fi
else
    print_success "Docker daemon is running"
fi

# Check Docker Compose
if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
    print_warning "Docker Compose not found"
    print_info "Installing Docker Compose..."
    
    # Try to install docker-compose-plugin
    if command -v apt >/dev/null 2>&1; then
        sudo apt update
        sudo apt install -y docker-compose-plugin
        print_success "Docker Compose plugin installed"
    else
        print_info "Please install Docker Compose manually:"
        echo "  pip install docker-compose"
        echo "  or download from: https://github.com/docker/compose/releases"
    fi
else
    print_success "Docker Compose is available"
fi

# Test Docker functionality
print_info "Testing Docker functionality..."
if docker run --rm hello-world >/dev/null 2>&1; then
    print_success "Docker test passed"
else
    print_error "Docker test failed"
    print_info "Try running: sudo docker run --rm hello-world"
    print_info "If that works, you need to add your user to the docker group"
fi

echo ""
print_success "🎉 Docker setup verification complete!"
echo ""
print_info "Next steps:"
echo "1. If you saw any group-related messages, log out and log back in"
echo "2. Run: ./setup-docker.sh to set up the application"
echo "3. Or run: ./run.sh for automatic setup"
echo ""
print_info "Common Docker commands:"
echo "  Check status:    sudo systemctl status docker"
echo "  Start service:   sudo systemctl start docker"
echo "  Stop service:    sudo systemctl stop docker"
echo "  Restart service: sudo systemctl restart docker"
