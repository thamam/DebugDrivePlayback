#!/usr/bin/env python3
"""
Basic flow tests for Debug Player Framework
Tests the most fundamental operations that should always work
"""

import requests
import json
import sys
from pathlib import Path

def test_backend_health():
    """Test that the Python backend is healthy."""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Python backend health check passed")
            return True
        else:
            print(f"❌ Python backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Python backend health check failed: {e}")
        return False

def test_plugin_list():
    """Test that plugins are available."""
    try:
        response = requests.get("http://localhost:8000/plugins", timeout=5)
        if response.status_code == 200:
            plugins = response.json()
            print(f"✅ Plugin list retrieved: {len(plugins)} plugins")
            for plugin in plugins:
                print(f"  - {plugin.get('name', 'Unknown')}: {plugin.get('is_loaded', 'Unknown status')}")
            return len(plugins) > 0
        else:
            print(f"❌ Plugin list failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Plugin list failed: {e}")
        return False

def test_data_loading():
    """Test loading trip data directly."""
    try:
        payload = {
            "file_path": "../data/trips/2025-07-15T12_06_02", 
            "plugin_type": "vehicle_data"
        }
        response = requests.post(
            "http://localhost:8000/load-data", 
            json=payload, 
            timeout=30
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.text[:500]}...")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Data loading succeeded")
            print(f"  - Plugin: {result.get('plugin_name', 'Unknown')}")
            print(f"  - Time range: {result.get('time_range', 'Unknown')}")
            print(f"  - Signals: {len(result.get('signals', {}))}")
            print(f"  - Data points: {result.get('data_points', 'Unknown')}")
            return True
        else:
            try:
                error_data = response.json()
                print(f"❌ Data loading failed: {error_data}")
            except:
                print(f"❌ Data loading failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Data loading failed: {e}")
        return False

def test_express_server():
    """Test that the Express server is running."""
    try:
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Express server health check passed")
            return True
        else:
            print(f"❌ Express server health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Express server health check failed: {e}")
        return False

def test_integrated_data_loading():
    """Test loading data through the Express API."""
    try:
        payload = {
            "filePath": "data/trips/2025-07-15T12_06_02", 
            "pluginType": "vehicle_data"
        }
        response = requests.post(
            "http://localhost:5000/api/python/load-data", 
            json=payload, 
            timeout=30
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.text[:500]}...")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Integrated data loading succeeded")
            print(f"  - Success: {result.get('success', 'Unknown')}")
            return result.get('success', False)
        else:
            try:
                error_data = response.json()
                print(f"❌ Integrated data loading failed: {error_data}")
            except:
                print(f"❌ Integrated data loading failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Integrated data loading failed: {e}")
        return False

def main():
    """Run all basic tests."""
    print("🔍 Running Basic Flow Tests for Debug Player Framework")
    print("=" * 60)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Plugin List", test_plugin_list),
        ("Direct Data Loading", test_data_loading),
        ("Express Server", test_express_server),
        ("Integrated Data Loading", test_integrated_data_loading),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name}...")
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("🎉 All basic flows are working!")
        return 0
    else:
        print("⚠️  Some basic flows are failing and need to be fixed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())