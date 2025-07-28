"""
Vehicle Data Plugin for the Debug Player Framework.
Handles vehicle telemetry data including speed, acceleration, steering, and position.
"""

import numpy as np
from typing import Dict, Optional, Any
from plugins.base_plugin import BasePlugin
from core.interfaces import SignalInfo, SignalType


class VehicleDataPlugin(BasePlugin):
    """
    Plugin for loading and processing vehicle telemetry data.
    Supports standard vehicle signals like speed, acceleration, steering, and position.
    """

    def __init__(self, file_path: str):
        super().__init__(file_path)
        self._version = "1.0.0"
        self._description = "Vehicle telemetry data loader plugin"

    def _initialize_signals(self) -> None:
        """Initialize vehicle signal definitions."""
        if self._data is None:
            return

        # Define standard vehicle signals
        signal_definitions = {
            "vehicle_speed": SignalInfo(
                name="vehicle_speed",
                signal_type=SignalType.TEMPORAL,
                units="m/s",
                description="Vehicle longitudinal speed",
                value_range=(0.0, 50.0),
                sampling_rate=10.0,
            ),
            "acceleration": SignalInfo(
                name="acceleration",
                signal_type=SignalType.TEMPORAL,
                units="m/s²",
                description="Vehicle longitudinal acceleration",
                value_range=(-10.0, 10.0),
                sampling_rate=10.0,
            ),
            "steering_angle": SignalInfo(
                name="steering_angle",
                signal_type=SignalType.TEMPORAL,
                units="rad",
                description="Steering wheel angle",
                value_range=(-1.57, 1.57),
                sampling_rate=10.0,
            ),
            "position_x": SignalInfo(
                name="position_x",
                signal_type=SignalType.TEMPORAL,
                units="m",
                description="Vehicle X position",
                coordinate_system="local",
                sampling_rate=10.0,
            ),
            "position_y": SignalInfo(
                name="position_y",
                signal_type=SignalType.TEMPORAL,
                units="m",
                description="Vehicle Y position",
                coordinate_system="local",
                sampling_rate=10.0,
            ),
            "heading": SignalInfo(
                name="heading",
                signal_type=SignalType.TEMPORAL,
                units="rad",
                description="Vehicle heading angle",
                value_range=(-np.pi, np.pi),
                sampling_rate=10.0,
            ),
            "throttle": SignalInfo(
                name="throttle",
                signal_type=SignalType.TEMPORAL,
                units="%",
                description="Throttle position",
                value_range=(0.0, 100.0),
                sampling_rate=10.0,
            ),
            "brake": SignalInfo(
                name="brake",
                signal_type=SignalType.TEMPORAL,
                units="%",
                description="Brake pedal position",
                value_range=(0.0, 100.0),
                sampling_rate=10.0,
            ),
            "vehicle_pose": SignalInfo(
                name="vehicle_pose",
                signal_type=SignalType.SPATIAL,
                units="m",
                description="Vehicle spatial position",
                coordinate_system="local",
                sampling_rate=10.0,
            ),
        }

        # Only register signals that exist in the data
        for signal_name, signal_info in signal_definitions.items():
            if self._signal_exists_in_data(signal_name):
                self._signals[signal_name] = signal_info

    def _signal_exists_in_data(self, signal_name: str) -> bool:
        """Check if a signal exists in the loaded data."""
        if self._data is None:
            return False

        # Check for exact match first
        if signal_name in self._data.columns:
            return True

        # Check for common variations
        variations = {
            "vehicle_speed": ["speed", "velocity", "vel", "v"],
            "acceleration": ["accel", "acc", "a"],
            "steering_angle": ["steer", "steering", "delta"],
            "position_x": ["x", "pos_x", "X"],
            "position_y": ["y", "pos_y", "Y"],
            "heading": ["yaw", "psi", "orientation"],
            "throttle": ["gas", "accelerator"],
            "brake": ["brake_pedal", "brakes"],
        }

        if signal_name in variations:
            for variation in variations[signal_name]:
                if variation in self._data.columns:
                    return True

        return False

    def _get_column_name(self, signal_name: str) -> Optional[str]:
        """Get the actual column name for a signal."""
        if self._data is None:
            return None

        # Check for exact match first
        if signal_name in self._data.columns:
            return signal_name

        # Check for common variations
        variations = {
            "vehicle_speed": ["speed", "velocity", "vel", "v"],
            "acceleration": ["accel", "acc", "a"],
            "steering_angle": ["steer", "steering", "delta"],
            "position_x": ["x", "pos_x", "X"],
            "position_y": ["y", "pos_y", "Y"],
            "heading": ["yaw", "psi", "orientation"],
            "throttle": ["gas", "accelerator"],
            "brake": ["brake_pedal", "brakes"],
        }

        if signal_name in variations:
            for variation in variations[signal_name]:
                if variation in self._data.columns:
                    return variation

        return None

    def get_data_for_timestamp(
        self, signal: str, timestamp: float
    ) -> Optional[Dict[str, Any]]:
        """Retrieve signal data for specific timestamp."""
        if not self._is_loaded or self._data is None:
            return None

        if signal not in self._signals:
            return None

        try:
            # Find closest timestamp
            time_col = self._time_column or self._get_time_column()
            if time_col is None:
                return None

            # Find closest row
            time_diff = np.abs(self._data[time_col] - timestamp)
            closest_idx = time_diff.idxmin()
            row = self._data.iloc[closest_idx]

            # Get actual column name
            column_name = self._get_column_name(signal)
            if column_name is None:
                return None

            signal_info = self._signals[signal]

            if signal == "vehicle_pose":
                return self._get_spatial_data(row, signal)
            else:
                return {
                    "timestamp": float(row[time_col]),
                    "value": float(row[column_name]),
                    "units": signal_info.units,
                    "signal_type": signal_info.signal_type.value,
                }

        except Exception as e:
            self.logger.error(f"Error getting data for signal {signal}: {e}")
            return None

    def _get_spatial_data(self, row, signal: str) -> Dict[str, Any]:
        """Get spatial data for vehicle pose."""
        time_col = self._time_column or self._get_time_column()

        # Get position data
        x_col = self._get_column_name("position_x")
        y_col = self._get_column_name("position_y")
        heading_col = self._get_column_name("heading")

        return {
            "x": float(row[x_col]) if x_col and x_col in row else 0.0,
            "y": float(row[y_col]) if y_col and y_col in row else 0.0,
            "heading": (
                float(row[heading_col]) if heading_col and heading_col in row else 0.0
            ),
            "timestamp": float(row[time_col]) if time_col else 0.0,
            "coordinate_system": "local",
        }

    def get_collision_margin(self, timestamp: float) -> Optional[float]:
        """
        Calculate collision margin for a given timestamp.
        This is a simplified calculation based on speed and distance to obstacles.
        """
        if not self._is_loaded or self._data is None:
            return None

        try:
            # Find closest timestamp
            time_col = self._time_column or self._get_time_column()
            if time_col is None:
                return None

            time_diff = np.abs(self._data[time_col] - timestamp)
            closest_idx = time_diff.idxmin()
            row = self._data.iloc[closest_idx]

            # Get speed
            speed_col = self._get_column_name("vehicle_speed")
            if speed_col is None:
                return None

            speed = float(row[speed_col])

            # Simple collision margin calculation
            # In a real implementation, this would use actual obstacle data
            # For now, we'll simulate based on speed and some assumptions

            # Assume minimum safe distance is 2 seconds * speed
            safe_distance = 2.0 * speed

            # Simulate current distance to nearest obstacle
            # This would come from perception/sensor data in reality
            simulated_distance = 10.0 + speed * 0.5  # Simplified simulation

            margin = simulated_distance - safe_distance

            return max(0.0, margin)  # Ensure non-negative

        except Exception as e:
            self.logger.error(f"Error calculating collision margin: {e}")
            return None

    def get_vehicle_state(self, timestamp: float) -> Optional[Dict[str, Any]]:
        """Get comprehensive vehicle state for a given timestamp."""
        if not self._is_loaded or self._data is None:
            return None

        try:
            # Find closest timestamp
            time_col = self._time_column or self._get_time_column()
            if time_col is None:
                return None

            time_diff = np.abs(self._data[time_col] - timestamp)
            closest_idx = time_diff.idxmin()
            row = self._data.iloc[closest_idx]

            # Collect all available vehicle data
            state = {"timestamp": float(row[time_col])}

            # Add all available signals
            for signal_name in self._signals.keys():
                if signal_name != "vehicle_pose":  # Handle pose separately
                    column_name = self._get_column_name(signal_name)
                    if column_name and column_name in row:
                        state[signal_name] = float(row[column_name])

            # Add collision margin
            collision_margin = self.get_collision_margin(timestamp)
            if collision_margin is not None:
                state["collision_margin"] = collision_margin

            return state

        except Exception as e:
            self.logger.error(f"Error getting vehicle state: {e}")
            return None
