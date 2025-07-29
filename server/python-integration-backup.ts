import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

/**
 * Python backend integration module
 * Handles communication with the Python backend for data processing
 */

export interface PythonBackendResponse {
  success: boolean;
  plugin_name?: string;
  time_range?: [number, number];
  signals?: Record<string, any>;
  data_points?: number;
  error?: string;
  availableTrips?: string[];
  isDemoMode?: boolean;
}

export interface TrajectoryData {
  success: boolean;
  trajectory?: Array<{
    timestamp: number;
    x: number;
    y: number;
    yaw: number;
    speed: number;
    target_speed: number;
    turn_signal?: string;
    intent?: string;
  }>;
  planned_paths?: Record<string, Array<{x: number, y: number}>>;
  time_range?: [number, number];
  total_points?: number;
  error?: string;
}

export interface SignalData {
  timestamp: number;
  value: number | string | boolean;
  units: string;
  signal_type?: string;
}

export class PythonBackendIntegration {
  private pythonProcess: any = null;
  private isRunning = false;
  
  async startPythonBackend(): Promise<boolean> {
    try {
      // Try to start the Python backend process
      this.pythonProcess = spawn('python', [
        path.join(__dirname, '..', 'python_backend', 'run_server.py')
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.join(__dirname, '..', 'python_backend')
      });

      // Handle process events
      this.pythonProcess.on('error', (error: Error) => {
        console.error('Python backend error:', error);
        this.isRunning = false;
      });

      this.pythonProcess.on('exit', (code: number) => {
        console.log('Python backend exited with code:', code);
        this.isRunning = false;
      });

      // Wait a bit for the process to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test if the backend is responding
      const isHealthy = await this.checkHealth();
      this.isRunning = isHealthy;
      
      return isHealthy;
    } catch (error) {
      console.error('Failed to start Python backend:', error);
      return false;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:8000/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async loadTripData(filePath: string, pluginType: string = 'vehicle_data'): Promise<PythonBackendResponse> {
    // Check if Python backend is available
    const isHealthy = await this.checkHealth();
    
    if (!isHealthy) {
      return {
        success: false,
        error: 'Python backend is not running or not healthy. Please start the Python backend first.'
      };
    }
    
    try {
      const response = await fetch('http://localhost:8000/load-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: filePath,
          plugin_type: pluginType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Python backend error:', error);
        return {
          success: false,
          error: `Python backend error: ${error.error || error.detail || 'Unknown error'}`
        };
      }
      
      const result = await response.json();
      return { success: true, ...result };
      
    } catch (error: any) {
      console.error('Python backend connection error:', error.message);
      return {
        success: false,
        error: `Failed to connect to Python backend: ${error.message}`
      };
    }
  }


  private generateSignalDefinitions(pluginType: string): Record<string, any> {
    const baseSignals = {
      vehicle_data: {
        'front_left_wheel_speed': {
          name: 'front_left_wheel_speed',
          type: 'temporal',
          units: 'km/h',
          description: 'Front left wheel speed'
        },
        'front_right_wheel_speed': {
          name: 'front_right_wheel_speed',
          type: 'temporal',
          units: 'km/h',
          description: 'Front right wheel speed'
        },
        'rear_left_wheel_speed': {
          name: 'rear_left_wheel_speed',
          type: 'temporal',
          units: 'km/h',
          description: 'Rear left wheel speed'
        },
        'rear_right_wheel_speed': {
          name: 'rear_right_wheel_speed',
          type: 'temporal',
          units: 'km/h',
          description: 'Rear right wheel speed'
        },
        'throttle': {
          name: 'throttle',
          type: 'temporal',
          units: 'percent',
          description: 'Throttle position'
        },
        'brake': {
          name: 'brake',
          type: 'temporal',
          units: 'percent',
          description: 'Brake pressure'
        },
        'w_car_pose_now_x_': {
          name: 'w_car_pose_now_x_',
          type: 'spatial',
          units: 'm',
          description: 'Actual vehicle X position'
        },
        'w_car_pose_now_y': {
          name: 'w_car_pose_now_y',
          type: 'spatial',
          units: 'm',
          description: 'Actual vehicle Y position'
        },
        'w_car_pose_now_yaw_rad': {
          name: 'w_car_pose_now_yaw_rad',
          type: 'temporal',
          units: 'radians',
          description: 'Vehicle yaw angle'
        },
        'current_speed_mps': {
          name: 'current_speed_mps',
          type: 'temporal',
          units: 'm/s',
          description: 'Current vehicle speed'
        },
        'target_speed_mps': {
          name: 'target_speed_mps',
          type: 'temporal',
          units: 'm/s',
          description: 'Target vehicle speed'
        },
        'path_trajectory': {
          name: 'path_trajectory',
          type: 'spatial',
          units: 'm',
          description: 'Vehicle trajectory path with planned points'
        },
        'driving_mode': {
          name: 'driving_mode',
          type: 'temporal',
          units: 'enum',
          description: 'Current driving mode'
        },
        'turn_indicator': {
          name: 'turn_indicator',
          type: 'temporal',
          units: 'enum',
          description: 'Turn indicator state'
        },
        'gps': {
          name: 'gps',
          type: 'spatial',
          units: 'degrees',
          description: 'GPS coordinates'
        }
      },
      collision_detection: {
        'collision_margin': {
          name: 'collision_margin',
          type: 'temporal',
          units: 'm',
          description: 'Distance to nearest obstacle'
        },
        'safety_score': {
          name: 'safety_score',
          type: 'temporal',
          units: 'score',
          description: 'Safety assessment score'
        },
        'alert_level': {
          name: 'alert_level',
          type: 'categorical',
          units: 'level',
          description: 'Alert level (low, medium, high)'
        }
      }
    };

    return baseSignals[pluginType as keyof typeof baseSignals] || baseSignals.vehicle_data;
  }

  async getSignalData(signal: string, timestamp: number): Promise<SignalData | null> {
    const isHealthy = await this.checkHealth();
    
    if (isHealthy) {
      try {
        const response = await fetch('http://localhost:8000/data/timestamp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp,
            signals: [signal],
          }),
        });

        if (!response.ok) {
          return null;
        }

        const result = await response.json();
        return result[signal] || null;
      } catch (error) {
        return null;
      }
    }

    // Generate synthetic data for demonstration
    return this.generateSyntheticSignalData(signal, timestamp);
  }

  private generateSyntheticSignalData(signal: string, timestamp: number): SignalData {
    const baseValue = Math.sin(timestamp / 10) * 10;
    const noise = (Math.random() - 0.5) * 2;
    
    const signalMappings: Record<string, any> = {
      'vehicle_speed': { value: Math.max(0, 25 + baseValue + noise), units: 'm/s' },
      'steering_angle': { value: baseValue * 3 + noise, units: 'degrees' },
      'position_x': { value: timestamp * 15 + baseValue, units: 'm' },
      'position_y': { value: Math.sin(timestamp / 20) * 50 + noise, units: 'm' },
      'acceleration': { value: baseValue / 5 + noise, units: 'm/s²' },
      'collision_margin': { value: Math.max(0.5, 5 + baseValue + noise), units: 'm' },
      'safety_score': { value: Math.max(0, Math.min(1, 0.8 + baseValue/50)), units: 'score' }
    };

    const config = signalMappings[signal] || { value: baseValue, units: 'unknown' };
    
    return {
      timestamp,
      value: config.value,
      units: config.units,
      signal_type: 'temporal'
    };
  }

  async loadTrajectoryData(tripDataPath: string): Promise<TrajectoryData> {
    try {
      // Try to load from Python backend first
      const isHealthy = await this.checkHealth();
      
      if (isHealthy) {
        try {
          const response = await fetch('http://localhost:8000/trajectory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              trip_path: tripDataPath
            }),
          });

          if (response.ok) {
            const result = await response.json();
            return { success: true, ...result };
          }
        } catch (error) {
          console.log('Python backend trajectory error, using CSV fallback');
        }
      }

      // Fallback: Load trajectory data directly from CSV
      return await this.loadTrajectoryFromCSV(tripDataPath);
      
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to load trajectory data: ${error.message}`
      };
    }
  }

  async loadTrajectoryFromCSV(tripDataPath: string): Promise<TrajectoryData> {
    try {
      const trajectoryFile = path.join(tripDataPath, 'path_trajectory.csv');
      
      // Check if trajectory file exists
      const fileExists = await fs.access(trajectoryFile).then(() => true).catch(() => false);
      
      if (!fileExists) {
        return {
          success: false,
          error: `Trajectory file not found: ${trajectoryFile}`
        };
      }

      // Read and parse CSV data
      const csvContent = await fs.readFile(trajectoryFile, 'utf8');
      const lines = csvContent.split('\n');
      const header = lines[0].split(',');
      
      // Find column indices
      const timestampIdx = header.indexOf('data_timestamp_sec');
      const xIdx = header.indexOf('w_car_pose_now_x_');
      const yIdx = header.indexOf('w_car_pose_now_y');
      const yawIdx = header.indexOf('w_car_pose_now_yaw_rad');
      const speedIdx = header.indexOf('current_speed_mps');
      const targetSpeedIdx = header.indexOf('target_speed_mps');
      const turnSignalIdx = header.indexOf('turn_signal_state');
      const intentIdx = header.indexOf('intent');

      const trajectory = [];
      let minTime = Infinity;
      let maxTime = -Infinity;

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        
        if (row.length >= Math.max(timestampIdx, xIdx, yIdx, yawIdx, speedIdx) + 1) {
          const timestamp = parseFloat(row[timestampIdx]);
          const x = parseFloat(row[xIdx]);
          const y = parseFloat(row[yIdx]);
          const yaw = parseFloat(row[yawIdx]);
          const speed = parseFloat(row[speedIdx]);
          const targetSpeed = parseFloat(row[targetSpeedIdx] || '0');
          
          if (!isNaN(timestamp) && !isNaN(x) && !isNaN(y)) {
            trajectory.push({
              timestamp,
              x,
              y,
              yaw: isNaN(yaw) ? 0 : yaw,
              speed: isNaN(speed) ? 0 : speed,
              target_speed: isNaN(targetSpeed) ? speed : targetSpeed,
              turn_signal: turnSignalIdx >= 0 ? row[turnSignalIdx] : '',
              intent: intentIdx >= 0 ? row[intentIdx] : ''
            });
            
            minTime = Math.min(minTime, timestamp);
            maxTime = Math.max(maxTime, timestamp);
          }
        }
      }

      return {
        success: true,
        trajectory,
        time_range: [minTime, maxTime],
        total_points: trajectory.length
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to parse trajectory CSV: ${error.message}`
      };
    }
  }

  async shutdown(): Promise<void> {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
    this.isRunning = false;
  }
}

// Export singleton instance
export const pythonBackend = new PythonBackendIntegration();
