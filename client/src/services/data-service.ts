/**
 * Centralized Data Service
 * Handles all data operations with proper abstraction between real and demo data
 */

import { queryClient } from '@/lib/queryClient';

export interface DataSource {
  type: 'real' | 'demo' | 'file';
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastError?: string;
}

export interface SessionData {
  id: string;
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  signals: string[];
  dataPoints: number;
  source: DataSource;
}

export interface SignalData {
  timestamp: number;
  value: number | string | boolean;
  signal: string;
}

export interface VehicleData {
  timestamp: number;
  vehicleSpeed: number;
  acceleration: number;
  steeringAngle: number;
  position: { x: number; y: number };
  collisionMargin: number;
}

class DataService {
  private dataSource: DataSource = {
    type: 'demo',
    connectionStatus: 'disconnected'
  };
  
  private pythonBackendUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
  private apiBaseUrl = '/api';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.checkPythonBackend();
  }

  /**
   * Check Python backend availability with retry logic
   */
  private async checkPythonBackend(): Promise<void> {
    this.dataSource.connectionStatus = 'connecting';
    
    try {
      const response = await fetch(`${this.pythonBackendUrl}/health`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        this.dataSource = {
          type: 'real',
          connectionStatus: 'connected'
        };
        this.reconnectAttempts = 0;
        console.log('Connected to Python backend');
      } else {
        throw new Error(`Backend returned ${response.status}`);
      }
    } catch (error) {
      this.handleBackendError(error);
    }
  }

  private handleBackendError(error: any): void {
    console.warn('Python backend not available:', error);
    this.dataSource = {
      type: 'demo',
      connectionStatus: 'error',
      lastError: error?.message || 'Connection failed'
    };

    // Retry with exponential backoff
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      setTimeout(() => this.checkPythonBackend(), delay);
    }
  }

  /**
   * Get current data source status
   */
  getDataSource(): DataSource {
    return { ...this.dataSource };
  }

  /**
   * Load session data from file or backend
   */
  async loadSession(pathOrId: string): Promise<SessionData> {
    // Try real backend first
    if (this.dataSource.type === 'real' && this.dataSource.connectionStatus === 'connected') {
      try {
        const response = await fetch(`${this.apiBaseUrl}/sessions/load`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: pathOrId })
        });

        if (response.ok) {
          const data = await response.json();
          return this.transformSessionData(data, 'real');
        }
      } catch (error) {
        console.error('Failed to load from backend:', error);
      }
    }

    // Try loading from CSV files
    try {
      const csvData = await this.loadCSVData(pathOrId);
      if (csvData) {
        return csvData;
      }
    } catch (error) {
      console.error('Failed to load CSV data:', error);
    }

    // Fallback to demo data
    return this.generateDemoSession(pathOrId);
  }

  /**
   * Load data from CSV files directly
   */
  private async loadCSVData(path: string): Promise<SessionData | null> {
    try {
      // Check if path exists
      const response = await fetch(`${this.apiBaseUrl}/files/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });

      if (!response.ok) {
        return null;
      }

      const files = await response.json();
      const csvFiles = files.filter((f: string) => f.endsWith('.csv'));
      
      if (csvFiles.length === 0) {
        return null;
      }

      // Load trip info if available
      const tripInfoResponse = await fetch(`${this.apiBaseUrl}/files/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `${path}/trip_info.json` })
      });

      let tripInfo: any = {};
      if (tripInfoResponse.ok) {
        tripInfo = await tripInfoResponse.json();
      }

      // Calculate session data from files
      const sessionData: SessionData = {
        id: `file-${Date.now()}`,
        name: path.split('/').pop() || 'Unknown Trip',
        duration: tripInfo.duration || 0,
        startTime: tripInfo.start_time || Date.now(),
        endTime: tripInfo.end_time || Date.now(),
        signals: csvFiles.map((f: string) => f.replace('.csv', '')),
        dataPoints: 0,
        source: {
          type: 'file',
          connectionStatus: 'connected'
        }
      };

      return sessionData;
    } catch (error) {
      console.error('Error loading CSV data:', error);
      return null;
    }
  }

  /**
   * Get vehicle data for a specific timestamp
   */
  async getVehicleData(sessionId: string, timestamp: number): Promise<VehicleData | null> {
    if (this.dataSource.type === 'real' && this.dataSource.connectionStatus === 'connected') {
      try {
        const response = await fetch(`${this.apiBaseUrl}/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            timestamp,
            signals: ['vehicle_speed', 'acceleration', 'steering_wheel_angle', 'gps_latitude', 'gps_longitude']
          })
        });

        if (response.ok) {
          const data = await response.json();
          return this.transformVehicleData(data, timestamp);
        }
      } catch (error) {
        console.error('Failed to get vehicle data:', error);
      }
    }

    // Fallback to demo data
    return this.generateDemoVehicleData(timestamp);
  }

  /**
   * Get signal data for a time range
   */
  async getSignalData(
    sessionId: string,
    signals: string[],
    startTime: number,
    endTime: number,
    interval: number = 0.1
  ): Promise<SignalData[]> {
    if (this.dataSource.type === 'real' && this.dataSource.connectionStatus === 'connected') {
      try {
        const response = await fetch(`${this.apiBaseUrl}/data-range`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            signals,
            startTime,
            endTime,
            interval
          })
        });

        if (response.ok) {
          const data = await response.json();
          return this.transformSignalData(data);
        }
      } catch (error) {
        console.error('Failed to get signal data:', error);
      }
    }

    // Fallback to demo data
    return this.generateDemoSignalData(signals, startTime, endTime, interval);
  }

  /**
   * Get available signals for a session
   */
  async getAvailableSignals(sessionId: string): Promise<string[]> {
    if (this.dataSource.type === 'real' && this.dataSource.connectionStatus === 'connected') {
      try {
        const response = await fetch(`${this.apiBaseUrl}/signals?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          return Object.keys(data);
        }
      } catch (error) {
        console.error('Failed to get signals:', error);
      }
    }

    // Return demo signals
    return [
      'vehicle_speed',
      'acceleration',
      'steering_wheel_angle',
      'brake_pedal',
      'throttle_pedal',
      'gps_latitude',
      'gps_longitude',
      'wheel_speed_fl',
      'wheel_speed_fr',
      'wheel_speed_rl',
      'wheel_speed_rr'
    ];
  }

  /**
   * Stream real-time data updates
   */
  subscribeToUpdates(
    sessionId: string,
    callback: (data: VehicleData) => void
  ): () => void {
    let intervalId: NodeJS.Timeout | null = null;
    let currentTime = 0;

    if (this.dataSource.type === 'real' && this.dataSource.connectionStatus === 'connected') {
      // TODO: Implement WebSocket connection for real-time updates
      console.log('Real-time updates not yet implemented for real backend');
    }

    // For now, simulate updates with demo data
    intervalId = setInterval(async () => {
      const data = await this.getVehicleData(sessionId, currentTime);
      if (data) {
        callback(data);
      }
      currentTime += 0.1;
    }, 100);

    // Return cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }

  // Transform methods
  private transformSessionData(data: any, source: 'real' | 'file'): SessionData {
    return {
      id: data.id || `session-${Date.now()}`,
      name: data.name || 'Unknown Session',
      duration: data.duration || 0,
      startTime: data.start_time || Date.now(),
      endTime: data.end_time || Date.now(),
      signals: data.signals || [],
      dataPoints: data.data_points || 0,
      source: {
        type: source,
        connectionStatus: 'connected'
      }
    };
  }

  private transformVehicleData(data: any, timestamp: number): VehicleData {
    return {
      timestamp,
      vehicleSpeed: data.vehicle_speed || 0,
      acceleration: data.acceleration || 0,
      steeringAngle: data.steering_wheel_angle || 0,
      position: {
        x: data.gps_longitude || 0,
        y: data.gps_latitude || 0
      },
      collisionMargin: data.collision_margin || 10
    };
  }

  private transformSignalData(data: any): SignalData[] {
    const result: SignalData[] = [];
    
    if (Array.isArray(data.data_points)) {
      data.data_points.forEach((point: any) => {
        Object.entries(point.data).forEach(([signal, value]) => {
          result.push({
            timestamp: point.timestamp,
            signal,
            value: value as any
          });
        });
      });
    }

    return result;
  }

  // Demo data generators (simplified versions of mock data)
  private generateDemoSession(pathOrId: string): SessionData {
    return {
      id: `demo-session-${Date.now()}`,
      name: 'Demo Trip Data',
      duration: 179.2,
      startTime: Date.now() - 179200,
      endTime: Date.now(),
      signals: this.getAvailableSignals('demo').slice(0, 10),
      dataPoints: 1792,
      source: {
        type: 'demo',
        connectionStatus: 'connected'
      }
    };
  }

  private generateDemoVehicleData(timestamp: number): VehicleData {
    const t = timestamp * 0.1;
    return {
      timestamp,
      vehicleSpeed: 30 + 20 * Math.sin(t * 0.1),
      acceleration: 2 * Math.cos(t * 0.1),
      steeringAngle: 15 * Math.sin(t * 0.05),
      position: {
        x: timestamp * 0.5 + 10 * Math.sin(t * 0.02),
        y: timestamp * 0.3 + 5 * Math.cos(t * 0.02)
      },
      collisionMargin: 5 + 3 * Math.sin(t * 0.2)
    };
  }

  private generateDemoSignalData(
    signals: string[],
    startTime: number,
    endTime: number,
    interval: number
  ): SignalData[] {
    const data: SignalData[] = [];
    
    for (let t = startTime; t <= endTime; t += interval) {
      signals.forEach(signal => {
        let value: number;
        
        switch (signal) {
          case 'vehicle_speed':
            value = 30 + 20 * Math.sin(t * 0.1);
            break;
          case 'acceleration':
            value = 2 * Math.cos(t * 0.1);
            break;
          case 'steering_wheel_angle':
            value = 15 * Math.sin(t * 0.05);
            break;
          default:
            value = Math.random() * 100;
        }
        
        data.push({ timestamp: t, signal, value });
      });
    }
    
    return data;
  }

  /**
   * Force reconnect to backend
   */
  async reconnect(): Promise<void> {
    this.reconnectAttempts = 0;
    await this.checkPythonBackend();
  }
}

// Export singleton instance
export const dataService = new DataService();

// Export for React Query hooks
export const useDataSource = () => {
  return queryClient.useQuery({
    queryKey: ['dataSource'],
    queryFn: () => dataService.getDataSource(),
    refetchInterval: 5000 // Check connection status every 5 seconds
  });
};
