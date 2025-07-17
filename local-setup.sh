#!/bin/bash

# Debug Player Framework - Local Setup Script
# This script automates the setup process for local development

set -e

echo "🚀 Debug Player Framework - Local Setup Script"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    echo -e "ℹ $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
    else
        print_error "Node.js not found. Please install Node.js v18 or v20"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm found: $NPM_VERSION"
    else
        print_error "npm not found. Please install npm"
        exit 1
    fi
    
    # Check Python
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python found: $PYTHON_VERSION"
    else
        print_error "Python3 not found. Please install Python 3.8+"
        exit 1
    fi
    
    # Check PostgreSQL
    if command_exists psql; then
        POSTGRES_VERSION=$(psql --version)
        print_success "PostgreSQL found: $POSTGRES_VERSION"
    else
        print_warning "PostgreSQL not found. You'll need to install it manually or use Docker"
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