"""
Base plugin implementation for the Debug Player Framework.
Provides common functionality for all data source plugins.
"""

import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Union, Tuple
from pathlib import Path
import pandas as pd
import numpy as np

from core.interfaces import IPlugin, SignalInfo, SignalType, TemporalSignal, SpatialSignal


class BasePlugin(IPlugin):
    """
    Base implementation for all data source plugins.
    Provides common functionality and structure.
    """
    
    def __init__(self, file_path: str):
        self.file_path = Path(file_path)
        self.logger = logging.getLogger(self.__class__.__name__)
        self._is_loaded = False
        self._data: Optional[pd.DataFrame] = None
        self._signals: Dict[str, SignalInfo] = {}
        self._time_range: Optional[Tuple[float, float]] = None
        self._version = "1.0.0"
        self._description = "Base plugin for data loading"
        
    @property
    def name(self) -> str:
        """Plugin name."""
        return self.__class__.__name__
    
    @property
    def version(self) -> str:
        """Plugin version."""
        return self._version
    
    @property
    def description(self) -> str:
        """Plugin description."""
        return self._description
    
    @property
    def is_loaded(self) -> bool:
        """Check if plugin is loaded."""
        return self._is_loaded
    
    def load(self) -> bool:
        """Load and initialize the plugin."""
        try:
            if not self.file_path.exists():
                self.logger.error(f"Data file not found: {self.file_path}")
                return False
            
            self.logger.info(f"Loading data from {self.file_path}")
            
            # Load data based on file extension
            if self.file_path.suffix.lower() == '.csv':
                self._data = pd.read_csv(self.file_path)
            elif self.file_path.suffix.lower() == '.parquet':
                self._data = pd.read_parquet(self.file_path)
            elif self.file_path.suffix.lower() == '.h5':
                self._data = pd.read_hdf(self.file_path)
            else:
                self.logger.error(f"Unsupported file format: {self.file_path.suffix}")
                return False
            
            # Validate data
            if self._data is None or self._data.empty:
                self.logger.error("No data loaded from file")
                return False
            
            # Initialize signals
            self._initialize_signals()
            
            # Calculate time range
            self._calculate_time_range()
            
            self._is_loaded = True
            self.logger.info(f"Plugin loaded successfully: {len(self._data)} rows, {len(self._signals)} signals")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error loading plugin: {e}")
            return False
    
    def unload(self) -> bool:
        """Unload the plugin and clean up resources."""
        try:
            self._data = None
            self._signals.clear()
            self._time_range = None
            self._is_loaded = False
            
            self.logger.info("Plugin unloaded successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Error unloading plugin: {e}")
            return False
    
    def has_signal(self, signal: str) -> bool:
        """Check if plugin provides specified signal."""
        return signal in self._signals
    
    def get_signals(self) -> Dict[str, SignalInfo]:
        """Get all signals provided by this plugin."""
        return self._signals.copy()
    
    def get_data_for_timestamp(self, signal: str, timestamp: float) -> Optional[Dict[str, Any]]:
        """Retrieve signal data for specific timestamp."""
        if not self._is_loaded or self._data is None:
            return None
        
        if signal not in self._signals:
            return None
        
        try:
            # Find closest timestamp
            time_col = self._get_time_column()
            if time_col is None:
                return None
            
            # Find closest row
            time_diff = np.abs(self._data[time_col] - timestamp)
            closest_idx = time_diff.idxmin()
            
            # Get data for this timestamp
            row = self._data.iloc[closest_idx]
            
            # Return data based on signal type
            signal_info = self._signals[signal]
            
            if signal_info.signal_type == SignalType.TEMPORAL:
                return {
                    'timestamp': float(row[time_col]),
                    'value': float(row[signal]) if signal in row else None,
                    'units': signal_info.units
                }
            elif signal_info.signal_type == SignalType.SPATIAL:
                return self._get_spatial_data(row, signal)
            else:
                return {
                    'timestamp': float(row[time_col]),
                    'value': row[signal] if signal in row else None,
                    'units': signal_info.units
                }
                
        except Exception as e:
            self.logger.error(f"Error getting data for signal {signal}: {e}")
            return None
    
    def get_data_range(self, signal: str, start_time: float, end_time: float) -> Optional[Union[TemporalSignal, SpatialSignal]]:
        """Get signal data for a time range."""
        if not self._is_loaded or self._data is None:
            return None
        
        if signal not in self._signals:
            return None
        
        try:
            time_col = self._get_time_column()
            if time_col is None:
                return None
            
            # Filter data for time range
            mask = (self._data[time_col] >= start_time) & (self._data[time_col] <= end_time)
            filtered_data = self._data[mask]
            
            if filtered_data.empty:
                return None
            
            signal_info = self._signals[signal]
            
            if signal_info.signal_type == SignalType.TEMPORAL:
                return TemporalSignal(
                    timestamps=filtered_data[time_col].values,
                    values=filtered_data[signal].values,
                    units=signal_info.units
                )
            elif signal_info.signal_type == SignalType.SPATIAL:
                return self._get_spatial_range(filtered_data, signal)
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting data range for signal {signal}: {e}")
            return None
    
    def get_time_range(self) -> Tuple[float, float]:
        """Get the time range of the data."""
        if self._time_range is None:
            return (0.0, 0.0)
        return self._time_range
    
    @abstractmethod
    def _initialize_signals(self) -> None:
        """Initialize signal definitions. Must be implemented by subclasses."""
        pass
    
    def _get_time_column(self) -> Optional[str]:
        """Get the name of the time column."""
        # Common time column names
        time_cols = ['time', 'timestamp', 'Time', 'Timestamp', 't', 'T']
        
        for col in time_cols:
            if col in self._data.columns:
                return col
        
        return None
    
    def _calculate_time_range(self) -> None:
        """Calculate the time range from the data."""
        if self._data is None:
            return
        
        time_col = self._get_time_column()
        if time_col is None:
            return
        
        min_time = float(self._data[time_col].min())
        max_time = float(self._data[time_col].max())
        self._time_range = (min_time, max_time)
    
    def _get_spatial_data(self, row: pd.Series, signal: str) -> Dict[str, Any]:
        """Get spatial data for a specific row."""
        # Override in subclasses for specific spatial data handling
        return {
            'x': float(row.get('x', 0.0)),
            'y': float(row.get('y', 0.0)),
            'z': float(row.get('z', 0.0)) if 'z' in row else None,
            'timestamp': float(row[self._get_time_column()]) if self._get_time_column() else 0.0
        }
    
    def _get_spatial_range(self, data: pd.DataFrame, signal: str) -> Optional[SpatialSignal]:
        """Get spatial data for a time range."""
        # Override in subclasses for specific spatial data handling
        return SpatialSignal(
            x=data['x'].values if 'x' in data.columns else np.zeros(len(data)),
            y=data['y'].values if 'y' in data.columns else np.zeros(len(data)),
            z=data['z'].values if 'z' in data.columns else None,
            coordinate_system="local"
        )
