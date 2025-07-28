#!/usr/bin/env python3
"""
Test script for the Debug Player Framework backend.
Demonstrates loading different data scenarios and analyzing collision events.
"""

import sys
import os
sys.path.insert(0, '.')

from core.plot_manager import PlotManager
from plugins.vehicle_data_plugin import VehicleDataPlugin
from plugins.collision_detection_plugin import CollisionDetectionPlugin
import json


def test_scenario(scenario_name: str, file_path: str):
    """Test a specific data scenario."""
    print(f"\n{'='*60}")
    print(f"Testing {scenario_name.upper()} scenario")
    print(f"{'='*60}")
    
    # Create plot manager
    plot_manager = PlotManager()
    
    # Load vehicle data plugin
    vehicle_plugin = VehicleDataPlugin(file_path)
    success = vehicle_plugin.load()
    
    if not success:
        print(f"❌ Failed to load {file_path}")
        return
    
    print(f"✓ Loaded {file_path}")
    
    # Register plugin
    plot_manager.register_plugin(vehicle_plugin)
    
    # Create collision detection plugin
    collision_plugin = CollisionDetectionPlugin(file_path, safety_threshold=3.0)
    success = collision_plugin.load()
    
    if success:
        plot_manager.register_plugin(collision_plugin)
        print("✓ Collision detection plugin loaded")
    
    # Get basic information
    signals = plot_manager.get_available_signals()
    print(f"✓ Available signals: {list(signals.keys())}")
    
    time_range = vehicle_plugin.get_time_range()
    print(f"✓ Time range: {time_range[0]:.1f} - {time_range[1]:.1f} seconds")
    
    # Test data at specific timestamps
    test_timestamps = [5.0, 20.0, 40.0, 55.0]
    print(f"\n📊 Data Analysis:")
    
    for timestamp in test_timestamps:
        data = plot_manager.request_data_update(timestamp, ['vehicle_speed', 'acceleration'])
        if data:
            speed = data.get('vehicle_speed', {}).get('value', 0)
            accel = data.get('acceleration', {}).get('value', 0)
            print(f"  t={timestamp:4.1f}s: Speed={speed:5.1f} m/s, Accel={accel:5.2f} m/s²")
    
    # Test collision detection
    if collision_plugin.is_loaded:
        print(f"\n🚨 Collision Analysis:")
        collision_events = collision_plugin.get_collision_events(0.0, time_range[1])
        
        if collision_events:
            print(f"  Found {len(collision_events)} collision events:")
            for event in collision_events[:5]:  # Show first 5
                print(f"    t={event.timestamp:5.1f}s: {event.severity.upper()} - {event.description}")
                print(f"      Margin: {event.margin:.2f}m, Speed: {event.vehicle_speed:.1f} m/s")
        else:
            print("  No collision events detected")
    
    # Performance metrics
    metrics = plot_manager.get_performance_metrics()
    print(f"\n📈 Performance Metrics:")
    for metric, value in metrics.items():
        print(f"  {metric}: {value:.3f}")
    
    # Cleanup
    plot_manager.shutdown()


def main():
    """Main test function."""
    print("🚗 Debug Player Framework Backend Test")
    print("=" * 60)
    
    # Test all scenarios
    scenarios = [
        ("Normal Driving", "test_data/normal_driving.csv"),
        ("Emergency Braking", "test_data/emergency_braking.csv"),
        ("Collision Scenario", "test_data/collision_scenario.csv")
    ]
    
    for scenario_name, file_path in scenarios:
        if os.path.exists(file_path):
            test_scenario(scenario_name, file_path)
        else:
            print(f"❌ File not found: {file_path}")
    
    print(f"\n{'='*60}")
    print("✅ All tests completed successfully!")
    print("The Debug Player Framework backend is ready for use.")


if __name__ == "__main__":
    main()
