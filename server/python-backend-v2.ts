/**
 * Enhanced Python Backend Integration with improved connection handling
 */

import { spawn, ChildProcess } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import fetch from 'node-fetch';

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

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'starting' | 'stopped';
  backend_type: 'python' | 'file' | 'demo';
  version?: string;
  uptime?: number;
  last_error?: string;
}

export class PythonBackendV2 {
  private pythonProcess: ChildProcess | null = null;
  private isRunning = false;
  private baseUrl = 'http://localhost:8000';
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private lastHealthCheck: HealthStatus = {
    status: 'stopped',
    backend_type: 'demo'
  };

  constructor() {
    this.startHealthMonitoring();
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Check if Python backend is healthy
   */
  async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        timeout: 3000
      });
      
      if (response.ok) {
        const data = await response.json() as any;
        this.lastHealthCheck = {
          status: 'healthy',
          backend_type: 'python',
          version: data.version,
          uptime: data.uptime
        };
        this.reconnectAttempts = 0;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('Python backend health check failed:', error);
      this.lastHealthCheck = {
        status: 'unhealthy',
        backend_type: 'demo',
        last_error: error instanceof Error ? error.message : String(error)
      };
      
      // Try to restart if not running
      if (!this.isRunning && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to restart Python backend (attempt ${this.reconnectAttempts})`);
        await this.startPythonBackend();
      }
    }
    
    return this.lastHealthCheck;
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus {
    return { ...this.lastHealthCheck };
  }

  /**
   * Start Python backend process
   */
  async startPythonBackend(): Promise<boolean> {
    if (this.isRunning) {
      return true;
    }

    try {
      this.lastHealthCheck = {
        status: 'starting',
        backend_type: 'python'
      };

      // Check if Python backend directory exists
      const pythonBackendPath = path.join(process.cwd(), 'python_backend');
      const mainPyPath = path.join(pythonBackendPath, 'main.py');
      
      try {
        await fs.access(mainPyPath);
      } catch {
        console.warn('Python backend not found at:', mainPyPath);
        this.lastHealthCheck = {
          status: 'stopped',
          backend_type: 'file',
          last_error: 'Python backend files not found'
        };
        return false;
      }

      // Start Python process
      console.log('Starting Python backend...');
      
      this.pythonProcess = spawn('python', ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'], {
        cwd: pythonBackendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONPATH: pythonBackendPath
        }
      });

      // Handle process events
      this.pythonProcess.stdout?.on('data', (data) => {
        console.log('Python backend:', data.toString().trim());
      });

      this.pythonProcess.stderr?.on('data', (data) => {
        const message = data.toString().trim();
        if (!message.includes('INFO') && !message.includes('Started server')) {
          console.error('Python backend error:', message);
        }
      });

      this.pythonProcess.on('close', (code) => {
        console.log(`Python backend exited with code ${code}`);
        this.isRunning = false;
        this.pythonProcess = null;
        this.lastHealthCheck = {
          status: 'stopped',
          backend_type: 'demo',
          last_error: `Process exited with code ${code}`
        };
      });

      this.pythonProcess.on('error', (error) => {
        console.error('Python backend process error:', error);
        this.isRunning = false;
        this.lastHealthCheck = {
          status: 'stopped',
          backend_type: 'demo',
          last_error: error.message
        };
      });

      this.isRunning = true;

      // Wait for server to be ready
      await this.waitForBackend();
      
      return this.lastHealthCheck.status === 'healthy';
    } catch (error) {
      console.error('Failed to start Python backend:', error);
      this.lastHealthCheck = {
        status: 'stopped',
        backend_type: 'demo',
        last_error: error instanceof Error ? error.message : String(error)
      };
      return false;
    }
  }

  /**
   * Wait for backend to be ready
   */
  private async waitForBackend(maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${this.baseUrl}/health`, {
          timeout: 1000
        });
        
        if (response.ok) {
          console.log('Python backend is ready');
          return;
        }
      } catch {
        // Continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Python backend failed to start within timeout');
  }

  /**
   * Load data from path
   */
  async loadData(filePath: string, pluginType: string = 'vehicle_data'): Promise<PythonBackendResponse> {
    if (this.lastHealthCheck.status !== 'healthy') {
      // Try direct file loading
      return this.loadDataFromFiles(filePath);
    }

    try {
      const response = await fetch(`${this.baseUrl}/load-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_path: filePath,
          plugin_type: pluginType
        }),
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as any;
      return {
        success: true,
        plugin_name: data.plugin_name,
        time_range: data.time_range,
        signals: data.signals,
        data_points: data.data_points
      };
    } catch (error) {
      console.error('Python backend load-data failed:', error);
      return this.loadDataFromFiles(filePath);
    }
  }

  /**
   * Fallback: Load data directly from CSV files
   */
  private async loadDataFromFiles(tripPath: string): Promise<PythonBackendResponse> {
    try {
      const fullPath = path.resolve(tripPath);
      const stats = await fs.stat(fullPath);
      
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }

      const files = await fs.readdir(fullPath);
      const csvFiles = files.filter(f => f.endsWith('.csv'));
      
      if (csvFiles.length === 0) {
        throw new Error('No CSV files found in directory');
      }

      // Load trip info if available
      let tripInfo: any = {};
      try {
        const tripInfoPath = path.join(fullPath, 'trip_info.json');
        const tripInfoContent = await fs.readFile(tripInfoPath, 'utf-8');
        tripInfo = JSON.parse(tripInfoContent);
      } catch {
        // Trip info not available, continue without it
      }

      // Read first few lines of each CSV to understand structure
      const signals: Record<string, any> = {};
      let dataPoints = 0;
      let timeRange: [number, number] = [0, 0];

      for (const csvFile of csvFiles.slice(0, 10)) { // Limit to first 10 files
        try {
          const csvPath = path.join(fullPath, csvFile);
          const content = await fs.readFile(csvPath, 'utf-8');
          const lines = content.split('\n').filter(line => line.trim());
          
          if (lines.length > 1) {
            const signalName = csvFile.replace('.csv', '');
            signals[signalName] = {
              name: signalName,
              type: 'numeric',
              units: this.getSignalUnits(signalName),
              description: `Signal from ${csvFile}`
            };
            
            // Get time range from first and last data points
            const firstLine = lines[1].split(',');
            const lastLine = lines[lines.length - 1].split(',');
            
            if (firstLine.length >= 2 && lastLine.length >= 2) {
              const startTime = parseFloat(firstLine[0]);
              const endTime = parseFloat(lastLine[0]);
              
              if (!isNaN(startTime) && !isNaN(endTime)) {
                timeRange = [
                  Math.min(timeRange[0] || startTime, startTime),
                  Math.max(timeRange[1] || endTime, endTime)
                ];
                dataPoints = Math.max(dataPoints, lines.length - 1);
              }
            }
          }
        } catch (error) {
          console.warn(`Error reading ${csvFile}:`, error);
        }
      }

      return {
        success: true,
        plugin_name: 'File System Loader',
        time_range: timeRange,
        signals,
        data_points: dataPoints,
        isDemoMode: false
      };
    } catch (error) {
      console.error('File loading failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        isDemoMode: true
      };
    }
  }

  /**
   * Get signal units based on signal name
   */
  private getSignalUnits(signalName: string): string {
    const unitMap: Record<string, string> = {
      'vehicle_speed': 'km/h',
      'wheel_speed_fl': 'rpm',
      'wheel_speed_fr': 'rpm',
      'wheel_speed_rl': 'rpm',
      'wheel_speed_rr': 'rpm',
      'throttle_pedal': '%',
      'brake_pedal': '%',
      'steering_wheel_angle': 'degrees',
      'gps_latitude': 'degrees',
      'gps_longitude': 'degrees',
      'acceleration': 'm/s²',
      'yaw_rate': 'degrees/s'
    };
    
    return unitMap[signalName] || 'unknown';
  }

  /**
   * Get trajectory data
   */
  async getTrajectory(sessionId: string): Promise<TrajectoryData> {
    if (this.lastHealthCheck.status !== 'healthy') {
      return {
        success: false,
        error: 'Python backend not available'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/trajectory/${sessionId}`, {
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json() as TrajectoryData;
    } catch (error) {
      console.error('Trajectory request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Stop Python backend
   */
  async stopPythonBackend(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.pythonProcess) {
      this.pythonProcess.kill('SIGTERM');
      this.pythonProcess = null;
    }
    
    this.isRunning = false;
    this.lastHealthCheck = {
      status: 'stopped',
      backend_type: 'demo'
    };
  }

  /**
   * Force restart backend
   */
  async restartBackend(): Promise<boolean> {
    await this.stopPythonBackend();
    this.reconnectAttempts = 0;
    return await this.startPythonBackend();
  }
}

// Singleton instance
export const pythonBackendV2 = new PythonBackendV2();