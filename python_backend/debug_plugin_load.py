#!/usr/bin/env python3

import sys
import logging
from pathlib import Path

# Add the current directory to the path so we can import the plugins
sys.path.insert(0, str(Path(__file__).parent))

from plugins.trip_data_plugin import TripDataPlugin

# Set up logging to see detailed error messages
logging.basicConfig(level=logging.DEBUG)

def test_plugin_load():
    """Test loading the TripDataPlugin directly."""
    try:
        # Test the path from the python_backend directory
        trip_path = "../data/trips/2025-07-15T12_06_02"
        plugin = TripDataPlugin(trip_path)
        
        print(f"Created plugin with path: {plugin.file_path}")
        print(f"Path exists: {plugin.file_path.exists()}")
        print(f"Path is directory: {plugin.file_path.is_dir()}")
        
        if plugin.file_path.exists():
            csv_files = list(plugin.file_path.glob("*.csv"))
            print(f"Found {len(csv_files)} CSV files")
            for csv_file in csv_files[:5]:  # Show first 5
                print(f"  - {csv_file.name}")
        
        print("\nAttempting to load plugin...")
        success = plugin.load()
        
        if success:
            print("✅ Plugin loaded successfully!")
            signals = plugin.get_signals()
            print(f"Found {len(signals)} signals:")
            for signal_name in list(signals.keys())[:10]:  # Show first 10
                print(f"  - {signal_name}")
        else:
            print("❌ Plugin failed to load")
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_plugin_load()