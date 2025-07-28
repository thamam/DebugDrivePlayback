#!/bin/bash

# Debug Player Framework - One-Command Launcher
# Automatically detects setup and runs the application

set -e

# Ensure we're in the correct directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

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

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to cleanup existing servers
cleanup_servers() {
    print_info "Cleaning up existing servers..."
    
    # Kill processes on port 5000 (Express server)
    if check_port 5000; then
        print_info "Stopping process on port 5000..."
        lsof -ti:5000 | xargs kill -15 2>/dev/null || true
        sleep 2
        lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill processes on port 8000 (Python backend)
    if check_port 8000; then
        print_info "Stopping process on port 8000..."
        lsof -ti:8000 | xargs kill -15 2>/dev/null || true
        sleep 2
        lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    fi
    
    # Also kill by process name
    pkill -f "tsx.*server/index.ts" 2>/dev/null || true
    pkill -f "python.*main.py" 2>/dev/null || true
    
    sleep 2
    print_success "Server cleanup completed"
}

# Function to handle port conflicts
handle_port_conflicts() {
    local conflicts=()
    
    if check_port 5000; then
        conflicts+=("5000 (Express server)")
    fi
    
    if check_port 8000; then
        conflicts+=("8000 (Python backend)")
    fi
    
    if [ ${#conflicts[@]} -gt 0 ]; then
        print_warning "Port conflicts detected:"
        for conflict in "${conflicts[@]}"; do
            echo -e "  ${YELLOW}• Port $conflict is already in use${NC}"
        done
        echo ""
        
        read -p "Would you like to (k)ill existing processes, use (a)lternative ports, or (e)xit? [k/a/e]: " choice
        case $choice in
            [Kk]* )
                cleanup_servers
                return 0
                ;;
            [Aa]* )
                print_info "Alternative ports not implemented yet. Please manually stop the conflicting processes."
                return 1
                ;;
            [Ee]* )
                print_info "Exiting..."
                exit 0
                ;;
            * )
                print_error "Invalid choice. Exiting..."
                exit 1
                ;;
        esac
    fi
    
    return 0
}

echo "🚀 Debug Player Framework - One-Command Launcher"
echo "================================================"

# Check for port conflicts before starting
handle_port_conflicts

# Check if already set up
if [[ -f ".env" && -d "venv" && -d "node_modules" ]]; then
    print_success "Setup detected, starting application..."
    echo ""
    print_info "🌐 Application will be available at:"
    echo -e "${GREEN}   → http://localhost:5000${NC}"
    echo -e "${BLUE}   → Click the link above to open the Debug Player Framework${NC}"
    echo ""
    
    # Start Python backend in background
    print_info "Starting Python backend..."
    if ! cd python_backend; then
        print_error "Could not find python_backend directory"
        exit 1
    fi
    
    python main.py &
    PYTHON_PID=$!
    cd ..
    
    # Wait a moment for Python backend to start
    print_info "Waiting for Python backend to initialize..."
    sleep 5
    
    # Check if Python backend started successfully
    if ! check_port 8000; then
        print_error "Python backend failed to start on port 8000"
        print_info "Check if Python dependencies are installed: cd python_backend && pip install -r requirements.txt"
        kill $PYTHON_PID 2>/dev/null || true
        exit 1
    fi
    print_success "Python backend started successfully"
    
    # Function to cleanup background processes on exit
    cleanup() {
        print_info "Shutting down services..."
        kill $PYTHON_PID 2>/dev/null || true
    }
    trap cleanup EXIT
    
    # Start the main application
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
    
    # Start Python backend in background
    print_info "Starting Python backend..."
    if ! cd python_backend; then
        print_error "Could not find python_backend directory"
        exit 1
    fi
    
    python main.py &
    PYTHON_PID=$!
    cd ..
    
    # Wait a moment for Python backend to start
    print_info "Waiting for Python backend to initialize..."
    sleep 5
    
    # Check if Python backend started successfully
    if ! check_port 8000; then
        print_error "Python backend failed to start on port 8000"
        print_info "Check if Python dependencies are installed: cd python_backend && pip install -r requirements.txt"
        kill $PYTHON_PID 2>/dev/null || true
        exit 1
    fi
    print_success "Python backend started successfully"
    
    # Function to cleanup background processes on exit
    cleanup() {
        print_info "Shutting down services..."
        kill $PYTHON_PID 2>/dev/null || true
    }
    trap cleanup EXIT
    
    # Start the main application
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
    
    # Start Python backend in background
    print_info "Starting Python backend..."
    if ! cd python_backend; then
        print_error "Could not find python_backend directory"
        exit 1
    fi
    
    python main.py &
    PYTHON_PID=$!
    cd ..
    
    # Wait a moment for Python backend to start
    print_info "Waiting for Python backend to initialize..."
    sleep 5
    
    # Check if Python backend started successfully
    if ! check_port 8000; then
        print_error "Python backend failed to start on port 8000"
        print_info "Check if Python dependencies are installed: cd python_backend && pip install -r requirements.txt"
        kill $PYTHON_PID 2>/dev/null || true
        exit 1
    fi
    print_success "Python backend started successfully"
    
    # Function to cleanup background processes on exit
    cleanup() {
        print_info "Shutting down services..."
        kill $PYTHON_PID 2>/dev/null || true
    }
    trap cleanup EXIT
    
    # Start the main application
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
