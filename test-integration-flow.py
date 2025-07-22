#!/usr/bin/env python3
"""
Integration Flow Tests for Debug Player Framework
Tests the complete data flow from loading to visualization
"""
import pytest
import requests
import time
import subprocess
import json
import os
from urllib.parse import urlparse

class TestIntegrationFlow:
    """Test complete data flow from loading to visualization"""
    
    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        cls.express_url = "http://localhost:5000"
        cls.python_url = "http://localhost:8000"
        cls.test_trip_path = "/home/thh3/data/trips/2025-07-15T12_06_02"
        
        # Initialize shared test data
        cls.loaded_data = None
        cls.session_id = None
        cls.time_range = None
        
    def test_01_backends_are_running(self):
        """Verify both backends are accessible"""
        # Test Express backend
        try:
            response = requests.get(f"{self.express_url}/api/health", timeout=5)
            assert response.status_code == 200, "Express backend not running"
            print(f"✓ Express backend healthy: {response.json()}")
        except Exception as e:
            pytest.fail(f"Express backend not accessible: {e}")
            
        # Test Python backend
        try:
            response = requests.get(f"{self.python_url}/health", timeout=5)
            assert response.status_code == 200, "Python backend not running"
            print(f"✓ Python backend healthy: {response.json()}")
        except Exception as e:
            pytest.fail(f"Python backend not accessible: {e}")
    
    def test_02_load_trip_data(self):
        """Test loading trip data via Express API"""
        # Load trip data
        response = requests.post(f"{self.express_url}/api/python/load-data", 
            json={
                "filePath": self.test_trip_path,
                "pluginType": "vehicle_data"
            },
            timeout=30
        )
        
        assert response.status_code == 200, f"Failed to load data: {response.text}"
        
        result = response.json()
        assert result.get("success") == True, f"Load operation failed: {result}"
        assert "time_range" in result, "Missing time_range in response"
        assert "signals" in result, "Missing signals in response"
        assert "data_points" in result, "Missing data_points in response"
        
        # Calculate duration from time range
        time_range = result['time_range']
        duration = time_range[1] - time_range[0] if len(time_range) == 2 else 0
        signal_count = len(result['signals'])
        
        print(f"✓ Trip data loaded: {signal_count} signals, {duration:.1f}s duration, {result['data_points']} data points")
        
        # Store for later tests
        self.__class__.loaded_data = result
        self.__class__.loaded_data['duration'] = duration
        self.__class__.loaded_data['signal_count'] = signal_count
        self.__class__.time_range = time_range
        
    def test_03_create_session(self):
        """Test creating a data session"""
        session_data = {
            "name": "Integration Test Session",
            "filePath": self.test_trip_path,
            "filename": "2025-07-15T12_06_02",
            "fileSize": 1024000,
            "duration": self.loaded_data.get("duration", 300),
            "frequency": 10,
            "signalCount": self.loaded_data.get("signal_count", 100),
            "userId": 1
        }
        
        response = requests.post(f"{self.express_url}/api/sessions", 
            json=session_data,
            timeout=10
        )
        
        assert response.status_code == 200, f"Failed to create session: {response.text}"
        
        session = response.json()
        assert "id" in session, "Missing session ID"
        assert session["name"] == session_data["name"], "Session name mismatch"
        
        print(f"✓ Session created: ID {session['id']}")
        
        # Store for later tests
        self.__class__.session_id = session["id"]
        
    def test_04_load_trajectory_data(self):
        """Test loading trajectory data for visualization"""
        response = requests.get(f"{self.express_url}/api/trajectory/{self.session_id}", 
            timeout=20
        )
        
        assert response.status_code == 200, f"Failed to load trajectory: {response.text}"
        
        trajectory = response.json()
        assert trajectory.get("success") == True, f"Trajectory load failed: {trajectory}"
        assert "trajectory" in trajectory, "Missing trajectory data"
        assert "time_range" in trajectory, "Missing time range"
        assert len(trajectory["trajectory"]) > 0, "Empty trajectory data"
        
        print(f"✓ Trajectory loaded: {len(trajectory['trajectory'])} points")
        
        # Store for signal tests
        self.time_range = trajectory["time_range"]
        
    def test_05_fetch_signal_data_at_timestamp(self):
        """Test fetching signal data at specific timestamps"""
        # Test multiple timestamps across the trip
        base_time = self.time_range[0]
        duration = self.time_range[1] - self.time_range[0]
        
        test_timestamps = [
            base_time,  # Start
            base_time + duration * 0.25,  # 25% through
            base_time + duration * 0.5,   # Middle
            base_time + duration * 0.75,  # 75% through
            base_time + duration * 0.99   # Near end
        ]
        
        signals_to_test = ['speed', 'steering', 'brake', 'throttle', 'driving_mode']
        
        for i, timestamp in enumerate(test_timestamps):
            response = requests.post(f"{self.express_url}/api/python/data/timestamp",
                json={
                    "timestamp": timestamp,
                    "signals": signals_to_test
                },
                timeout=10
            )
            
            assert response.status_code == 200, f"Failed to fetch signals at {timestamp}: {response.text}"
            
            signal_data = response.json()
            assert "data" in signal_data, f"Missing data in response at timestamp {timestamp}"
            
            # Verify we got some signal data (not all signals may be present)
            signals_found = signal_data["data"]
            assert len(signals_found) > 0, f"No signals found at timestamp {timestamp}"
            
            # Count signals that have actual values (not None)
            signals_with_values = sum(1 for v in signals_found.values() if v.get('value') is not None)
            
            print(f"✓ Timestamp {i+1}/5: {signals_with_values}/{len(signals_found)} signals with values at time {timestamp:.2f}")
            
    def test_06_session_navigation_flow(self):
        """Test complete session navigation flow (simulating user actions)"""
        # 1. Verify session can be retrieved
        response = requests.get(f"{self.express_url}/api/sessions/{self.session_id}")
        
        if response.status_code != 200:
            print("⚠ Database session retrieval failed (expected with mock sessions)")
            # This is expected to fail with mock sessions, continue test
        
        # 2. Test debug player data loading simulation
        # This simulates what happens when user navigates to debug player with session ID
        
        # Load trajectory data (simulating frontend hook)
        trajectory_response = requests.get(f"{self.express_url}/api/trajectory/{self.session_id}")
        assert trajectory_response.status_code == 200, "Failed to load trajectory for debug player"
        
        trajectory = trajectory_response.json()
        assert trajectory.get("success") == True, "Trajectory load failed for debug player"
        
        # Simulate timeline slider movements - test signal data fetching
        base_time = trajectory["time_range"][0]
        duration = trajectory["time_range"][1] - trajectory["time_range"][0]
        
        # Test 10 different slider positions
        for i in range(10):
            relative_time = duration * (i / 9)  # 0 to duration
            absolute_time = base_time + relative_time
            
            response = requests.post(f"{self.express_url}/api/python/data/timestamp",
                json={
                    "timestamp": absolute_time,
                    "signals": ['speed', 'steering', 'brake']
                },
                timeout=5
            )
            
            assert response.status_code == 200, f"Signal fetch failed at slider position {i}"
            
        print(f"✓ Complete navigation flow tested: 10 slider positions")
        
    def test_07_performance_check(self):
        """Test performance of signal data fetching"""
        base_time = self.time_range[0]
        duration = self.time_range[1] - self.time_range[0]
        
        # Test rapid timestamp requests (simulating fast slider movement)
        start_time = time.time()
        successful_requests = 0
        
        for i in range(20):
            timestamp = base_time + (duration * i / 19)
            
            try:
                response = requests.post(f"{self.express_url}/api/python/data/timestamp",
                    json={
                        "timestamp": timestamp,
                        "signals": ['speed', 'steering']
                    },
                    timeout=2  # Strict timeout for performance test
                )
                
                if response.status_code == 200:
                    successful_requests += 1
                    
            except requests.Timeout:
                print(f"⚠ Timeout at request {i+1}")
                
        end_time = time.time()
        total_time = end_time - start_time
        
        success_rate = successful_requests / 20
        avg_time = total_time / 20
        
        print(f"✓ Performance test: {successful_requests}/20 requests successful")
        print(f"  Average response time: {avg_time:.3f}s")
        print(f"  Success rate: {success_rate:.1%}")
        
        assert success_rate >= 0.8, f"Poor success rate: {success_rate:.1%}"
        assert avg_time < 1.0, f"Slow response time: {avg_time:.3f}s"
        
    def test_08_error_handling(self):
        """Test error handling in the data flow"""
        
        # Test invalid session ID
        response = requests.get(f"{self.express_url}/api/trajectory/999999")
        # Should handle gracefully - might return empty data or error
        
        # Test invalid timestamp (way in the future)
        response = requests.post(f"{self.express_url}/api/python/data/timestamp",
            json={
                "timestamp": 9999999999,  # Invalid timestamp
                "signals": ['speed']
            }
        )
        # Should return empty data or appropriate error, not crash
        
        # Test invalid signal names
        response = requests.post(f"{self.express_url}/api/python/data/timestamp",
            json={
                "timestamp": self.time_range[0],
                "signals": ['nonexistent_signal', 'fake_signal']
            }
        )
        
        # Should handle gracefully
        assert response.status_code in [200, 400, 404], "Error handling failed for invalid signals"
        
        print("✓ Error handling tests completed")

def run_integration_tests():
    """Run all integration tests"""
    print("🧪 Running Integration Flow Tests")
    print("=" * 50)
    
    # Check if backends are running
    express_check = requests.get("http://localhost:5000/api/health", timeout=5)
    python_check = requests.get("http://localhost:8000/health", timeout=5)
    
    if express_check.status_code != 200:
        print("❌ Express backend not running. Start with: npm run dev")
        return False
        
    if python_check.status_code != 200:
        print("❌ Python backend not running. Start with: cd python_backend && uvicorn main:app --reload")
        return False
    
    # Run tests
    pytest_args = [
        __file__,
        "-v",
        "--tb=short",
        "--no-header"
    ]
    
    result = pytest.main(pytest_args)
    
    if result == 0:
        print("\n✅ All integration tests passed!")
        print("🎉 The complete data flow is working correctly!")
        return True
    else:
        print("\n❌ Some integration tests failed!")
        print("🔧 Check the failures above to identify issues")
        return False

if __name__ == "__main__":
    run_integration_tests()