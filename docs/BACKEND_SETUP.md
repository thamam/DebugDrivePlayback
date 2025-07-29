# Debug Player Framework - Backend Setup Guide

## Overview

The Debug Player Framework now includes a complete Python backend implementation with FastAPI, providing robust data processing and analysis capabilities for vehicle debugging and collision detection.

## System Architecture

### Frontend (React/TypeScript)
- **Port**: 5000 (via Express.js)
- **Features**: Interactive charts, timeline control, multi-tab interface
- **Status**: ✅ Complete and functional

### Backend (Python/FastAPI)
- **Port**: 8000 (FastAPI server)
- **Features**: Plugin-based data processing, collision detection, performance monitoring
- **Status**: ✅ Complete and tested

## Quick Start

### 1. Start the Frontend (automatically running)
The frontend is already running via the "Start application" workflow on port 5000.

### 2. Start the Python Backend
```bash
# Option 1: Using the start script
python start_backend.py

# Option 2: Direct uvicorn command
cd python_backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Generate Test Data
```bash
cd python_backend && python -m utils.data_generator
```

### 4. Run Backend Tests
```bash
cd python_backend && python test_backend.py
```

## Backend Components

### Core Modules
- **`core/plot_manager.py`**: Central coordinator for plugin registration and data flow
- **`core/cache_handler.py`**: High-performance caching system with configurable memory limits
- **`core/signal_validation.py`**: Comprehensive validation system for data integrity
- **`core/performance_monitor.py`**: Real-time performance tracking and metrics
- **`core/interfaces.py`**: Type definitions and interface contracts

### Plugin System
- **`plugins/base_plugin.py`**: Abstract base class for all data processing plugins
- **`plugins/vehicle_data_plugin.py`**: Handles vehicle telemetry data (speed, acceleration, position, steering)
- **`plugins/collision_detection_plugin.py`**: Real-time collision detection and safety margin analysis

### Utilities
- **`utils/data_generator.py`**: Realistic vehicle trajectory simulation with multiple scenarios
- **`test_backend.py`**: Comprehensive test suite validating all scenarios
- **`main.py`**: FastAPI application with REST API endpoints

## API Endpoints

### Health & Status
- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint
- `GET /system/status` - Overall system status

### Data Management
- `POST /data/load` - Load data from file path
- `POST /data/upload` - Upload and process data file
- `GET /data/timestamp` - Get data for specific timestamp
- `GET /data/range` - Get data for time range

### Plugin Management
- `GET /plugins` - List all loaded plugins
- `DELETE /plugins/{plugin_name}` - Unload specific plugin
- `GET /signals` - Get all available signals

### Analysis
- `GET /analysis/collision-events` - Get collision events in time range
- `GET /performance/metrics` - Get performance metrics
- `DELETE /cache/clear` - Clear all cached data

## Test Data Scenarios

The system includes three realistic test scenarios:

### 1. Normal Driving (`normal_driving.csv`)
- **Duration**: 60 seconds
- **Profile**: Gradual acceleration → cruise → gentle deceleration
- **Collision Events**: Moderate warnings during acceleration/deceleration
- **Use Case**: Baseline testing and normal operations

### 2. Emergency Braking (`emergency_braking.csv`)
- **Duration**: 60 seconds
- **Profile**: Cruise → sudden emergency braking
- **Collision Events**: Critical collision risks during emergency braking
- **Use Case**: Emergency scenario testing

### 3. Collision Scenario (`collision_scenario.csv`)
- **Duration**: 60 seconds
- **Profile**: High-speed driving → late braking → erratic steering
- **Collision Events**: Continuous critical collision risks
- **Use Case**: High-risk scenario analysis

## Performance Metrics

The backend tracks comprehensive performance metrics:

- **Plugin Registration**: Average, min, max, and latest registration times
- **Data Updates**: Query performance and response times
- **Cache Performance**: Hit rates and memory usage
- **System Uptime**: Total uptime and active timers
- **Memory Usage**: Current memory consumption and limits

## Key Features

### 🚀 High Performance
- Optimized data loading and caching
- Efficient plugin-based architecture
- Real-time performance monitoring

### 🔧 Extensible Design
- Plugin-based architecture for easy extension
- Clean interfaces for new data sources
- Modular component design

### 🛡️ Robust Data Processing
- Comprehensive data validation
- Error handling and recovery
- Multiple data format support (CSV, Parquet)

### 📊 Advanced Analytics
- Real-time collision detection
- Safety margin analysis
- Performance optimization

## Development Notes

### Import Structure
The backend uses absolute imports for better module organization:
```python
from core.interfaces import IPlugin, SignalInfo
from plugins.base_plugin import BasePlugin
from utils.data_generator import VehicleDataGenerator
```

### Configuration
- **Cache Size**: 512MB default (configurable)
- **Safety Threshold**: 3.0m default (configurable)
- **Sampling Rate**: 10Hz for test data
- **Data Formats**: CSV, Parquet support

### Testing
All components are thoroughly tested with:
- Unit tests for individual modules
- Integration tests for plugin system
- Scenario-based testing for real-world conditions
- Performance benchmarking

## Next Steps

The backend is now complete and ready for integration with the frontend. The system provides:

1. **Real Data Processing**: Authentic vehicle trajectory analysis
2. **Collision Detection**: Advanced safety monitoring
3. **Performance Optimization**: Efficient data handling
4. **Extensible Architecture**: Easy addition of new plugins
5. **Comprehensive Testing**: Validated with multiple scenarios

The frontend can now connect to the Python backend on port 8000 to access real vehicle data processing capabilities.
