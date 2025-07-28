#!/usr/bin/env python3
"""
Dedicated server runner for the Python backend.
This ensures the FastAPI server starts properly and handles dependencies.
"""

import sys
import os
import uvicorn
import logging

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main server entry point."""
    try:
        logger.info("Starting Debug Player Framework Python Backend")
        
        # Import the app after setting up the path
        from main import app
        
        # Run the server
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            log_level="info",
            reload=False,  # Disable reload for stability
            access_log=True
        )
        
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
