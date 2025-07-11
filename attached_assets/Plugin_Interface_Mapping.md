# Plugin Interface Mapping Document
## Debug Player Framework - Implemented Plugins

**Document Version:** 1.0  
**Date:** December 2024  
**Author:** System Analysis Team  
**Status:** Final  

---

## Table of Contents

1. [Introduction](#introduction)
2. [Plugin Architecture Overview](#plugin-architecture-overview)
3. [Base Plugin Interface](#base-plugin-interface)
4. [Implemented Plugins](#implemented-plugins)
5. [Data Column Specifications](#data-column-specifications)
6. [Signal Type Definitions](#signal-type-definitions)
7. [Data Format Standards](#data-format-standards)
8. [Integration Patterns](#integration-patterns)
9. [Appendices](#appendices)

---

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive mapping of all implemented plugins in the Debug Player Framework, with detailed emphasis on their interface specifications and data column structures. It serves as the authoritative reference for understanding how plugins expose data and interact with the system.

### 1.2 Scope
This document covers:
- Complete interface specifications for all implemented plugins
- Detailed data column mappings and structures
- Signal definitions and data formats
- Integration patterns and usage examples
- Data validation and type requirements

### 1.3 Audience
- Plugin Developers
- System Integrators
- Data Engineers
- Quality Assurance Teams
- Technical Documentation Teams

---

## 2. Plugin Architecture Overview

### 2.1 Plugin System Architecture
The Debug Player uses a plugin-based architecture where each plugin:
- Inherits from `PluginBase` abstract class
- Implements standardized interface methods
- Exposes data through signals dictionary
- Handles file-based or streaming data sources

### 2.2 Plugin Loading Pattern
```python
# Standard plugin loading pattern
def __init__(self, file_path):
    super().__init__(file_path)
    # Initialize data sources
    # Define signals dictionary
    self.signals = {
        "signal_name": {
            "func": self.handler_function,
            "type": "temporal|spatial|categorical|boolean",
            "description": "Signal description"
        }
    }

# Export plugin class (REQUIRED)
plugin_class = PluginClassName
```

---

## 3. Base Plugin Interface

### 3.1 PluginBase Abstract Class
```python
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class PluginBase(ABC):
    @abstractmethod
    def __init__(self, file_path: str) -> None:
        """Initialize plugin with file path"""
        
    @abstractmethod
    def has_signal(self, signal: str) -> bool:
        """Check if plugin provides the signal"""
        
    @abstractmethod
    def get_data_for_timestamp(self, signal: str, timestamp: float) -> Optional[Dict[str, Any]]:
        """Get data for specific signal and timestamp"""
```

### 3.2 Required Interface Methods
| Method | Purpose | Parameters | Return Type |
|--------|---------|------------|-------------|
| `__init__` | Initialize plugin | `file_path: str` | None |
| `has_signal` | Check signal availability | `signal: str` | bool |
| `get_data_for_timestamp` | Get timestamped data | `signal: str, timestamp: float` | Optional[Dict] |

### 3.3 Optional Streaming Interface Methods
| Method | Purpose | Default | Override Required |
|--------|---------|---------|------------------|
| `supports_streaming` | Check streaming capability | False | For streaming plugins |
| `configure_streaming` | Configure streaming | False | For streaming plugins |
| `start_streaming` | Start data stream | False | For streaming plugins |
| `stop_streaming` | Stop data stream | False | For streaming plugins |

---

## 4. Implemented Plugins

### 4.1 CarPosePlugin

#### 4.1.1 Plugin Overview
- **File**: `CarPosePlugin.py`
- **Purpose**: Provides vehicle position and orientation data
- **Data Source**: Car pose CSV files
- **Dependencies**: `CarPose` data class

#### 4.1.2 Interface Specification
```python
class CarPosePlugin(PluginBase):
    def __init__(self, file_path):
        super().__init__(file_path)
        self.car_pose = CarPose(file_path)
        self.signals = {
            "car_pose(t)": {"func": self.handle_car_pose_at_timestamp, "type": "spatial"},
            "route": {"func": self.route_handler, "type": "spatial"},
            "timestamps": {"func": lambda: self.timestamps, "type": "temporal"},
            "car_poses": {"func": lambda: self.car_poses, "type": "spatial"}
        }
```

#### 4.1.3 Data Column Specifications
**Input Data Columns (car_pose.csv):**
| Column Name | Data Type | Units | Description |
|-------------|-----------|-------|-------------|
| `timestamp` | float64 | seconds | Unix timestamp |
| `cp_x` | float64 | meters | Vehicle X coordinate |
| `cp_y` | float64 | meters | Vehicle Y coordinate |
| `cp_yaw_deg` | float64 | degrees | Vehicle heading angle |

**Internal Data Structures:**
```python
# self.car_poses structure
{
    "x": List[float],      # X coordinates from route['cp_x']
    "y": List[float],      # Y coordinates from route['cp_y']  
    "theta": List[float]   # Heading angles from df_car_pose['cp_yaw_deg']
}

# self.timestamps structure
List[float]  # Timestamps in milliseconds
```

#### 4.1.4 Signal Output Formats
**Signal: "car_pose(t)"**
```python
{
    "x": float,      # Vehicle X position at timestamp
    "y": float,      # Vehicle Y position at timestamp
    "theta": float   # Vehicle heading at timestamp
}
```

**Signal: "route"**
```python
{
    "x": List[float],  # Complete route X coordinates
    "y": List[float]   # Complete route Y coordinates
}
```

**Signal: "timestamps"**
```python
List[float]  # All available timestamps in milliseconds
```

**Signal: "car_poses"**
```python
{
    "x": List[float],      # All X coordinates
    "y": List[float],      # All Y coordinates
    "theta": List[float]   # All heading angles
}
```

---

### 4.2 PathViewPlugin

#### 4.2.1 Plugin Overview
- **File**: `path_view_plugin.py`
- **Purpose**: Provides path trajectory data and collision margin detection
- **Data Source**: Path trajectory CSV files
- **Dependencies**: `PathTrajectoryPandas`, `PathTrajectoryPolars`

#### 4.2.2 Interface Specification
```python
class PathViewPlugin(PluginBase):
    def __init__(self, file_path, path_type='path_trajectory.csv', 
                 path_loader_type='polars', vehicle_config=None, 
                 collision_margin_threshold=None):
        super().__init__(file_path)
        self.signals = {
            "path_in_world_coordinates(t)": {"func": self.get_path_world_at_timestamp, "type": "spatial"},
            "car_pose_at_path_timestamp(t)": {"func": self.get_car_pose_at_timestamp, "type": "spatial"},
            "timestamps": {"func": lambda: self.path_trajectory.get_timestamps_ms(), "type": "temporal"},
            "collision_margin_distance(t)": {"func": self.get_collision_margin_distance_at_timestamp, "type": "temporal"},
            "collision_margin_violations(t)": {"func": self.get_collision_margin_violations_at_timestamp, "type": "spatial"}
        }
```

#### 4.2.3 Data Column Specifications
**Input Data Columns (path_trajectory.csv):**
| Column Name | Data Type | Units | Description |
|-------------|-----------|-------|-------------|
| `timestamp` | float64 | seconds | Unix timestamp |
| `path_x` | float64 | meters | Path point X coordinate |
| `path_y` | float64 | meters | Path point Y coordinate |
| `path_heading` | float64 | degrees | Path heading angle |
| `vehicle_x` | float64 | meters | Vehicle X position |
| `vehicle_y` | float64 | meters | Vehicle Y position |
| `vehicle_heading` | float64 | degrees | Vehicle heading |

**Configuration Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `collision_margin_threshold` | float | 2.0 | Safety threshold in meters |
| `path_loader_type` | str | 'polars' | Data loader type |
| `vehicle_config` | object | niro_ev2 | Vehicle dimension configuration |

#### 4.2.4 Signal Output Formats
**Signal: "path_in_world_coordinates(t)"**
```python
{
    "x": List[float],      # Path X coordinates in world frame
    "y": List[float],      # Path Y coordinates in world frame
    "heading": List[float] # Path heading angles
}
```

**Signal: "car_pose_at_path_timestamp(t)"**
```python
{
    "x": float,      # Vehicle X position
    "y": float,      # Vehicle Y position
    "theta": float   # Vehicle heading
}
```

**Signal: "collision_margin_distance(t)"**
```python
{
    "value": float,              # Distance to collision margin
    "threshold": float,          # Safety threshold
    "is_violation": bool,        # Whether threshold is violated
    "margin_type": str          # Type of margin calculation
}
```

**Signal: "collision_margin_violations(t)"**
```python
{
    "x": List[float],      # X coordinates of violations
    "y": List[float],      # Y coordinates of violations
    "severities": List[float], # Violation severity levels
    "count": int           # Number of violations
}
```

---

### 4.3 CarStatePlugin

#### 4.3.1 Plugin Overview
- **File**: `car_state_plugin.py`
- **Purpose**: Provides vehicle state information (speed, steering, driving mode)
- **Data Source**: Multiple vehicle state CSV files
- **Dependencies**: `CarStateInfo` data class

#### 4.3.2 Interface Specification
```python
class CarStatePlugin(PluginBase):
    def __init__(self, file_path):
        super().__init__(file_path)
        self.CarStateInfo = CarStateInfo(file_path)
        self.signals = {
            "current_steering": {"func": partial(self.CarStateInfo.get_current_steering_angle), "type": "temporal", "mode": "dynamic"},
            "current_speed": {"func": partial(self.CarStateInfo.get_current_speed_at_timestamp), "type": "temporal", "mode": "dynamic"},
            "driving_mode": {"func": partial(self.CarStateInfo.get_driving_mode_at_timestamp), "type": "temporal", "mode": "dynamic"},
            "target_speed": {"func": partial(self.CarStateInfo.get_target_speed_at_timestamp), "type": "temporal", "mode": "dynamic"},
            "target_steering_angle": {"func": partial(self.CarStateInfo.get_target_steering_angle_at_timestamp), "type": "temporal", "mode": "dynamic"},
            "all_steering_data": {"func": self.handler_get_all_current_steering_angle_data, "type": "temporal", "mode": "static"},
            "all_current_speed_data": {"func": self.handler_get_all_current_speed_data, "type": "temporal", "mode": "static"},
            "all_driving_mode_data": {"func": self.handler_get_all_driving_mode_data, "type": "temporal", "mode": "static"},
            "all_target_speed_data": {"func": self.handler_get_all_target_speed_data, "type": "temporal", "mode": "static"},
            "all_target_steering_angle_data": {"func": self.handler_get_all_target_steering_angle_data, "type": "temporal", "mode": "static"}
        }
```

#### 4.3.3 Data Column Specifications
**Input Data Files and Columns:**

**cruise_control.csv:**
| Column Name | Data Type | Units | Description |
|-------------|-----------|-------|-------------|
| `timestamp` | float64 | seconds | Unix timestamp |
| `target_speed` | float64 | m/s | Target speed command |
| `steer_command` | float64 | degrees | Steering command |

**driving_mode.csv:**
| Column Name | Data Type | Units | Description |
|-------------|-----------|-------|-------------|
| `time_stamp` | float64 | seconds | Unix timestamp |
| `data_value` | str | - | Driving mode string |

**speed.csv:**
| Column Name | Data Type | Units | Description |
|-------------|-----------|-------|-------------|
| `time_stamp` | float64 | seconds | Unix timestamp |
| `data_value` | float64 | m/s | Current vehicle speed |

**steering.csv:**
| Column Name | Data Type | Units | Description |
|-------------|-----------|-------|-------------|
| `time_stamp` | float64 | seconds | Unix timestamp |
| `data_value` | float64 | degrees | Current steering angle |

#### 4.3.4 Signal Output Formats
**Dynamic Signals (timestamp-specific):**
```python
# "current_steering", "current_speed", "driving_mode", "target_speed", "target_steering_angle"
float  # Single value for the requested timestamp
```

**Static Signals (complete dataset):**
```python
# "all_steering_data", "all_current_speed_data", etc.
pd.DataFrame  # Complete dataset with columns: ['time_stamp', 'data_value']
```

---

### 4.4 CSVWatchdogPlugin

#### 4.4.1 Plugin Overview
- **File**: `CSVWatchdogPlugin.py`
- **Purpose**: Provides real-time CSV file monitoring and streaming data
- **Data Source**: Monitored CSV files
- **Dependencies**: `watchdog` library

#### 4.4.2 Interface Specification
```python
class CSVWatchdogPlugin(PluginBase):
    def __init__(self, file_path: str):
        super().__init__(file_path)
        self.signals = {
            "csv_live_data": {"func": self.get_live_data, "type": "temporal", "description": "Real-time CSV data stream", "mode": "live"},
            "csv_latest_value": {"func": self.get_latest_value, "type": "temporal", "description": "Latest value from monitored CSV", "mode": "live"},
            "csv_data_rate": {"func": self.get_data_rate, "type": "temporal", "description": "Data update rate (Hz)", "mode": "live"},
            "csv_buffer_size": {"func": self.get_buffer_size, "type": "temporal", "description": "Current data buffer size", "mode": "live"}
        }
```

#### 4.4.3 Data Column Specifications
**Input Data Columns (monitored CSV):**
| Column Name | Data Type | Units | Description |
|-------------|-----------|-------|-------------|
| `timestamp` | float64 | seconds | Data timestamp |
| `value` | float64 | varies | Monitored value |

**Internal Data Structures:**
```python
# self.live_data (pandas DataFrame)
columns = ['timestamp', 'value']
# Buffer size: 1000 rows maximum
```

#### 4.4.4 Signal Output Formats
**Signal: "csv_live_data"**
```python
{
    "timestamps": List[float],  # All timestamps in buffer
    "values": List[float],      # All values in buffer
    "last_update": float        # Last update timestamp
}
```

**Signal: "csv_latest_value"**
```python
{
    "value": float,             # Latest value
    "timestamp": float,         # Value timestamp
    "update_time": float        # System update time
}
```

**Signal: "csv_data_rate"**
```python
{
    "value": float,             # Data rate in Hz
    "unit": str,                # "Hz"
    "data_points": int          # Number of data points used
}
```

**Signal: "csv_buffer_size"**
```python
{
    "value": int,               # Current buffer size
    "unit": str,                # "data points"
    "max_size": int,            # Maximum buffer size (1000)
    "utilization": float        # Buffer utilization (0.0-1.0)
}
```

---

### 4.5 FSMViewerPlugin

#### 4.5.1 Plugin Overview
- **File**: `FSMViewerPlugin.py`
- **Purpose**: Provides finite state machine visualization and state tracking
- **Data Source**: FSM conditions CSV files
- **Dependencies**: NetworkX for graph visualization

#### 4.5.2 Interface Specification
```python
class FSMViewerPlugin(PluginBase):
    def __init__(self, file_path: str):
        super().__init__(file_path)
        self.signals = {
            "fsm_current_state": {"func": self.get_current_state_at_timestamp, "type": "categorical", "description": "Current FSM state at given timestamp", "categories": list(self.states)},
            "fsm_state_transitions": {"func": self.get_state_transitions, "type": "temporal", "description": "State transition events over time"},
            "fsm_active_signals": {"func": self.get_active_signals_at_timestamp, "type": "temporal", "description": "Active FSM signals at given timestamp"},
            "fsm_graph_data": {"func": self.get_graph_data, "type": "spatial", "description": "FSM graph structure for visualization"},
            "fsm_timestamps": {"func": self.get_timestamps, "type": "temporal", "description": "FSM data timestamps"}
        }
```

#### 4.5.3 Data Column Specifications
**Input Data Columns (li_conditions.csv):**
| Column Name | Data Type | Units | Description |
|-------------|-----------|-------|-------------|
| `fsm_execution_ts_sec` | float64 | seconds | FSM execution timestamp |
| `current_state` | str | - | Current FSM state name |
| `path_ts_sec` | float64 | seconds | Path timestamp |
| `map_obj_ts_sec` | float64 | seconds | Map object timestamp |
| `<signal_name>` | varies | varies | FSM signal values |

**Internal Data Structures:**
```python
# self.states
set(str)  # Set of unique state names

# self.transitions
{
    (from_state, to_state): {
        "signal_name": signal_value,
        ...
    }
}
```

#### 4.5.4 Signal Output Formats
**Signal: "fsm_current_state"**
```python
{
    "category": str,            # Current state name
    "timestamp": float,         # Requested timestamp
    "confidence": float         # Always 1.0
}
```

**Signal: "fsm_state_transitions"**
```python
{
    "transitions": List[{       # List of transition events
        "from": str,            # Source state
        "to": str,              # Target state
        "timestamp": float      # Transition timestamp
    }],
    "timestamps": List[float],  # Transition timestamps
    "values": List[int]         # Always [1, 1, ...] for plotting
}
```

**Signal: "fsm_active_signals"**
```python
{
    "signals": Dict[str, Any],  # Active signal values
    "timestamp": float,         # Requested timestamp
    "count": int               # Number of active signals
}
```

**Signal: "fsm_graph_data"**
```python
{
    "nodes": List[str],         # State names
    "edges": List[Tuple[str, str]], # State transitions
    "edge_labels": Dict[Tuple[str, str], str], # Transition labels
    "node_positions": Dict[str, Tuple[float, float]] # Node positions
}
```

---

### 4.6 SceneUnderstandingPlugin

#### 4.6.1 Plugin Overview
- **File**: `SceneUnderstandingPlugin.py`
- **Purpose**: Provides lane detection and scene understanding capabilities
- **Data Source**: Image files (PNG, JPG, etc.)
- **Dependencies**: OpenCV, NumPy

#### 4.6.2 Interface Specification
```python
class SceneUnderstandingPlugin(PluginBase):
    def __init__(self, file_path: str):
        super().__init__(file_path)
        self.signals = {
            "lane_detection_results": {"func": self.get_lane_detection_results, "type": "spatial", "description": "Lane detection results with line coordinates"},
            "detected_line_count": {"func": self.get_detected_line_count, "type": "temporal", "description": "Number of detected lines over time/images"},
            "lane_confidence": {"func": self.get_lane_confidence, "type": "temporal", "description": "Lane detection confidence metrics"},
            "scene_processing_status": {"func": self.get_processing_status, "type": "temporal", "description": "Scene processing status and metadata"},
            "lane_visualization": {"func": self.get_lane_visualization, "type": "spatial", "description": "Visualization data for detected lanes"}
        }
```

#### 4.6.3 Data Column Specifications
**Input Data:** Image files (no columnar data)

**Lane Detection Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `min_dist_between_lines_meters` | float | 0.45 | Minimum distance between lines |
| `min_line_length_meters` | float | 25 | Minimum line length |
| `max_gap_between_lines_meters` | float | 55 | Maximum gap between lines |
| `pixel_to_meter_ratio` | float | 0.18 | Pixel to meter conversion |

**Detected Line Structure:**
```python
{
    "x1": int,          # Line start X coordinate
    "y1": int,          # Line start Y coordinate
    "x2": int,          # Line end X coordinate
    "y2": int,          # Line end Y coordinate
    "length": float,    # Line length in pixels
    "angle": float      # Line angle in degrees
}
```

#### 4.6.4 Signal Output Formats
**Signal: "lane_detection_results"**
```python
{
    "lines": List[{             # Detected lines
        "x1": int, "y1": int,   # Start coordinates
        "x2": int, "y2": int,   # End coordinates
        "length": float,        # Line length
        "angle": float          # Line angle
    }],
    "line_count": int,          # Number of detected lines
    "image_shape": Tuple[int, int], # Image dimensions
    "detection_params": Dict,   # Detection parameters
    "image_path": str          # Source image path
}
```

**Signal: "detected_line_count"**
```python
{
    "timestamps": List[float],  # Processing timestamps
    "values": List[int],        # Line counts per image
    "total_images": int         # Total processed images
}
```

**Signal: "lane_confidence"**
```python
{
    "timestamps": List[float],  # Processing timestamps
    "values": List[float],      # Confidence scores (0.0-1.0)
    "average_confidence": float # Average confidence
}
```

---

## 5. Data Column Specifications

### 5.1 Standard Column Naming Conventions

#### 5.1.1 Temporal Data Columns
| Column Name | Data Type | Units | Description |
|-------------|-----------|-------|-------------|
| `timestamp` | float64 | seconds | Unix timestamp |
| `time_stamp` | float64 | seconds | Alternative timestamp format |
| `fsm_execution_ts_sec` | float64 | seconds | FSM-specific timestamp |

#### 5.1.2 Spatial Data Columns
| Column Name | Data Type | Units | Description |
|-------------|-----------|-------|-------------|
| `cp_x`, `x` | float64 | meters | X coordinate |
| `cp_y`, `y` | float64 | meters | Y coordinate |
| `cp_yaw_deg`, `theta` | float64 | degrees | Heading angle |
| `path_x` | float64 | meters | Path X coordinate |
| `path_y` | float64 | meters | Path Y coordinate |

#### 5.1.3 Vehicle State Columns
| Column Name | Data Type | Units | Description |
|-------------|-----------|-------|-------------|
| `data_value` | float64/str | varies | Generic data value |
| `target_speed` | float64 | m/s | Target speed command |
| `steer_command` | float64 | degrees | Steering command |
| `current_state` | str | - | FSM state name |

### 5.2 Data Type Mappings

#### 5.2.1 Numeric Data Types
| Python Type | Pandas Type | Range | Use Case |
|-------------|-------------|-------|----------|
| `float64` | `float64` | ±1.7e±308 | Coordinates, measurements |
| `int64` | `int64` | ±9.2e18 | Counts, indices |
| `float32` | `float32` | ±3.4e±38 | Reduced precision data |

#### 5.2.2 String Data Types
| Python Type | Pandas Type | Description |
|-------------|-------------|-------------|
| `str` | `object` | State names, labels |
| `str` | `category` | Categorical data with limited values |

#### 5.2.3 Temporal Data Types
| Python Type | Pandas Type | Description |
|-------------|-------------|-------------|
| `float64` | `float64` | Unix timestamps |
| `datetime64` | `datetime64[ns]` | Pandas datetime objects |

---

## 6. Signal Type Definitions

### 6.1 Signal Type Categories

#### 6.1.1 Temporal Signals
**Purpose:** Time-series data that changes over time
**Format:**
```python
{
    "timestamps": List[float],  # Time points
    "values": List[Any],        # Data values
    "units": str,              # Optional units
    "metadata": Dict           # Optional metadata
}
```

**Examples:**
- Vehicle speed over time
- Steering angle changes
- FSM state transitions

#### 6.1.2 Spatial Signals
**Purpose:** 2D/3D positional data
**Format:**
```python
{
    "x": List[float],          # X coordinates
    "y": List[float],          # Y coordinates
    "z": List[float],          # Z coordinates (optional)
    "theta": List[float],      # Orientation (optional)
    "coordinate_system": str   # Reference frame
}
```

**Examples:**
- Vehicle trajectories
- Path waypoints
- Collision violation locations

#### 6.1.3 Categorical Signals
**Purpose:** Discrete state or category data
**Format:**
```python
{
    "category": str,           # Current category
    "categories": List[str],   # All possible categories
    "timestamp": float,        # Time of category
    "confidence": float        # Confidence score
}
```

**Examples:**
- FSM states
- Driving modes
- Lane types

#### 6.1.4 Boolean Signals
**Purpose:** Binary true/false data
**Format:**
```python
{
    "value": bool,             # True/False value
    "timestamp": float,        # Time of value
    "description": str         # Value description
}
```

**Examples:**
- Emergency brake active
- Collision detected
- System ready status

### 6.2 Signal Metadata Schema

#### 6.2.1 Required Metadata Fields
| Field | Type | Description |
|-------|------|-------------|
| `func` | callable | Data retrieval function |
| `type` | str | Signal type (temporal/spatial/categorical/boolean) |

#### 6.2.2 Optional Metadata Fields
| Field | Type | Description |
|-------|------|-------------|
| `description` | str | Human-readable description |
| `units` | str | Data units (SI preferred) |
| `mode` | str | Data access mode (static/dynamic/live) |
| `coordinate_system` | str | Spatial reference system |
| `valid_range` | Tuple[float, float] | Expected value range |
| `categories` | List[str] | Valid categories (categorical signals) |

---

## 7. Data Format Standards

### 7.1 File Format Specifications

#### 7.1.1 CSV Format Requirements
```csv
# Standard CSV format with header
timestamp,cp_x,cp_y,cp_yaw_deg
1609459200.123,10.5,20.3,45.2
1609459200.223,10.6,20.4,45.1
```

**Requirements:**
- First row must be header with column names
- Timestamps in Unix seconds (float64)
- Numeric data as float64 or int64
- String data properly quoted if contains commas
- UTF-8 encoding

#### 7.1.2 Alternative File Formats
| Format | Extension | Use Case | Library |
|--------|-----------|----------|---------|
| HDF5 | .h5, .hdf5 | Large datasets | h5py |
| Parquet | .parquet | Columnar data | pyarrow |
| Pickle | .pkl | Pandas objects | pickle |
| JSON | .json | Configuration | json |

### 7.2 Coordinate System Standards

#### 7.2.1 Spatial Reference Systems
| System | Origin | X-Axis | Y-Axis | Z-Axis |
|--------|--------|--------|--------|--------|
| ENU | Local | East | North | Up |
| NED | Local | North | East | Down |
| Vehicle | Rear axle | Forward | Left | Up |
| World | Global | Varies | Varies | Up |

#### 7.2.2 Unit Standards
| Measurement | Unit | Symbol | Conversion |
|-------------|------|--------|------------|
| Distance | meters | m | 1 m = 1.0 |
| Angle | degrees | deg | 1 deg = π/180 rad |
| Speed | meters/second | m/s | 1 m/s = 3.6 km/h |
| Time | seconds | s | 1 s = 1000 ms |

---

## 8. Integration Patterns

### 8.1 Plugin Registration Pattern

#### 8.1.1 Standard Registration
```python
# In PlotManager
def register_plugin(self, plugin_name, plugin_instance):
    self.plugins[plugin_name] = plugin_instance
    
    # Register each signal
    for signal, signal_info in plugin_instance.signals.items():
        self.signal_plugins[signal] = {
            "plugin": plugin_name,
            "func": signal_info.get("func"),
            "type": signal_info.get("type"),
            "description": signal_info.get("description", ""),
            "metadata": signal_info
        }
```

#### 8.1.2 Signal Validation
```python
# In signal_validation.py
def validate_signal_definition(signal, signal_info, plugin_name):
    required_fields = ["func", "type"]
    for field in required_fields:
        if field not in signal_info:
            raise SignalValidationError(f"Missing required field '{field}'")
    
    valid_types = ["temporal", "spatial", "categorical", "boolean"]
    if signal_info["type"] not in valid_types:
        raise SignalValidationError(f"Invalid signal type: {signal_info['type']}")
```

### 8.2 Data Access Patterns

#### 8.2.1 Timestamp-Based Access
```python
# Standard pattern for timestamp-based data access
def get_data_for_timestamp(self, signal, timestamp):
    if signal in self.signals:
        signal_info = self.signals[signal]
        func = signal_info["func"]
        
        if signal_info.get("mode") == "dynamic":
            return func(timestamp)
        else:
            return func()
    return None
```

#### 8.2.2 Error Handling Pattern
```python
# Standard error handling in plugins
def get_data_for_timestamp(self, signal, timestamp):
    try:
        if not self.has_signal(signal):
            print(f"Signal '{signal}' not found")
            return None
            
        # Process data request
        result = self._process_signal_request(signal, timestamp)
        return result
        
    except Exception as e:
        print(f"Error retrieving signal '{signal}': {e}")
        return None
```

### 8.3 Performance Optimization Patterns

#### 8.3.1 Data Caching
```python
# Cache frequently accessed data
class OptimizedPlugin(PluginBase):
    def __init__(self, file_path):
        super().__init__(file_path)
        self._cache = {}
        self._cache_size_limit = 1000
        
    def get_data_for_timestamp(self, signal, timestamp):
        cache_key = f"{signal}_{timestamp}"
        
        if cache_key in self._cache:
            return self._cache[cache_key]
            
        result = self._compute_data(signal, timestamp)
        
        # Cache with size limit
        if len(self._cache) < self._cache_size_limit:
            self._cache[cache_key] = result
            
        return result
```

#### 8.3.2 Lazy Loading
```python
# Load data only when needed
class LazyPlugin(PluginBase):
    def __init__(self, file_path):
        super().__init__(file_path)
        self._data = None
        
    def _ensure_data_loaded(self):
        if self._data is None:
            self._data = self._load_data()
            
    def get_data_for_timestamp(self, signal, timestamp):
        self._ensure_data_loaded()
        return self._process_request(signal, timestamp)
```

---

## 9. Appendices

### 9.1 Plugin Development Checklist

#### 9.1.1 Implementation Checklist
- [ ] Inherit from `PluginBase`
- [ ] Implement required abstract methods
- [ ] Define `self.signals` dictionary
- [ ] Export `plugin_class` variable
- [ ] Handle file path variations
- [ ] Implement error handling
- [ ] Add signal validation
- [ ] Document data columns
- [ ] Test with sample data
- [ ] Validate output formats

#### 9.1.2 Testing Checklist
- [ ] Unit tests for all public methods
- [ ] Integration tests with PlotManager
- [ ] Test with missing/corrupted data
- [ ] Performance tests with large datasets
- [ ] Memory leak testing
- [ ] Cross-platform compatibility
- [ ] Signal validation testing
- [ ] Error handling testing

### 9.2 Common Data Column Mappings

#### 9.2.1 Vehicle Data Columns
| Standard Name | Common Variants | Units | Description |
|---------------|-----------------|-------|-------------|
| `timestamp` | `time_stamp`, `ts`, `t` | seconds | Unix timestamp |
| `vehicle_x` | `cp_x`, `pos_x`, `x` | meters | Vehicle X position |
| `vehicle_y` | `cp_y`, `pos_y`, `y` | meters | Vehicle Y position |
| `vehicle_heading` | `cp_yaw_deg`, `heading`, `theta` | degrees | Vehicle heading |
| `vehicle_speed` | `speed`, `velocity`, `v` | m/s | Vehicle speed |
| `steering_angle` | `steer`, `delta`, `steering` | degrees | Steering angle |

#### 9.2.2 Path Data Columns
| Standard Name | Common Variants | Units | Description |
|---------------|-----------------|-------|-------------|
| `path_x` | `ref_x`, `plan_x`, `traj_x` | meters | Path X coordinate |
| `path_y` | `ref_y`, `plan_y`, `traj_y` | meters | Path Y coordinate |
| `path_heading` | `ref_yaw`, `plan_heading` | degrees | Path heading |
| `path_curvature` | `kappa`, `curve`, `k` | 1/m | Path curvature |
| `path_speed` | `ref_speed`, `plan_speed` | m/s | Target speed |

### 9.3 Signal Type Quick Reference

#### 9.3.1 Type Selection Guide
| Data Characteristics | Recommended Type | Examples |
|---------------------|------------------|----------|
| Time-varying values | `temporal` | Speed, steering angle |
| 2D/3D coordinates | `spatial` | Position, path points |
| Discrete states | `categorical` | FSM states, modes |
| True/false values | `boolean` | System status flags |

#### 9.3.2 Output Format Templates
```python
# Temporal signal template
{
    "timestamps": List[float],
    "values": List[Any],
    "units": str,
    "metadata": Dict
}

# Spatial signal template
{
    "x": List[float],
    "y": List[float],
    "z": List[float],  # Optional
    "coordinate_system": str
}

# Categorical signal template
{
    "category": str,
    "categories": List[str],
    "timestamp": float,
    "confidence": float
}

# Boolean signal template
{
    "value": bool,
    "timestamp": float,
    "description": str
}
```

### 9.4 Error Handling Guidelines

#### 9.4.1 Common Error Scenarios
| Error Type | Cause | Handling Strategy |
|------------|-------|------------------|
| `FileNotFoundError` | Missing data file | Return None, log error |
| `ValueError` | Invalid data format | Parse what's possible, warn |
| `KeyError` | Missing column | Use default or skip |
| `IndexError` | Timestamp out of range | Interpolate or extrapolate |
| `TypeError` | Wrong data type | Convert or fail gracefully |

#### 9.4.2 Error Message Standards
```python
# Standard error message format
print(f"Error in {self.__class__.__name__}: {error_description}")
print(f"Signal '{signal}' not found in {plugin_name}")
print(f"Failed to load data from {file_path}: {error}")
```

### 9.5 Related Documents
- [Product Requirements Document (PRD)](./PRD_Debug_Player.md)
- [Functional Requirements Document (FRD)](./FRD_Debug_Player.md)
- [Software Requirements Document (SRD)](./SRD_Debug_Player.md)
- [Testing Requirements Document (TRD)](./TRD_Debug_Player.md)

---

**Document Control:**
- **Version History**: v1.0 - Initial comprehensive plugin interface mapping
- **Review Cycle**: Monthly interface review and updates
- **Approval**: Plugin Architecture Team and Development Lead
- **Distribution**: All plugin developers and system integrators

**Next Review Date:** January 2024 