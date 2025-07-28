#!/bin/bash

# PostgreSQL-Only Docker Setup
# Avoids all Docker build issues by using only pre-built PostgreSQL image

echo "🚀 Starting PostgreSQL-Only Docker Setup"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Stop any existing containers
print_info "Cleaning up existing containers..."
docker stop debug-postgres 2>/dev/null || true
docker rm debug-postgres 2>/dev/null || true

# Start PostgreSQL container
print_info "Starting PostgreSQL container..."
docker run --name debug-postgres \
  -e POSTGRES_PASSWORD=debug_pass \
  -e POSTGRES_USER=debug_user \
  -e POSTGRES_DB=debug_player \
  -p 5432:5432 \
  -d postgres:15

# Wait for database to be ready
print_info "Waiting for database to be ready..."
sleep 5

# Test database connection
print_info "Testing database connection..."
if docker exec debug-postgres pg_isready -U debug_user -d debug_player > /dev/null 2>&1; then
    print_success "PostgreSQL is ready"
else
    echo "Waiting a bit more for database..."
    sleep 5
fi

# Create .env file
print_info "Creating environment configuration..."
echo 'DATABASE_URL="postgresql://debug_user:debug_pass@localhost:5432/debug_player"' > .env
print_success "Environment configuration created"

echo ""
print_success "PostgreSQL setup complete!"
echo ""
print_info "Next steps:"
echo "1. Run: npm install --legacy-peer-deps"
echo "2. Run: python3 -m venv venv && source venv/bin/activate"
echo "3. Run: pip install -r python_backend/requirements.txt"
echo "4. Run: npm run db:push"
echo "5. Run: npm run dev"
echo ""
print_info "Or use the automated setup script: ./local-setup.sh"
