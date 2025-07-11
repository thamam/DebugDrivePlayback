"""
Core interfaces for the Debug Player Framework.
Defines abstract base classes for plugins, data sources, and signal processing.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Union, Tuple
from dataclasses import dataclass
from enum import Enum
import numpy as np
import pandas as pd


class SignalType(Enum):
    """Signal data types supported by the framework."""
    TEMPORAL = "temporal"
    SPATIAL = "spatial"
    CATEGORICAL = "categorical"
    BOOLEAN = "boolean"
    BINARY = "binary"


@dataclass
class SignalInfo:
    """Metadata for a signal."""
    name: str
    signal_type: SignalType
    units: str
    description: str
    value_range: Optional[Tuple[float, float]] = None
    sampling_rate: Optional[float] = None
    coordinate_system: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class TemporalSignal:
    """Temporal signal data structure."""
    timestamps: np.ndarray
    values: np.ndarray
    units: str
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class SpatialSignal:
    """Spatial signal data structure."""
    x: np.ndarray
    y: np.ndarray
    z: Optional[np.ndarray] = None
    coordinate_system: str = "local"
    timestamp: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class SessionData:
    """Session data container."""
    session_id: str
    name: str
    filename: str
    file_size: int
    duration: float
    frequency: float
    signal_count: int
    created_at: float
    metadata: Optional[Dict[str, Any]] = None


class IDataSource(ABC):
    """Interface for data source implementations."""
    
    @abstractmethod
    def load_data(self, file_path: str) -> bool:
        """Load data from file path."""
        pass
    
    @abstractmethod
    def get_signals(self) -> Dict[str, SignalInfo]:
        """Get available signals from the data source."""
        pass
    
    @abstractmethod
    def get_data_for_timestamp(self, signal: str, timestamp: float) -> Optional[Dict[str, Any]]:
        """Get signal data for a specific timestamp."""
        pass
    
    @abstractmethod
    def get_data_range(self, signal: str, start_time: float, end_time: float) -> Optional[Union[TemporalSignal, SpatialSignal]]:
        """Get signal data for a time range."""
        pass
    
    @abstractmethod
    def get_time_range(self) -> Tuple[float, float]:
        """Get the time range of the data."""
        pass


class IPlugin(ABC):
    """Base interface for all plugins."""
    
    @abstractmethod
    def __init__(self, file_path: str):
        """Initialize plugin with data source path."""
        pass
    
    @abstractmethod
    def load(self) -> bool:
        """Load and initialize the plugin."""
        pass
    
    @abstractmethod
    def unload(self) -> bool:
        """Unload the plugin and clean up resources."""
        pass
    
    @abstractmethod
    def has_signal(self, signal: str) -> bool:
        """Check if plugin provides specified signal."""
        pass
    
    @abstractmethod
    def get_signals(self) -> Dict[str, SignalInfo]:
        """Get all signals provided by this plugin."""
        pass
    
    @abstractmethod
    def get_data_for_timestamp(self, signal: str, timestamp: float) -> Optional[Dict[str, Any]]:
        """Retrieve signal data for specific timestamp."""
        pass
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Plugin name."""
        pass
    
    @property
    @abstractmethod
    def version(self) -> str:
        """Plugin version."""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Plugin description."""
        pass
    
    @property
    @abstractmethod
    def is_loaded(self) -> bool:
        """Check if plugin is loaded."""
        pass


class IDataProcessor(ABC):
    """Interface for data processing components."""
    
    @abstractmethod
    def process_data(self, data: Any) -> Any:
        """Process raw data."""
        pass
    
    @abstractmethod
    def validate_data(self, data: Any) -> bool:
        """Validate data integrity."""
        pass


class ICacheManager(ABC):
    """Interface for cache management."""
    
    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """Get cached data."""
        pass
    
    @abstractmethod
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set cached data."""
        pass
    
    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete cached data."""
        pass
    
    @abstractmethod
    def clear(self) -> bool:
        """Clear all cached data."""
        pass


class ICollisionDetector(ABC):
    """Interface for collision detection algorithms."""
    
    @abstractmethod
    def detect_violations(self, vehicle_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect collision violations."""
        pass
    
    @abstractmethod
    def calculate_margin(self, vehicle_data: Dict[str, Any]) -> float:
        """Calculate collision margin."""
        pass
    
    @abstractmethod
    def set_threshold(self, threshold: float) -> None:
        """Set collision threshold."""
        pass


class ISignalValidator(ABC):
    """Interface for signal validation."""
    
    @abstractmethod
    def validate_signal(self, signal: str, data: Any) -> bool:
        """Validate signal data."""
        pass
    
    @abstractmethod
    def validate_signal_info(self, signal_info: SignalInfo) -> bool:
        """Validate signal metadata."""
        pass


class IPerformanceMonitor(ABC):
    """Interface for performance monitoring."""
    
    @abstractmethod
    def start_timing(self, operation: str) -> None:
        """Start timing an operation."""
        pass
    
    @abstractmethod
    def end_timing(self, operation: str) -> float:
        """End timing and return duration."""
        pass
    
    @abstractmethod
    def record_metric(self, metric: str, value: float) -> None:
        """Record a performance metric."""
        pass
    
    @abstractmethod
    def get_metrics(self) -> Dict[str, float]:
        """Get all recorded metrics."""
        pass