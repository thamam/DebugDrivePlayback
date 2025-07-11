#!/usr/bin/env python3
"""
Start script for the Debug Player Framework Python backend.
This script starts the FastAPI server with proper configuration.
"""

import uvicorn
import sys
import os

# Add the python_backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python_backend'))

if __name__ == "__main__":
    print("🚗 Starting Debug Player Framework Backend")
    print("=" * 50)
    
    # Configure uvicorn server
    uvicorn.run(
        "python_backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["python_backend"],
        log_level="info"
    )