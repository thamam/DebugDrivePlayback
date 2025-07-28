import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

/**
 * Python backend integration module
 * Handles communication with the Python backend for data processing
 * NO FALLBACK DEMO MODE - Real errors are exposed!
 */

export interface PythonBackendResponse {
  success: boolean;
  plugin_name?: string;
  time_range?: [number, number];
  signals?: Record<string, any>;
  data_points?: number;
  error?: string;
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

  async loadTrajectoryData(tripDataPath: string): Promise<TrajectoryData> {
    try {
      // Check if car_pose.csv exists
      const carPosePath = path.join(tripDataPath, 'car_pose.csv');
      const pathExists = await fs.access(carPosePath).then(() => true).catch(() => false);
      
      if (!pathExists) {
        return {
          success: false,
          error: `car_pose.csv not found in ${tripDataPath}`
        };
      }

      // Read and parse the CSV file
      const csvContent = await fs.readFile(carPosePath, 'utf8');
      const lines = csvContent.trim().split('\n');
      
      if (lines.length < 2) {
        return {
          success: false,
          error: 'car_pose.csv is empty or has no data rows'
        };
      }

      // Parse header to get column indices
      const header = lines[0].split(',');
      const timestampIdx = header.findIndex(h => h.includes('time'));
      const xIdx = header.findIndex(h => h.includes('x') && h.includes('meter'));
      const yIdx = header.findIndex(h => h.includes('y') && h.includes('meter'));
      const yawIdx = header.findIndex(h => h.includes('yaw'));

      if (timestampIdx === -1 || xIdx === -1 || yIdx === -1 || yawIdx === -1) {
        return {
          success: false,
          error: `Required columns not found in car_pose.csv. Found columns: ${header.join(', ')}`
        };
      }

      // Parse data rows
      const trajectory: any[] = [];
      let minTime = Infinity;
      let maxTime = -Infinity;

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        if (row.length >= header.length) {
          const timestamp = parseFloat(row[timestampIdx]);
          const x = parseFloat(row[xIdx]);
          const y = parseFloat(row[yIdx]);
          const yaw = parseFloat(row[yawIdx]);

          if (!isNaN(timestamp) && !isNaN(x) && !isNaN(y)) {
            trajectory.push({
              timestamp,
              x: isNaN(x) ? 0 : x,
              y: isNaN(y) ? 0 : y,
              yaw: isNaN(yaw) ? 0 : yaw,
              speed: 0, // Could be loaded from speed.csv if needed
              target_speed: 0
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
