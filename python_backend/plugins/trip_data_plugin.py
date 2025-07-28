"""
Trip Data Plugin for the Debug Player Framework.
Handles directories containing multiple CSV files with vehicle telemetry data.
"""

import pandas as pd
import numpy as np
from typing import Dict, Optional, Any
from pathlib import Path
from plugins.base_plugin import BasePlugin
from core.interfaces import SignalInfo, SignalType


class TripDataPlugin(BasePlugin):
    """
    Plugin for loading and processing trip directories with multiple CSV files.
    Handles the real vehicle data format with separate CSV files for each signal type.
    """
    
    def __init__(self, file_path: str):
        super().__init__(file_path)
        self._version = "1.0.0"
        self._description = "Trip directory data loader plugin"
        self._csv_files = {}
        self._combined_data = None
    
    def load(self) -> bool:
        """Load and initialize the plugin."""
        try:
            # Handle both directory and single file paths
            if self.file_path.is_dir():
                return self._load_directory()
            else:
                return super().load()
                
        except Exception as e:
            self.logger.error(f"Error loading trip data: {e}")
            return False
    
    def _load_directory(self) -> bool:
        """Load all CSV files from the trip directory."""
        try:
            self.logger.info(f"Loading trip data from directory: {self.file_path}")
            
            # Find all CSV files in the directory
            csv_files = list(self.file_path.glob("*.csv"))
            if not csv_files:
                self.logger.error("No CSV files found in directory")
                return False
            
            self.logger.info(f"Found {len(csv_files)} CSV files")
            
            # Load each CSV file
            all_dataframes = {}
            for csv_file in csv_files:
                signal_name = csv_file.stem  # filename without extension
                try:
                    df = pd.read_csv(csv_file)
                    if not df.empty:
                        all_dataframes[signal_name] = df
                        self.logger.info(f"Loaded {signal_name}: {len(df)} rows")
                except Exception as e:
                    self.logger.warning(f"Failed to load {csv_file}: {e}")
                    continue
            
            if not all_dataframes:
                self.logger.error("No valid CSV files could be loaded")
                return False
            
            # Combine all data into a single DataFrame
            self._combined_data = self._combine_dataframes(all_dataframes)
            self._data = self._combined_data
            
            # Initialize signals
            self._initialize_signals()
            
            # Calculate time range
            self._calculate_time_range()
            
            self._is_loaded = True
            self.logger.info(f"Trip data loaded successfully: {len(self._data)} rows, {len(self._signals)} signals")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error loading directory: {e}")
            return False
    
    def _combine_dataframes(self, dataframes: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Combine multiple CSV files into a single DataFrame."""
        combined_rows = []
        
        for signal_name, df in dataframes.items():
            # Handle different CSV formats
            if 'time_stamp' in df.columns and 'data_value' in df.columns:
                # Standard format: time_stamp, data_value
                for _, row in df.iterrows():
                    if pd.notna(row['data_value']):
                        combined_rows.append({
                            'timestamp': row['time_stamp'],
                            'signal': signal_name,
                            'value': row['data_value']
                        })
            elif 'time_stamp' in df.columns and len(df.columns) > 2:
                # Multi-column format (like GPS with lat, lon, etc.)
                for _, row in df.iterrows():
                    for col in df.columns:
                        if col != 'time_stamp' and pd.notna(row[col]):
                            signal_full_name = f"{signal_name}_{col}" if len(df.columns) > 2 else signal_name
                            combined_rows.append({
                                'timestamp': row['time_stamp'],
                                'signal': signal_full_name,
                                'value': row[col]
                            })
            else:
                self.logger.warning(f"Unknown format for {signal_name}, skipping")
                continue
        
        if not combined_rows:
            return pd.DataFrame()
        
        combined_df = pd.DataFrame(combined_rows)
        combined_df = combined_df.sort_values('timestamp')
        
        return combined_df
    
    def _initialize_signals(self) -> None:
        """Initialize signal definitions based on loaded data."""
        if self._data is None or self._data.empty:
            return
        
        # Get unique signals from the data
        unique_signals = self._data['signal'].unique()
        
        # Define signal mappings
        signal_definitions = {}
        
        for signal in unique_signals:
            signal_data = self._data[self._data['signal'] == signal]['value']
            
            # Determine signal type and properties based on name and data
            if 'speed' in signal.lower():
                signal_definitions[signal] = SignalInfo(
                    name=signal,
                    signal_type=SignalType.TEMPORAL,
                    units='m/s' if 'speed' in signal else 'unknown',
                    description=f'Vehicle {signal}',
                    value_range=(signal_data.min(), signal_data.max()),
                    sampling_rate=10.0
                )
            elif 'gps' in signal.lower() or 'latitude' in signal.lower() or 'longitude' in signal.lower():
                signal_definitions[signal] = SignalInfo(
                    name=signal,
                    signal_type=SignalType.SPATIAL,
                    units='degrees' if 'lat' in signal.lower() or 'lon' in signal.lower() else 'm',
                    description=f'GPS {signal}',
                    value_range=(signal_data.min(), signal_data.max()),
                    sampling_rate=10.0
                )
            elif 'steering' in signal.lower():
                signal_definitions[signal] = SignalInfo(
                    name=signal,
                    signal_type=SignalType.TEMPORAL,
                    units='degrees',
                    description=f'Vehicle {signal}',
                    value_range=(signal_data.min(), signal_data.max()),
                    sampling_rate=10.0
                )
            elif any(keyword in signal.lower() for keyword in ['brake', 'throttle', 'acceleration']):
                signal_definitions[signal] = SignalInfo(
                    name=signal,
                    signal_type=SignalType.TEMPORAL,
                    units='%' if 'brake' in signal.lower() or 'throttle' in signal.lower() else 'm/s²',
                    description=f'Vehicle {signal}',
                    value_range=(signal_data.min(), signal_data.max()),
                    sampling_rate=10.0
                )
            else:
                # Generic signal
                signal_definitions[signal] = SignalInfo(
                    name=signal,
                    signal_type=SignalType.TEMPORAL,
                    units='unknown',
                    description=f'Vehicle {signal}',
                    value_range=(signal_data.min(), signal_data.max()),
                    sampling_rate=10.0
                )
        
        self._signals = signal_definitions
        self.logger.info(f"Initialized {len(signal_definitions)} signals")
    
    def get_data_at_timestamp(self, timestamp: float, signals: Optional[list] = None) -> Dict[str, Any]:
        """Get data values at a specific timestamp."""
        if self._data is None:
            return {}
        
        # Filter by requested signals if provided
        query_signals = signals if signals else list(self._signals.keys())
        
        result = {}
        for signal in query_signals:
            if signal in self._signals:
                # Find closest timestamp for this signal
                signal_data = self._data[self._data['signal'] == signal]
                if not signal_data.empty:
                    closest_idx = (signal_data['timestamp'] - timestamp).abs().idxmin()
                    closest_row = signal_data.loc[closest_idx]
                    result[signal] = {
                        'value': closest_row['value'],
                        'timestamp': closest_row['timestamp'],
                        'units': self._signals[signal].units
                    }
        
        return result
    
    def get_signal_data_range(self, signal: str, start_time: float, end_time: float) -> Dict[str, Any]:
        """Get all data points for a signal within a time range."""
        if self._data is None or signal not in self._signals:
            return {}
        
        signal_data = self._data[
            (self._data['signal'] == signal) & 
            (self._data['timestamp'] >= start_time) & 
            (self._data['timestamp'] <= end_time)
        ]
        
        return {
            'timestamps': signal_data['timestamp'].tolist(),
            'values': signal_data['value'].tolist(),
            'units': self._signals[signal].units,
            'count': len(signal_data)
        }
