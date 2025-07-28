"""
Collision Detection Plugin for the Debug Player Framework.
Provides real-time collision detection and safety margin analysis.
"""

import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import logging

from plugins.base_plugin import BasePlugin
from core.interfaces import SignalInfo, SignalType, ICollisionDetector


@dataclass
class CollisionEvent:
    """Collision event data structure."""

    timestamp: float
    severity: str  # 'warning', 'critical', 'violation'
    margin: float
    vehicle_speed: float
    distance_to_obstacle: float
    time_to_collision: float
    description: str


class CollisionDetectionPlugin(BasePlugin, ICollisionDetector):
    """
    Plugin for collision detection and safety analysis.
    Monitors vehicle state and detects potential collision scenarios.
    """

    def __init__(self, file_path: str, safety_threshold: float = 2.0):
        super().__init__(file_path)
        self.safety_threshold = safety_threshold  # meters
        self.warning_threshold = safety_threshold * 1.5
        self.critical_threshold = safety_threshold * 0.5
        self._version = "1.0.0"
        self._description = "Collision detection and safety analysis plugin"
        self.logger = logging.getLogger(__name__)

        # Detection parameters
        self.reaction_time = 1.5  # seconds
        self.deceleration_rate = 6.0  # m/s²

    def _initialize_signals(self) -> None:
        """Initialize collision detection signals."""
        if self._data is None:
            return

        # Define collision-related signals
        signal_definitions = {
            "collision_margin": SignalInfo(
                name="collision_margin",
                signal_type=SignalType.TEMPORAL,
                units="m",
                description="Distance margin to nearest obstacle",
                value_range=(0.0, 100.0),
                sampling_rate=10.0,
            ),
            "time_to_collision": SignalInfo(
                name="time_to_collision",
                signal_type=SignalType.TEMPORAL,
                units="s",
                description="Time to collision with nearest obstacle",
                value_range=(0.0, 10.0),
                sampling_rate=10.0,
            ),
            "collision_risk": SignalInfo(
                name="collision_risk",
                signal_type=SignalType.CATEGORICAL,
                units="level",
                description="Collision risk level (low, medium, high, critical)",
                sampling_rate=10.0,
            ),
            "safety_violation": SignalInfo(
                name="safety_violation",
                signal_type=SignalType.BOOLEAN,
                units="flag",
                description="Safety violation detected",
                sampling_rate=10.0,
            ),
        }

        # Register all collision signals
        for signal_name, signal_info in signal_definitions.items():
            self._signals[signal_name] = signal_info

    def detect_violations(self, vehicle_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Detect collision violations based on vehicle data.

        Args:
            vehicle_data: Dictionary containing vehicle state data

        Returns:
            List of violation events
        """
        violations = []

        try:
            speed = vehicle_data.get("vehicle_speed", 0.0)
            timestamp = vehicle_data.get("timestamp", 0.0)

            # Calculate collision margin
            margin = self.calculate_margin(vehicle_data)

            if margin is None:
                return violations

            # Calculate time to collision
            ttc = self._calculate_time_to_collision(speed, margin)

            # Determine violation severity
            severity = self._assess_collision_risk(margin, speed, ttc)

            if severity != "safe":
                violation = {
                    "timestamp": timestamp,
                    "severity": severity,
                    "margin": margin,
                    "time_to_collision": ttc,
                    "vehicle_speed": speed,
                    "description": self._generate_violation_description(
                        severity, margin, ttc
                    ),
                }
                violations.append(violation)

            return violations

        except Exception as e:
            self.logger.error(f"Error detecting violations: {e}")
            return []

    def calculate_margin(self, vehicle_data: Dict[str, Any]) -> Optional[float]:
        """
        Calculate collision margin based on vehicle state.

        Args:
            vehicle_data: Dictionary containing vehicle state data

        Returns:
            Collision margin in meters
        """
        try:
            speed = vehicle_data.get("vehicle_speed", 0.0)
            position_x = vehicle_data.get("position_x", 0.0)
            position_y = vehicle_data.get("position_y", 0.0)

            # In a real implementation, this would use actual obstacle data
            # For now, we'll simulate based on position and speed

            # Calculate stopping distance
            stopping_distance = self._calculate_stopping_distance(speed)

            # Simulate nearest obstacle distance
            # This is a simplified simulation - in reality, this would come from
            # perception systems, lidar, cameras, etc.
            obstacle_distance = self._simulate_nearest_obstacle_distance(
                position_x, position_y, speed
            )

            # Margin is the difference between available distance and required distance
            margin = obstacle_distance - stopping_distance

            return max(0.0, margin)

        except Exception as e:
            self.logger.error(f"Error calculating margin: {e}")
            return None

    def set_threshold(self, threshold: float) -> None:
        """Set collision detection threshold."""
        self.safety_threshold = threshold
        self.warning_threshold = threshold * 1.5
        self.critical_threshold = threshold * 0.5

    def _calculate_stopping_distance(self, speed: float) -> float:
        """Calculate required stopping distance."""
        if speed <= 0:
            return 0.0

        # Stopping distance = reaction distance + braking distance
        reaction_distance = speed * self.reaction_time
        braking_distance = (speed**2) / (2 * self.deceleration_rate)

        return reaction_distance + braking_distance

    def _simulate_nearest_obstacle_distance(
        self, x: float, y: float, speed: float
    ) -> float:
        """
        Simulate distance to nearest obstacle.
        In a real implementation, this would use actual sensor data.
        """
        # Simple simulation based on position and speed
        # This creates a realistic-looking but artificial obstacle pattern

        # Base distance that varies with position
        base_distance = 15.0 + 5.0 * np.sin(x * 0.1) + 3.0 * np.cos(y * 0.1)

        # Add speed-dependent component
        speed_factor = 1.0 + speed * 0.1

        # Add some randomness for realism
        noise = np.random.normal(0, 1.0)

        distance = base_distance * speed_factor + noise

        return max(5.0, distance)  # Minimum 5m distance

    def _calculate_time_to_collision(self, speed: float, margin: float) -> float:
        """Calculate time to collision."""
        if speed <= 0 or margin <= 0:
            return float("inf")

        return margin / speed

    def _assess_collision_risk(self, margin: float, speed: float, ttc: float) -> str:
        """Assess collision risk level."""
        if margin <= self.critical_threshold:
            return "critical"
        elif margin <= self.safety_threshold:
            return "violation"
        elif margin <= self.warning_threshold:
            return "warning"
        elif ttc < 3.0:  # Less than 3 seconds to collision
            return "warning"
        else:
            return "safe"

    def _generate_violation_description(
        self, severity: str, margin: float, ttc: float
    ) -> str:
        """Generate human-readable violation description."""
        descriptions = {
            "critical": f"Critical collision risk! Margin: {margin:.1f}m, TTC: {ttc:.1f}s",
            "violation": f"Safety violation detected. Margin: {margin:.1f}m, TTC: {ttc:.1f}s",
            "warning": f"Collision warning. Margin: {margin:.1f}m, TTC: {ttc:.1f}s",
        }

        return descriptions.get(severity, f"Unknown severity: {severity}")

    def get_data_for_timestamp(
        self, signal: str, timestamp: float
    ) -> Optional[Dict[str, Any]]:
        """Get collision data for a specific timestamp."""
        if not self._is_loaded:
            return None

        try:
            # Get vehicle state from base plugin
            vehicle_data = self._get_vehicle_state_at_timestamp(timestamp)
            if vehicle_data is None:
                return None

            if signal == "collision_margin":
                margin = self.calculate_margin(vehicle_data)
                return {"timestamp": timestamp, "value": margin, "units": "m"}

            elif signal == "time_to_collision":
                margin = self.calculate_margin(vehicle_data)
                speed = vehicle_data.get("vehicle_speed", 0.0)
                ttc = (
                    self._calculate_time_to_collision(speed, margin)
                    if margin
                    else float("inf")
                )
                return {"timestamp": timestamp, "value": ttc, "units": "s"}

            elif signal == "collision_risk":
                margin = self.calculate_margin(vehicle_data)
                speed = vehicle_data.get("vehicle_speed", 0.0)
                ttc = (
                    self._calculate_time_to_collision(speed, margin)
                    if margin
                    else float("inf")
                )
                risk_level = self._assess_collision_risk(margin, speed, ttc)
                return {"timestamp": timestamp, "value": risk_level, "units": "level"}

            elif signal == "safety_violation":
                violations = self.detect_violations(vehicle_data)
                return {
                    "timestamp": timestamp,
                    "value": len(violations) > 0,
                    "units": "flag",
                }

            return None

        except Exception as e:
            self.logger.error(f"Error getting collision data for {signal}: {e}")
            return None

    def _get_vehicle_state_at_timestamp(
        self, timestamp: float
    ) -> Optional[Dict[str, Any]]:
        """Get vehicle state data at a specific timestamp."""
        if self._data is None:
            return None

        try:
            # Find closest timestamp
            time_col = self._time_column or self._get_time_column()
            if time_col is None:
                return None

            time_diff = np.abs(self._data[time_col] - timestamp)
            closest_idx = time_diff.idxmin()
            row = self._data.iloc[closest_idx]

            # Extract vehicle state
            state = {
                "timestamp": float(row[time_col]),
                "vehicle_speed": float(row.get("vehicle_speed", row.get("speed", 0.0))),
                "position_x": float(row.get("position_x", row.get("x", 0.0))),
                "position_y": float(row.get("position_y", row.get("y", 0.0))),
                "acceleration": float(row.get("acceleration", 0.0)),
                "steering_angle": float(row.get("steering_angle", 0.0)),
            }

            return state

        except Exception as e:
            self.logger.error(f"Error getting vehicle state: {e}")
            return None

    def get_collision_events(
        self, start_time: float, end_time: float
    ) -> List[CollisionEvent]:
        """Get all collision events in a time range."""
        events = []

        if self._data is None:
            return events

        try:
            time_col = self._time_column or self._get_time_column()
            if time_col is None:
                return events

            # Filter data for time range
            mask = (self._data[time_col] >= start_time) & (
                self._data[time_col] <= end_time
            )
            filtered_data = self._data[mask]

            # Analyze each data point
            for _, row in filtered_data.iterrows():
                timestamp = float(row[time_col])

                # Get vehicle state
                vehicle_state = {
                    "timestamp": timestamp,
                    "vehicle_speed": float(
                        row.get("vehicle_speed", row.get("speed", 0.0))
                    ),
                    "position_x": float(row.get("position_x", row.get("x", 0.0))),
                    "position_y": float(row.get("position_y", row.get("y", 0.0))),
                }

                # Check for violations
                violations = self.detect_violations(vehicle_state)

                # Convert to CollisionEvent objects
                for violation in violations:
                    event = CollisionEvent(
                        timestamp=violation["timestamp"],
                        severity=violation["severity"],
                        margin=violation["margin"],
                        vehicle_speed=violation["vehicle_speed"],
                        distance_to_obstacle=violation["margin"]
                        + self._calculate_stopping_distance(violation["vehicle_speed"]),
                        time_to_collision=violation["time_to_collision"],
                        description=violation["description"],
                    )
                    events.append(event)

            return events

        except Exception as e:
            self.logger.error(f"Error getting collision events: {e}")
            return []
