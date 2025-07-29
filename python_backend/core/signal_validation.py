"""
Signal validation system for the Debug Player Framework.
Validates signal data integrity and metadata consistency.
"""

import logging
from typing import Dict, Any, Optional, Union, List
import numpy as np
from core.interfaces import SignalInfo, SignalType, TemporalSignal, SpatialSignal


class SignalValidator:
    """
    Signal validation system for ensuring data integrity and consistency.
    Validates both signal metadata and actual signal data.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Define validation rules for different signal types
        self.validation_rules = {
            SignalType.TEMPORAL: self._validate_temporal_signal,
            SignalType.SPATIAL: self._validate_spatial_signal,
            SignalType.CATEGORICAL: self._validate_categorical_signal,
            SignalType.BOOLEAN: self._validate_boolean_signal,
            SignalType.BINARY: self._validate_binary_signal
        }
    
    def validate_signal_info(self, signal_info: SignalInfo) -> bool:
        """
        Validate signal metadata.
        
        Args:
            signal_info: Signal information to validate
            
        Returns:
            True if valid, False otherwise
        """
        try:
            # Check required fields
            if not signal_info.name or not isinstance(signal_info.name, str):
                self.logger.error("Signal name must be a non-empty string")
                return False
            
            if not isinstance(signal_info.signal_type, SignalType):
                self.logger.error(f"Invalid signal type: {signal_info.signal_type}")
                return False
            
            if not signal_info.units or not isinstance(signal_info.units, str):
                self.logger.error("Signal units must be a non-empty string")
                return False
            
            if not signal_info.description or not isinstance(signal_info.description, str):
                self.logger.error("Signal description must be a non-empty string")
                return False
            
            # Validate value range if provided
            if signal_info.value_range is not None:
                if (not isinstance(signal_info.value_range, tuple) or 
                    len(signal_info.value_range) != 2):
                    self.logger.error("Value range must be a tuple of two numbers")
                    return False
                
                min_val, max_val = signal_info.value_range
                if not isinstance(min_val, (int, float)) or not isinstance(max_val, (int, float)):
                    self.logger.error("Value range must contain numeric values")
                    return False
                
                if min_val >= max_val:
                    self.logger.error("Value range minimum must be less than maximum")
                    return False
            
            # Validate sampling rate if provided
            if signal_info.sampling_rate is not None:
                if not isinstance(signal_info.sampling_rate, (int, float)) or signal_info.sampling_rate <= 0:
                    self.logger.error("Sampling rate must be a positive number")
                    return False
            
            # Validate coordinate system for spatial signals
            if signal_info.signal_type == SignalType.SPATIAL:
                if not signal_info.coordinate_system:
                    self.logger.error("Spatial signals must specify coordinate system")
                    return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error validating signal info: {e}")
            return False
    
    def validate_signal(self, signal: str, data: Any) -> bool:
        """
        Validate signal data.
        
        Args:
            signal: Signal name
            data: Signal data to validate
            
        Returns:
            True if valid, False otherwise
        """
        try:
            if not isinstance(data, (TemporalSignal, SpatialSignal, dict)):
                self.logger.error(f"Invalid data type for signal {signal}")
                return False
            
            # Handle different data types
            if isinstance(data, TemporalSignal):
                return self._validate_temporal_signal(data)
            elif isinstance(data, SpatialSignal):
                return self._validate_spatial_signal(data)
            elif isinstance(data, dict):
                return self._validate_dict_signal(data)
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error validating signal {signal}: {e}")
            return False
    
    def _validate_temporal_signal(self, data: Union[TemporalSignal, Dict[str, Any]]) -> bool:
        """Validate temporal signal data."""
        if isinstance(data, TemporalSignal):
            timestamps = data.timestamps
            values = data.values
        else:
            timestamps = data.get('timestamps')
            values = data.get('values')
        
        if timestamps is None or values is None:
            self.logger.error("Temporal signal must have timestamps and values")
            return False
        
        if not isinstance(timestamps, np.ndarray):
            timestamps = np.array(timestamps)
        
        if not isinstance(values, np.ndarray):
            values = np.array(values)
        
        if len(timestamps) != len(values):
            self.logger.error("Timestamps and values must have same length")
            return False
        
        if len(timestamps) == 0:
            self.logger.error("Temporal signal cannot be empty")
            return False
        
        # Check for monotonically increasing timestamps
        if not np.all(np.diff(timestamps) >= 0):
            self.logger.error("Timestamps must be monotonically increasing")
            return False
        
        # Check for invalid values
        if np.any(np.isnan(values)) or np.any(np.isinf(values)):
            self.logger.warning("Signal contains NaN or infinite values")
        
        return True
    
    def _validate_spatial_signal(self, data: Union[SpatialSignal, Dict[str, Any]]) -> bool:
        """Validate spatial signal data."""
        if isinstance(data, SpatialSignal):
            x = data.x
            y = data.y
            z = data.z
        else:
            x = data.get('x')
            y = data.get('y')
            z = data.get('z')
        
        if x is None or y is None:
            self.logger.error("Spatial signal must have x and y coordinates")
            return False
        
        if not isinstance(x, np.ndarray):
            x = np.array(x)
        
        if not isinstance(y, np.ndarray):
            y = np.array(y)
        
        if len(x) != len(y):
            self.logger.error("X and Y coordinates must have same length")
            return False
        
        if len(x) == 0:
            self.logger.error("Spatial signal cannot be empty")
            return False
        
        # Validate Z coordinates if provided
        if z is not None:
            if not isinstance(z, np.ndarray):
                z = np.array(z)
            
            if len(z) != len(x):
                self.logger.error("Z coordinates must have same length as X and Y")
                return False
        
        # Check for invalid values
        if (np.any(np.isnan(x)) or np.any(np.isinf(x)) or 
            np.any(np.isnan(y)) or np.any(np.isinf(y))):
            self.logger.warning("Spatial signal contains NaN or infinite values")
        
        return True
    
    def _validate_categorical_signal(self, data: Dict[str, Any]) -> bool:
        """Validate categorical signal data."""
        values = data.get('values')
        categories = data.get('categories')
        
        if values is None:
            self.logger.error("Categorical signal must have values")
            return False
        
        if not isinstance(values, (list, np.ndarray)):
            self.logger.error("Categorical values must be a list or array")
            return False
        
        if len(values) == 0:
            self.logger.error("Categorical signal cannot be empty")
            return False
        
        # Check if categories are provided
        if categories is not None:
            if not isinstance(categories, (list, tuple)):
                self.logger.error("Categories must be a list or tuple")
                return False
            
            # Check if all values are in categories
            unique_values = set(values)
            if not unique_values.issubset(set(categories)):
                self.logger.error("Some values are not in the specified categories")
                return False
        
        return True
    
    def _validate_boolean_signal(self, data: Dict[str, Any]) -> bool:
        """Validate boolean signal data."""
        values = data.get('values')
        
        if values is None:
            self.logger.error("Boolean signal must have values")
            return False
        
        if not isinstance(values, (list, np.ndarray)):
            self.logger.error("Boolean values must be a list or array")
            return False
        
        if len(values) == 0:
            self.logger.error("Boolean signal cannot be empty")
            return False
        
        # Check if all values are boolean
        try:
            bool_values = np.array(values, dtype=bool)
            if len(bool_values) != len(values):
                self.logger.error("Not all values are boolean")
                return False
        except (ValueError, TypeError):
            self.logger.error("Cannot convert values to boolean")
            return False
        
        return True
    
    def _validate_binary_signal(self, data: Dict[str, Any]) -> bool:
        """Validate binary signal data."""
        values = data.get('values')
        
        if values is None:
            self.logger.error("Binary signal must have values")
            return False
        
        if not isinstance(values, (bytes, bytearray)):
            self.logger.error("Binary values must be bytes or bytearray")
            return False
        
        if len(values) == 0:
            self.logger.error("Binary signal cannot be empty")
            return False
        
        return True
    
    def _validate_dict_signal(self, data: Dict[str, Any]) -> bool:
        """Validate generic dictionary signal data."""
        if 'type' not in data:
            self.logger.error("Dictionary signal must specify type")
            return False
        
        signal_type = data['type']
        
        if signal_type == 'temporal':
            return self._validate_temporal_signal(data)
        elif signal_type == 'spatial':
            return self._validate_spatial_signal(data)
        elif signal_type == 'categorical':
            return self._validate_categorical_signal(data)
        elif signal_type == 'boolean':
            return self._validate_boolean_signal(data)
        elif signal_type == 'binary':
            return self._validate_binary_signal(data)
        else:
            self.logger.error(f"Unknown signal type: {signal_type}")
            return False
    
    def validate_batch(self, signals: Dict[str, Any]) -> Dict[str, bool]:
        """
        Validate multiple signals in batch.
        
        Args:
            signals: Dictionary of signal name to data
            
        Returns:
            Dictionary of signal name to validation result
        """
        results = {}
        
        for signal_name, signal_data in signals.items():
            try:
                results[signal_name] = self.validate_signal(signal_name, signal_data)
            except Exception as e:
                self.logger.error(f"Error validating signal {signal_name}: {e}")
                results[signal_name] = False
        
        return results
    
    def get_validation_report(self, signals: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get detailed validation report for signals.
        
        Args:
            signals: Dictionary of signal name to data
            
        Returns:
            Detailed validation report
        """
        report = {
            "total_signals": len(signals),
            "valid_signals": 0,
            "invalid_signals": 0,
            "signal_results": {},
            "summary": {}
        }
        
        validation_results = self.validate_batch(signals)
        
        for signal_name, is_valid in validation_results.items():
            report["signal_results"][signal_name] = {
                "valid": is_valid,
                "data_type": type(signals[signal_name]).__name__,
                "size": len(signals[signal_name]) if hasattr(signals[signal_name], '__len__') else "unknown"
            }
            
            if is_valid:
                report["valid_signals"] += 1
            else:
                report["invalid_signals"] += 1
        
        report["summary"] = {
            "validation_rate": report["valid_signals"] / report["total_signals"] if report["total_signals"] > 0 else 0,
            "error_rate": report["invalid_signals"] / report["total_signals"] if report["total_signals"] > 0 else 0
        }
        
        return report
