#!/bin/bash

# Cleanup script for removing Python virtual environment and temporary files
# These files should not be in version control

echo "Debug Drive Playback - Cleanup Script"
echo "====================================="
echo "This script will remove the following:"
echo "- Python virtual environment (venv/)"
echo "- Python cache files (__pycache__/)"
echo "- Compiled Python files (*.pyc, *.pyo, *.pyd)"
echo "- Python build artifacts"
echo ""

read -p "Do you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 1
fi

echo "Starting cleanup..."

# Remove Python virtual environment
if [ -d "venv/" ]; then
    echo "Removing Python virtual environment..."
    rm -rf venv/
    echo "✓ Removed venv/"
else
    echo "✓ venv/ not found (already clean)"
fi

# Remove Python cache directories
echo "Removing Python cache files..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
echo "✓ Removed __pycache__ directories"

# Remove compiled Python files
echo "Removing compiled Python files..."
find . -name "*.pyc" -delete 2>/dev/null || true
find . -name "*.pyo" -delete 2>/dev/null || true
find . -name "*.pyd" -delete 2>/dev/null || true
echo "✓ Removed compiled Python files"

# Remove Python build artifacts
if [ -d "build/" ]; then
    rm -rf build/
    echo "✓ Removed build/"
fi

if [ -d "dist/" ]; then
    echo "✓ dist/ exists but may contain application build (keeping)"
fi

if [ -d "*.egg-info/" ]; then
    rm -rf *.egg-info/
    echo "✓ Removed egg-info directories"
fi

# Remove pip temporary files
find . -name "pip-log.txt" -delete 2>/dev/null || true
find . -name "pip-delete-this-directory.txt" -delete 2>/dev/null || true

# Remove other temporary files
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "Thumbs.db" -delete 2>/dev/null || true

echo ""
echo "Cleanup completed successfully!"
echo ""
echo "The following files/directories have been removed:"
echo "- venv/ (Python virtual environment)"
echo "- __pycache__/ directories"
echo "- *.pyc, *.pyo, *.pyd files"
echo "- pip temporary files"
echo "- OS temporary files (.DS_Store, Thumbs.db)"
echo ""
echo "Note: These items are now properly listed in .gitignore"
echo "to prevent them from being tracked in the future."
