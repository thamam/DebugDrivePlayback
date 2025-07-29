"""
Test data generator for the Debug Player Framework.
Generates realistic vehicle trajectory data for testing and demonstration.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Tuple, Optional
import logging


class VehicleDataGenerator:
    """
    Generates realistic vehicle trajectory data with various scenarios.
    Includes normal driving, emergency braking, and collision scenarios.
    """
    
    def __init__(self, 
                 duration: float = 60.0,
                 frequency: float = 10.0,
                 max_speed: float = 30.0,
                 scenario: str = "normal"):
        """
        Initialize the data generator.
        
        Args:
            duration: Duration of the simulation in seconds
            frequency: Data sampling frequency in Hz
            max_speed: Maximum vehicle speed in m/s
            scenario: Type of scenario ("normal", "emergency", "collision")
        """
        self.duration = duration
        self.frequency = frequency
        self.max_speed = max_speed
        self.scenario = scenario
        self.logger = logging.getLogger(__name__)
        
        # Time vector
        self.dt = 1.0 / frequency
        self.time = np.arange(0, duration, self.dt)
        self.n_points = len(self.time)
        
        # Vehicle parameters
        self.wheelbase = 2.5  # meters
        self.max_acceleration = 8.0  # m/s²
        self.max_deceleration = -10.0  # m/s²
        self.max_steering_angle = 0.5  # radians
        
    def generate_vehicle_data(self) -> pd.DataFrame:
        """
        Generate complete vehicle trajectory data.
        
        Returns:
            DataFrame with vehicle telemetry data
        """
        self.logger.info(f"Generating {self.scenario} scenario data for {self.duration}s")
        
        # Generate base trajectory
        if self.scenario == "normal":
            data = self._generate_normal_driving()
        elif self.scenario == "emergency":
            data = self._generate_emergency_braking()
        elif self.scenario == "collision":
            data = self._generate_collision_scenario()
        else:
            raise ValueError(f"Unknown scenario: {self.scenario}")
        
        # Add noise and realistic variations
        data = self._add_realistic_noise(data)
        
        # Calculate derived signals
        data = self._calculate_derived_signals(data)
        
        return data
    
    def _generate_normal_driving(self) -> pd.DataFrame:
        """Generate normal driving scenario."""
        data = pd.DataFrame()
        data['time'] = self.time
        
        # Speed profile: gradual acceleration, cruise, gentle deceleration
        speed_profile = np.zeros(self.n_points)
        
        # Acceleration phase (0-20% of time)
        accel_end = int(0.2 * self.n_points)
        speed_profile[:accel_end] = np.linspace(0, self.max_speed, accel_end)
        
        # Cruise phase (20-80% of time)
        cruise_start = accel_end
        cruise_end = int(0.8 * self.n_points)
        speed_profile[cruise_start:cruise_end] = self.max_speed
        
        # Deceleration phase (80-100% of time)
        decel_start = cruise_end
        speed_profile[decel_start:] = np.linspace(self.max_speed, 0, self.n_points - decel_start)
        
        data['vehicle_speed'] = speed_profile
        
        # Steering angle: gentle curves
        steering_frequency = 0.1  # Hz
        data['steering_angle'] = 0.1 * np.sin(2 * np.pi * steering_frequency * self.time)
        
        # Calculate position from speed and steering
        x, y, heading = self._integrate_motion(speed_profile, data['steering_angle'].values)
        data['position_x'] = x
        data['position_y'] = y
        data['heading'] = heading
        
        return data
    
    def _generate_emergency_braking(self) -> pd.DataFrame:
        """Generate emergency braking scenario."""
        data = pd.DataFrame()
        data['time'] = self.time
        
        # Speed profile: normal driving then emergency braking
        speed_profile = np.zeros(self.n_points)
        
        # Normal driving (0-60% of time)
        normal_end = int(0.6 * self.n_points)
        speed_profile[:normal_end] = self.max_speed
        
        # Emergency braking (60-100% of time)
        brake_start = normal_end
        brake_duration = self.n_points - brake_start
        
        # Exponential decay for emergency braking
        brake_time = np.arange(brake_duration) * self.dt
        speed_profile[brake_start:] = self.max_speed * np.exp(-3 * brake_time / brake_time[-1])
        
        data['vehicle_speed'] = speed_profile
        
        # Minimal steering during emergency braking
        data['steering_angle'] = 0.02 * np.sin(2 * np.pi * 0.5 * self.time)
        
        # Calculate position
        x, y, heading = self._integrate_motion(speed_profile, data['steering_angle'].values)
        data['position_x'] = x
        data['position_y'] = y
        data['heading'] = heading
        
        return data
    
    def _generate_collision_scenario(self) -> pd.DataFrame:
        """Generate collision scenario with safety violations."""
        data = pd.DataFrame()
        data['time'] = self.time
        
        # Speed profile: high speed with late braking
        speed_profile = np.zeros(self.n_points)
        
        # High speed phase (0-80% of time)
        high_speed_end = int(0.8 * self.n_points)
        speed_profile[:high_speed_end] = self.max_speed * 1.2  # 20% over normal
        
        # Late braking (80-100% of time)
        brake_start = high_speed_end
        brake_duration = self.n_points - brake_start
        
        # Insufficient braking
        brake_time = np.arange(brake_duration) * self.dt
        speed_profile[brake_start:] = (self.max_speed * 1.2 * 
                                      np.exp(-1.5 * brake_time / brake_time[-1]))
        
        data['vehicle_speed'] = speed_profile
        
        # Erratic steering during panic
        data['steering_angle'] = 0.3 * np.sin(2 * np.pi * 2.0 * self.time) * \
                                (self.time > 0.8 * self.duration)
        
        # Calculate position
        x, y, heading = self._integrate_motion(speed_profile, data['steering_angle'].values)
        data['position_x'] = x
        data['position_y'] = y
        data['heading'] = heading
        
        return data
    
    def _integrate_motion(self, speed: np.ndarray, steering: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Integrate vehicle motion using bicycle model.
        
        Args:
            speed: Vehicle speed array
            steering: Steering angle array
            
        Returns:
            Tuple of (x, y, heading) arrays
        """
        x = np.zeros(self.n_points)
        y = np.zeros(self.n_points)
        heading = np.zeros(self.n_points)
        
        for i in range(1, self.n_points):
            # Bicycle model kinematics
            beta = np.arctan(0.5 * np.tan(steering[i-1]))
            
            # Update heading
            heading[i] = heading[i-1] + speed[i-1] * np.sin(beta) * self.dt / self.wheelbase
            
            # Update position
            x[i] = x[i-1] + speed[i-1] * np.cos(heading[i-1] + beta) * self.dt
            y[i] = y[i-1] + speed[i-1] * np.sin(heading[i-1] + beta) * self.dt
        
        return x, y, heading
    
    def _add_realistic_noise(self, data: pd.DataFrame) -> pd.DataFrame:
        """Add realistic sensor noise to the data."""
        # Speed noise (GPS/wheel speed sensors)
        speed_noise = np.random.normal(0, 0.1, self.n_points)
        data['vehicle_speed'] = np.maximum(0, data['vehicle_speed'] + speed_noise)
        
        # Position noise (GPS)
        pos_noise = np.random.normal(0, 0.05, self.n_points)
        data['position_x'] += pos_noise
        data['position_y'] += pos_noise
        
        # Steering noise (sensor quantization)
        steering_noise = np.random.normal(0, 0.01, self.n_points)
        data['steering_angle'] += steering_noise
        
        # Heading noise (IMU/compass)
        heading_noise = np.random.normal(0, 0.02, self.n_points)
        data['heading'] += heading_noise
        
        return data
    
    def _calculate_derived_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """Calculate derived signals from basic measurements."""
        # Acceleration from speed
        data['acceleration'] = np.gradient(data['vehicle_speed'], self.dt)
        
        # Smooth acceleration
        window_size = max(1, int(0.5 * self.frequency))  # 0.5 second window
        data['acceleration'] = data['acceleration'].rolling(
            window=window_size, center=True, min_periods=1
        ).mean()
        
        # Throttle and brake positions (simplified)
        data['throttle'] = np.maximum(0, data['acceleration'] * 10)  # 0-100%
        data['brake'] = np.maximum(0, -data['acceleration'] * 10)  # 0-100%
        
        # Clip throttle and brake to realistic ranges
        data['throttle'] = np.clip(data['throttle'], 0, 100)
        data['brake'] = np.clip(data['brake'], 0, 100)
        
        # Add planned path (offset from actual path)
        data['planned_path_x'] = data['position_x'] + 0.1 * np.sin(0.1 * self.time)
        data['planned_path_y'] = data['position_y'] + 0.1 * np.cos(0.1 * self.time)
        
        return data
    
    def save_to_file(self, data: pd.DataFrame, filename: str) -> Path:
        """
        Save generated data to file.
        
        Args:
            data: DataFrame to save
            filename: Name of the output file
            
        Returns:
            Path to the saved file
        """
        file_path = Path(filename)
        
        if file_path.suffix.lower() == '.csv':
            data.to_csv(file_path, index=False)
        elif file_path.suffix.lower() == '.parquet':
            data.to_parquet(file_path, index=False)
        else:
            # Default to CSV
            file_path = file_path.with_suffix('.csv')
            data.to_csv(file_path, index=False)
        
        self.logger.info(f"Data saved to {file_path}")
        return file_path


def generate_test_datasets(output_dir: str = "test_data"):
    """
    Generate multiple test datasets for different scenarios.
    
    Args:
        output_dir: Directory to save test files
    """
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    scenarios = [
        ("normal", "normal_driving.csv"),
        ("emergency", "emergency_braking.csv"),
        ("collision", "collision_scenario.csv")
    ]
    
    for scenario, filename in scenarios:
        generator = VehicleDataGenerator(
            duration=60.0,
            frequency=10.0,
            max_speed=25.0,
            scenario=scenario
        )
        
        data = generator.generate_vehicle_data()
        output_file = output_path / filename
        generator.save_to_file(data, str(output_file))
        
        print(f"Generated {scenario} scenario: {output_file}")
        print(f"  Data points: {len(data)}")
        print(f"  Columns: {list(data.columns)}")
        print(f"  Speed range: {data['vehicle_speed'].min():.1f} - {data['vehicle_speed'].max():.1f} m/s")
        print()


if __name__ == "__main__":
    # Generate test datasets
    logging.basicConfig(level=logging.INFO)
    generate_test_datasets()
