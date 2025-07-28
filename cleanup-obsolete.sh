#!/bin/bash

# Debug Player Framework - Cleanup Obsolete Files
# Removes outdated and duplicate files while preserving important ones

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

echo "🧹 Debug Player Framework - Cleanup Obsolete Files"
echo "=================================================="

# Create backup directory
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
print_info "Created backup directory: $BACKUP_DIR"

# Function to safely remove files
safe_remove() {
    local file="$1"
    if [ -f "$file" ] || [ -d "$file" ]; then
        print_info "Moving $file to backup..."
        mv "$file" "$BACKUP_DIR/"
        print_success "Moved $file"
    fi
}

# Obsolete documentation files (now in docs/)
print_info "Cleaning up obsolete documentation files..."

# Keep these important files in root:
# - README.md (main entry point)
# - QUICK_START.md (essential quick reference)
# - CLAUDE.md (AI assistant guidance)
# - TESTING_INSTRUCTIONS.md (current testing guide)

# Move outdated Dockerfile variations
print_info "Cleaning up Docker files..."
safe_remove "Dockerfile.dev"
safe_remove "Dockerfile.python"

# Remove old/duplicate component versions
print_info "Cleaning up duplicate component files..."
safe_remove "client/src/components/data-loader-v2.tsx"
safe_remove "client/src/components/trajectory-visualizer-v2.tsx"
safe_remove "client/src/components/advanced-widget-manager.tsx"
safe_remove "client/src/components/dashboard-layout.tsx"
safe_remove "client/src/components/data-error-boundary.tsx"
safe_remove "client/src/components/enhanced-navigation.tsx"
safe_remove "client/src/components/onboarding-flow.tsx"
safe_remove "client/src/components/widget-error-boundary.tsx"

# Remove duplicate hooks
safe_remove "client/src/hooks/use-debug-player-v2.ts"
safe_remove "client/src/hooks/use-data-service.ts"

# Remove duplicate library files
safe_remove "client/src/lib/advanced-widget-templates.ts"
safe_remove "client/src/lib/widget-engine-v2.ts"
safe_remove "client/src/lib/widget-engine-v3.ts"
safe_remove "client/src/lib/widget-collaboration.ts"
safe_remove "client/src/lib/widget-marketplace.ts"
safe_remove "client/src/lib/safe-expression-evaluator.ts"

# Remove duplicate server files
safe_remove "server/api-routes-v2.ts"
safe_remove "server/data-adapter.ts"
safe_remove "server/python-backend-v2.ts"
safe_remove "server/widget-routes.ts"
safe_remove "server/widget-service.ts"

# Remove old Docker compose variations (keep only main ones)
safe_remove "docker-compose-prod.yml"

# Remove old test files
safe_remove "test-demo.js"
safe_remove "test-runner-replit.js"

# Remove old shell scripts that are no longer needed
safe_remove "fix-dependencies.sh"

# Remove replit-specific file if not needed
if [ -f "replit.md" ]; then
    print_warning "Found replit.md - review if still needed, moving to backup"
    safe_remove "replit.md"
fi

# Remove init-db.sql if database setup is handled elsewhere
if [ -f "init-db.sql" ]; then
    print_info "Moving init-db.sql to backup (check if still needed)"
    safe_remove "init-db.sql"
fi

# Clean up any empty directories
print_info "Removing empty directories..."
find . -type d -empty -not -path "./node_modules/*" -not -path "./venv/*" -not -path "./.git/*" -delete 2>/dev/null || true

# Clean up Storybook static build (can be regenerated)
if [ -d "storybook-static" ]; then
    print_info "Cleaning up Storybook static build (can be regenerated)..."
    safe_remove "storybook-static"
fi

print_success "Cleanup completed!"
echo ""
print_info "Summary of actions:"
echo "- Moved obsolete files to: $BACKUP_DIR"
echo "- Kept essential documentation in root"
echo "- Cleaned up duplicate component versions"
echo "- Removed old build artifacts"
echo ""
print_warning "Review the backup directory and delete it if you don't need the files:"
echo "  rm -rf $BACKUP_DIR"
echo ""
print_info "Files remaining in root:"
ls -la *.md *.sh *.yml *.json *.ts *.js 2>/dev/null || echo "No additional files in root"
