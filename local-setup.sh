#!/bin/bash

# Debug Player Framework - Streamlined Setup Script
# Installs only essential dependencies for local development

set -e

echo "🚀 Debug Player Framework - Streamlined Setup Script"
echo "====================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Node.js via nvm if not present
setup_nodejs() {
    print_header "Node.js Setup"
    
    # Check if nvm exists
    if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
        source "$HOME/.nvm/nvm.sh"
        print_success "nvm already installed"
    else
        print_info "Installing nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
        source "$HOME/.nvm/nvm.sh"
        print_success "nvm installed"
    fi
    
    # Install Node.js 22
    print_info "Installing Node.js 22..."
    nvm install 22
    nvm use 22
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_success "Node.js $NODE_VERSION installed"
    print_success "npm $NPM_VERSION installed"
    
    # Expected versions check
    if [[ "$NODE_VERSION" == v22.* ]]; then
        print_success "Node.js version is compatible"
    else
        print_warning "Expected Node.js v22.x, got $NODE_VERSION"
    fi
}

# Setup Python environment
setup_python() {
    print_header "Python Environment Setup"
    
    # Check Python 3.11
    if command_exists python3.11; then
        PYTHON_CMD="python3.11"
        print_success "Python 3.11 found"
    elif command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        if [[ "$PYTHON_VERSION" == 3.11.* ]] || [[ "$PYTHON_VERSION" == 3.12.* ]]; then
            PYTHON_CMD="python3"
            print_success "Compatible Python found: $PYTHON_VERSION"
        else
            print_warning "Python $PYTHON_VERSION found, but 3.11+ recommended"
            PYTHON_CMD="python3"
        fi
    else
        print_error "Python 3.11+ not found. Please install Python 3.11"
        echo "Ubuntu/Debian: sudo apt install python3.11 python3.11-venv"
        echo "macOS: brew install python@3.11"
        exit 1
    fi
    
    # Create virtual environment
    print_info "Creating Python virtual environment..."
    if [[ -d "venv" ]]; then
        print_warning "Virtual environment already exists, removing..."
        rm -rf venv
    fi
    
    $PYTHON_CMD -m venv venv
    source venv/bin/activate
    
    # Upgrade pip and install dependencies
    print_info "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r python_backend/requirements.txt
    
    print_success "Python environment setup complete"
}

# Setup database (Docker PostgreSQL)
setup_database() {
    print_header "Database Setup"
    
    if command_exists docker; then
        print_info "Using Docker for PostgreSQL (recommended)..."
        
        # Stop existing container if running
        docker stop debug-postgres 2>/dev/null || true
        docker rm debug-postgres 2>/dev/null || true
        
        # Start PostgreSQL container
        docker run --name debug-postgres \
            -e POSTGRES_PASSWORD=debug_pass \
            -e POSTGRES_USER=debug_user \
            -e POSTGRES_DB=debug_player \
            -p 5432:5432 \
            -d postgres:15
        
        print_success "PostgreSQL container started"
        
        # Wait for database to be ready
        print_info "Waiting for database to be ready..."
        sleep 5
        
    else
        print_warning "Docker not found. Please install PostgreSQL manually or install Docker"
        print_info "Manual PostgreSQL installation:"
        echo "Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
        echo "macOS: brew install postgresql"
        echo ""
        print_info "After installation, create database:"
        echo "sudo -u postgres createuser debug_user"
        echo "sudo -u postgres createdb debug_player"
        echo "sudo -u postgres psql -c \"ALTER USER debug_user WITH PASSWORD 'debug_pass';\""
        echo "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE debug_player TO debug_user;\""
    fi
    
    # Create .env file
    print_info "Creating environment configuration..."
    echo 'DATABASE_URL="postgresql://debug_user:debug_pass@localhost:5432/debug_player"' > .env
    print_success "Environment configuration created"
}

# Main setup function
main() {
    print_header "Debug Player Framework Setup"
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]]; then
        print_error "package.json not found. Please run this script from the project root directory."
        exit 1
    fi
    
    # Run setup steps
    setup_nodejs
    
    # Install Node.js dependencies
    print_header "Installing Node.js Dependencies"
    print_info "Installing packages with legacy peer deps..."
    npm install --legacy-peer-deps
    print_success "Node.js dependencies installed"
    
    setup_python
    setup_database
    
    # Install dotenv for environment variables
    print_info "Installing dotenv package..."
    npm install dotenv
    
    # Push database schema
    print_header "Database Schema Setup"
    print_info "Pushing database schema..."
    npm run db:push
    print_success "Database schema created"
    
    # Final instructions
    print_header "Setup Complete!"
    print_success "Debug Player Framework is ready for local development"
    echo ""
    print_info "To start the application:"
    echo "1. Terminal 1 - Python backend:"
    echo "   cd python_backend"
    echo "   source ../venv/bin/activate"
    echo "   python run_server.py"
    echo ""
    echo "2. Terminal 2 - Frontend:"
    echo "   npm run dev"
    echo ""
    echo "3. Open browser: http://localhost:5000"
    echo ""
    print_info "For Docker alternative: see DOCKER_SETUP.md"
    print_info "For troubleshooting: see LOCAL_SETUP.md"
}

# Run main function
main "$@"
    fi
    
    # Check pip
    if command_exists pip3; then
        PIP_VERSION=$(pip3 --version)
        print_success "pip found: $PIP_VERSION"
    else
        print_error "pip3 not found. Please install pip3"
        exit 1
    fi
}

# Install Node.js dependencies
install_node_deps() {
    print_info "Installing Node.js dependencies..."
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Node.js dependencies installed"
    else
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
}

# Set up Python environment
setup_python_env() {
    print_info "Setting up Python environment..."
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Python virtual environment created"
    else
        print_warning "Virtual environment already exists"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install Python dependencies
    if [ -f "python_backend/requirements.txt" ]; then
        pip install -r python_backend/requirements.txt
        print_success "Python dependencies installed"
    else
        print_error "python_backend/requirements.txt not found"
        exit 1
    fi
}

# Create environment file
create_env_file() {
    print_info "Creating environment configuration..."
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://debug_user:debug_password@localhost:5432/debug_player_framework

# Application Configuration
NODE_ENV=development
PORT=5000
PYTHON_BACKEND_PORT=8000

# Python Backend Configuration
PYTHON_BACKEND_HOST=localhost
PYTHON_BACKEND_URL=http://localhost:8000
EOF
        print_success "Environment file created (.env)"
    else
        print_warning "Environment file already exists"
    fi
}

# Create database setup script
create_db_setup() {
    print_info "Creating database setup script..."
    
    cat > setup_database.sql << EOF
-- Create database and user for Debug Player Framework
CREATE DATABASE debug_player_framework;
CREATE USER debug_user WITH PASSWORD 'debug_password';
GRANT ALL PRIVILEGES ON DATABASE debug_player_framework TO debug_user;
EOF
    
    print_success "Database setup script created (setup_database.sql)"
    print_warning "Run the following command to set up the database:"
    print_warning "sudo -u postgres psql -f setup_database.sql"
}

# Verify data files
verify_data_files() {
    print_info "Checking for real trip data..."
    
    DATA_DIR="data/trips/2025-07-15T12_06_02"
    
    if [ -d "$DATA_DIR" ]; then
        FILE_COUNT=$(ls -1 "$DATA_DIR"/*.csv 2>/dev/null | wc -l)
        print_success "Found $FILE_COUNT CSV files in $DATA_DIR"
        
        # Check for required files
        required_files=("vehicle_speed.csv" "gps_latitude.csv" "gps_longitude.csv" "steering_wheel_angle.csv")
        for file in "${required_files[@]}"; do
            if [ -f "$DATA_DIR/$file" ]; then
                print_success "Found required file: $file"
            else
                print_warning "Missing required file: $file"
            fi
        done
    else
        print_warning "Real trip data not found in $DATA_DIR"
        print_info "You can add your own trip data or use the demo data"
    fi
}

# Create start scripts
create_start_scripts() {
    print_info "Creating start scripts..."
    
    # Python backend start script
    cat > start_python_backend.sh << 'EOF'
#!/bin/bash
echo "Starting Python backend..."
source venv/bin/activate
cd python_backend
python run_server.py
EOF
    
    # Frontend start script
    cat > start_frontend.sh << 'EOF'
#!/bin/bash
echo "Starting frontend and Express backend..."
npm run dev
EOF
    
    # Make scripts executable
    chmod +x start_python_backend.sh
    chmod +x start_frontend.sh
    
    print_success "Start scripts created"
}

# Create development script
create_dev_script() {
    print_info "Creating development script..."
    
    cat > dev.sh << 'EOF'
#!/bin/bash

# Debug Player Framework - Development Script
# This script starts both backends in separate terminals

echo "🚀 Starting Debug Player Framework in development mode..."

# Check if tmux is available
if command -v tmux >/dev/null 2>&1; then
    echo "Using tmux for session management..."
    
    # Create new tmux session
    tmux new-session -d -s debug-player
    
    # Split window horizontally
    tmux split-window -h
    
    # Start Python backend in left pane
    tmux send-keys -t debug-player:0.0 'source venv/bin/activate && cd python_backend && python run_server.py' C-m
    
    # Start frontend in right pane
    tmux send-keys -t debug-player:0.1 'npm run dev' C-m
    
    # Attach to session
    tmux attach-session -t debug-player
    
elif command -v screen >/dev/null 2>&1; then
    echo "Using screen for session management..."
    
    # Start Python backend in background
    screen -dmS python-backend bash -c 'source venv/bin/activate && cd python_backend && python run_server.py'
    
    # Start frontend in foreground
    echo "Python backend started in background. Starting frontend..."
    npm run dev
    
else
    echo "Neither tmux nor screen found. Please install one of them for better development experience."
    echo "Or run the following commands in separate terminals:"
    echo "1. ./start_python_backend.sh"
    echo "2. ./start_frontend.sh"
fi
EOF
    
    chmod +x dev.sh
    print_success "Development script created (dev.sh)"
}

# Main setup function
main() {
    echo "Starting automated setup..."
    
    # Check prerequisites
    check_prerequisites
    
    # Install dependencies
    install_node_deps
    setup_python_env
    
    # Create configuration files
    create_env_file
    create_db_setup
    
    # Verify data
    verify_data_files
    
    # Create helper scripts
    create_start_scripts
    create_dev_script
    
    echo ""
    echo "================================================="
    print_success "Setup completed successfully!"
    echo "================================================="
    echo ""
    echo "Next steps:"
    echo "1. Set up the database:"
    echo "   sudo -u postgres psql -f setup_database.sql"
    echo ""
    echo "2. Push database schema:"
    echo "   npm run db:push"
    echo ""
    echo "3. Start the application:"
    echo "   ./dev.sh"
    echo ""
    echo "4. Open your browser to:"
    echo "   http://localhost:5000"
    echo ""
    echo "For detailed instructions, see LOCAL_SETUP.md"
}

# Run main function
main "$@"