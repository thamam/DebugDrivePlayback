"""
Trajectory Analysis Plugin for Real Vehicle Data
Processes actual vehicle trajectory data from path_trajectory.csv
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging
from pathlib import Path

class TrajectoryAnalyzer:
    """
    Analyzes real vehicle trajectory data from path_trajectory.csv
    
    Data Structure:
    - w_car_pose_now_x_, w_car_pose_now_y: Actual vehicle position
    - w_car_pose_now_yaw_rad: Vehicle orientation
    - path_x_0 to path_x_299, path_y_0 to path_y_299: Planned path points
    - current_speed_mps, target_speed_mps: Speed information
    - turn_signal_state, intent: Vehicle state
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.trajectory_data = None
        self.path_points = None
        self.vehicle_poses = None
        
    def load_trajectory_data(self, file_path: str) -> bool:
        """
        Load real trajectory data from path_trajectory.csv
        
        Args:
            file_path: Path to the trip data directory
            
        Returns:
            True if successful, False otherwise
        """
        try:
            trajectory_file = Path(file_path) / "path_trajectory.csv"
            
            if not trajectory_file.exists():
                self.logger.error(f"Trajectory file not found: {trajectory_file}")
                return False
                
            # Load the CSV data
            self.trajectory_data = pd.read_csv(trajectory_file)
            
            # Extract vehicle pose data
            self.vehicle_poses = self.trajectory_data[[
                'data_timestamp_sec',
                'w_car_pose_now_x_',
                'w_car_pose_now_y',
                'w_car_pose_now_yaw_rad',
                'current_speed_mps',
                'target_speed_mps',
                'turn_signal_state',
                'intent'
            ]].copy()
            
            # Extract path planning data
            self._extract_path_points()
            
            self.logger.info(f"Loaded trajectory data: {len(self.trajectory_data)} data points")
            return True
            
        except Exception as e:
            self.logger.error(f"Error loading trajectory data: {e}")
            return False
    
    def _extract_path_points(self):
        """Extract planned path points from trajectory data"""
        try:
            # Get all path_x and path_y columns
            path_x_cols = [col for col in self.trajectory_data.columns if col.startswith('path_x_')]
            path_y_cols = [col for col in self.trajectory_data.columns if col.startswith('path_y_')]
            
            # Sort by index number
            path_x_cols.sort(key=lambda x: int(x.split('_')[2]))
            path_y_cols.sort(key=lambda x: int(x.split('_')[2]))
            
            self.path_points = {
                'x_columns': path_x_cols,
                'y_columns': path_y_cols,
                'num_points': len(path_x_cols)
            }
            
            self.logger.info(f"Extracted {len(path_x_cols)} path planning points")
            
        except Exception as e:
            self.logger.error(f"Error extracting path points: {e}")
            self.path_points = None
    
    def get_vehicle_trajectory(self) -> List[Dict]:
        """
        Get the actual vehicle trajectory (where the car actually went)
        
        Returns:
            List of trajectory points with position, orientation, and speed
        """
        if self.vehicle_poses is None:
            return []
            
        try:
            trajectory = []
            
            for _, row in self.vehicle_poses.iterrows():
                if pd.notna(row['w_car_pose_now_x_']) and pd.notna(row['w_car_pose_now_y']):
                    trajectory.append({
                        'timestamp': row['data_timestamp_sec'],
                        'x': float(row['w_car_pose_now_x_']),
                        'y': float(row['w_car_pose_now_y']),
                        'yaw': float(row['w_car_pose_now_yaw_rad']),
                        'speed': float(row['current_speed_mps']),
                        'target_speed': float(row['target_speed_mps']),
                        'turn_signal': row['turn_signal_state'],
                        'intent': row['intent']
                    })
            
            return trajectory
            
        except Exception as e:
            self.logger.error(f"Error getting vehicle trajectory: {e}")
            return []
    
    def get_planned_path(self, timestamp: float) -> List[Dict]:
        """
        Get the planned path at a specific timestamp
        
        Args:
            timestamp: Timestamp to get planned path for
            
        Returns:
            List of planned path points
        """
        if self.trajectory_data is None or self.path_points is None:
            return []
            
        try:
            # Find the closest timestamp
            row_idx = (self.trajectory_data['data_timestamp_sec'] - timestamp).abs().idxmin()
            row = self.trajectory_data.iloc[row_idx]
            
            planned_path = []
            
            for i in range(self.path_points['num_points']):
                x_col = f'path_x_{i}'
                y_col = f'path_y_{i}'
                
                if x_col in row and y_col in row:
                    x_val = row[x_col]
                    y_val = row[y_col]
                    
                    if pd.notna(x_val) and pd.notna(y_val):
                        planned_path.append({
                            'index': i,
                            'x': float(x_val),
                            'y': float(y_val)
                        })
            
            return planned_path
            
        except Exception as e:
            self.logger.error(f"Error getting planned path: {e}")
            return []
    
    def analyze_trajectory_deviation(self) -> Dict:
        """
        Analyze how much the actual trajectory deviated from planned paths
        
        Returns:
            Analysis results including deviation statistics
        """
        if self.trajectory_data is None:
            return {}
            
        try:
            results = {
                'max_deviation': 0,
                'mean_deviation': 0,
                'deviation_points': [],
                'analysis_summary': {}
            }
            
            vehicle_traj = self.get_vehicle_trajectory()
            
            for i, point in enumerate(vehicle_traj[::10]):  # Sample every 10th point
                timestamp = point['timestamp']
                actual_x, actual_y = point['x'], point['y']
                
                planned_path = self.get_planned_path(timestamp)
                
                if planned_path:
                    # Find closest planned point
                    min_distance = float('inf')
                    
                    for planned_point in planned_path:
                        distance = np.sqrt(
                            (actual_x - planned_point['x'])**2 + 
                            (actual_y - planned_point['y'])**2
                        )
                        min_distance = min(min_distance, distance)
                    
                    results['deviation_points'].append({
                        'timestamp': timestamp,
                        'deviation': min_distance,
                        'actual_x': actual_x,
                        'actual_y': actual_y
                    })
            
            if results['deviation_points']:
                deviations = [p['deviation'] for p in results['deviation_points']]
                results['max_deviation'] = max(deviations)
                results['mean_deviation'] = np.mean(deviations)
                
                results['analysis_summary'] = {
                    'total_points': len(vehicle_traj),
                    'analyzed_points': len(results['deviation_points']),
                    'max_deviation_m': results['max_deviation'],
                    'mean_deviation_m': results['mean_deviation'],
                    'path_following_quality': 'good' if results['mean_deviation'] < 2.0 else 'needs_attention'
                }
            
            return results
            
        except Exception as e:
            self.logger.error(f"Error analyzing trajectory deviation: {e}")
            return {}
    
    def get_trajectory_statistics(self) -> Dict:
        """
        Get comprehensive statistics about the trajectory
        
        Returns:
            Dictionary containing trajectory statistics
        """
        if self.vehicle_poses is None:
            return {}
            
        try:
            stats = {}
            
            # Basic trajectory info
            stats['total_points'] = len(self.vehicle_poses)
            stats['duration_seconds'] = (
                self.vehicle_poses['data_timestamp_sec'].max() - 
                self.vehicle_poses['data_timestamp_sec'].min()
            )
            
            # Speed statistics
            speeds = self.vehicle_poses['current_speed_mps'].dropna()
            if len(speeds) > 0:
                stats['speed_stats'] = {
                    'max_speed_mps': speeds.max(),
                    'min_speed_mps': speeds.min(),
                    'mean_speed_mps': speeds.mean(),
                    'max_speed_kmh': speeds.max() * 3.6,
                    'mean_speed_kmh': speeds.mean() * 3.6
                }
            
            # Position range
            x_positions = self.vehicle_poses['w_car_pose_now_x_'].dropna()
            y_positions = self.vehicle_poses['w_car_pose_now_y'].dropna()
            
            if len(x_positions) > 0 and len(y_positions) > 0:
                stats['position_range'] = {
                    'x_min': x_positions.min(),
                    'x_max': x_positions.max(),
                    'y_min': y_positions.min(),
                    'y_max': y_positions.max(),
                    'x_range': x_positions.max() - x_positions.min(),
                    'y_range': y_positions.max() - y_positions.min()
                }
            
            # Turn signal analysis
            turn_signals = self.vehicle_poses['turn_signal_state'].value_counts()
            stats['turn_signal_distribution'] = turn_signals.to_dict()
            
            return stats
            
        except Exception as e:
            self.logger.error(f"Error getting trajectory statistics: {e}")
            return {}