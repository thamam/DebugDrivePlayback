/**
 * Enhanced API routes with improved data service integration
 */

import { Express, Request, Response } from "express";
import { z } from "zod";
import { pythonBackendV2 } from "./python-backend-v2";
import { dataAdapter } from "./data-adapter";
import { promises as fs } from "fs";
import path from "path";

// Validation schemas
const loadSessionSchema = z.object({
  path: z.string().min(1, "Path is required")
});

const dataRequestSchema = z.object({
  sessionId: z.string(),
  timestamp: z.number(),
  signals: z.array(z.string()).optional()
});

const dataRangeSchema = z.object({
  sessionId: z.string(),
  signals: z.array(z.string()),
  startTime: z.number(),
  endTime: z.number(),
  interval: z.number().optional().default(0.1)
});

/**
 * Register enhanced API routes
 */
export function registerEnhancedRoutes(app: Express): void {
  
  // Health check endpoint
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      const health = pythonBackendV2.getHealthStatus();
      res.json(health);
    } catch (error) {
      res.status(500).json({
        error: 'Health check failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Load session data
  app.post('/api/sessions/load', async (req: Request, res: Response) => {
    try {
      const { path: tripPath } = loadSessionSchema.parse(req.body);
      
      console.log('Loading session from path:', tripPath);
      
      // Try data adapter first (for CSV files)
      try {
        const tripData = await dataAdapter.loadTripData(tripPath);
        
        const sessionData = {
          id: tripData.id,
          name: tripData.name,
          duration: tripData.duration,
          startTime: tripData.startTime,
          endTime: tripData.endTime,
          signals: Object.keys(tripData.signals),
          dataPoints: Object.values(tripData.signals).reduce((sum, signal) => sum + signal.data.length, 0),
          source: {
            type: 'file' as const,
            connectionStatus: 'connected' as const
          }
        };
        
        console.log(`Loaded trip data: ${sessionData.signals.length} signals, ${sessionData.dataPoints} data points`);
        return res.json(sessionData);
      } catch (adapterError) {
        console.log('Data adapter failed, trying Python backend:', adapterError);
      }
      
      // Try to load using Python backend
      const result = await pythonBackendV2.loadData(tripPath);
      
      if (result.success) {
        const sessionData = {
          id: `session-${Date.now()}`,
          name: path.basename(tripPath),
          duration: result.time_range ? result.time_range[1] - result.time_range[0] : 0,
          startTime: result.time_range ? result.time_range[0] : Date.now(),
          endTime: result.time_range ? result.time_range[1] : Date.now(),
          signals: Object.keys(result.signals || {}),
          dataPoints: result.data_points || 0,
          source: {
            type: result.isDemoMode ? 'demo' : 'real',
            connectionStatus: 'connected'
          }
        };
        
        res.json(sessionData);
      } else {
        // Fallback to demo data
        res.json({
          id: `demo-session-${Date.now()}`,
          name: 'Demo Trip Data',
          duration: 179.2,
          startTime: Date.now() - 179200,
          endTime: Date.now(),
          signals: ['vehicle_speed', 'steering_wheel_angle', 'gps_latitude', 'gps_longitude'],
          dataPoints: 1792,
          source: {
            type: 'demo',
            connectionStatus: 'connected'
          },
          error: result.error
        });
      }
    } catch (error) {
      console.error('Session load error:', error);
      res.status(400).json({
        error: 'Failed to load session',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get vehicle data for timestamp
  app.post('/api/data', async (req: Request, res: Response) => {
    try {
      const { sessionId, timestamp, signals } = dataRequestSchema.parse(req.body);
      
      // For now, return demo data - will integrate with real data later
      const vehicleData = {
        timestamp,
        vehicle_speed: 30 + 20 * Math.sin(timestamp * 0.1),
        acceleration: 2 * Math.cos(timestamp * 0.1),
        steering_wheel_angle: 15 * Math.sin(timestamp * 0.05),
        gps_latitude: 37.7749 + timestamp * 0.00001,
        gps_longitude: -122.4194 + timestamp * 0.00001,
        collision_margin: 5 + 3 * Math.sin(timestamp * 0.2)
      };
      
      // Filter by requested signals if provided
      if (signals && signals.length > 0) {
        const filtered: any = { timestamp };
        signals.forEach(signal => {
          if (signal in vehicleData) {
            filtered[signal] = vehicleData[signal as keyof typeof vehicleData];
          }
        });
        res.json(filtered);
      } else {
        res.json(vehicleData);
      }
    } catch (error) {
      res.status(400).json({
        error: 'Invalid data request',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get data for time range
  app.post('/api/data-range', async (req: Request, res: Response) => {
    try {
      const { sessionId, signals, startTime, endTime, interval } = dataRangeSchema.parse(req.body);
      
      // Try to get real data first
      try {
        const signalData = await dataAdapter.getSignalData(
          sessionId,
          signals,
          startTime,
          endTime,
          Math.ceil((endTime - startTime) / interval)
        );
        
        // Convert to response format
        const dataPoints = [];
        const timestamps = new Set<number>();
        
        // Collect all unique timestamps
        Object.values(signalData).forEach(points => {
          points.forEach(point => timestamps.add(point.timestamp));
        });
        
        // Create data points for each timestamp
        const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);
        
        for (const timestamp of sortedTimestamps) {
          if (timestamp >= startTime && timestamp <= endTime) {
            const pointData: any = { timestamp };
            
            signals.forEach(signal => {
              const signalPoints = signalData[signal] || [];
              const point = signalPoints.find(p => Math.abs(p.timestamp - timestamp) < 0.01);
              pointData[signal] = point?.value || null;
            });
            
            dataPoints.push(pointData);
          }
        }
        
        return res.json({
          startTime,
          endTime,
          interval,
          dataPoints,
          totalPoints: dataPoints.length,
          source: 'real'
        });
      } catch (adapterError) {
        console.log('Real data not available, using demo data:', adapterError);
      }
      
      // Fallback to demo data
      const dataPoints = [];
      
      for (let t = startTime; t <= endTime; t += interval) {
        const pointData: any = { timestamp: t };
        
        signals.forEach(signal => {
          switch (signal) {
            case 'vehicle_speed':
              pointData[signal] = 30 + 20 * Math.sin(t * 0.1);
              break;
            case 'acceleration':
              pointData[signal] = 2 * Math.cos(t * 0.1);
              break;
            case 'steering_wheel_angle':
              pointData[signal] = 15 * Math.sin(t * 0.05);
              break;
            case 'gps_latitude':
              pointData[signal] = 37.7749 + t * 0.00001;
              break;
            case 'gps_longitude':
              pointData[signal] = -122.4194 + t * 0.00001;
              break;
            default:
              pointData[signal] = Math.random() * 100;
          }
        });
        
        dataPoints.push(pointData);
      }
      
      res.json({
        startTime,
        endTime,
        interval,
        dataPoints,
        totalPoints: dataPoints.length,
        source: 'demo'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Invalid data range request',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get available signals
  app.get('/api/signals', async (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId as string;
      
      // Return default signals - will integrate with real session data later
      const signals = {
        vehicle_speed: {
          name: 'Vehicle Speed',
          type: 'numeric',
          units: 'km/h',
          description: 'Current vehicle speed'
        },
        acceleration: {
          name: 'Acceleration',
          type: 'numeric',
          units: 'm/s²',
          description: 'Vehicle acceleration'
        },
        steering_wheel_angle: {
          name: 'Steering Wheel Angle',
          type: 'numeric',
          units: 'degrees',
          description: 'Steering wheel angle'
        },
        brake_pedal: {
          name: 'Brake Pedal',
          type: 'numeric',
          units: '%',
          description: 'Brake pedal position'
        },
        throttle_pedal: {
          name: 'Throttle Pedal',
          type: 'numeric',
          units: '%',
          description: 'Throttle pedal position'
        },
        gps_latitude: {
          name: 'GPS Latitude',
          type: 'numeric',
          units: 'degrees',
          description: 'GPS latitude coordinate'
        },
        gps_longitude: {
          name: 'GPS Longitude',
          type: 'numeric',
          units: 'degrees',
          description: 'GPS longitude coordinate'
        },
        wheel_speed_fl: {
          name: 'Wheel Speed Front Left',
          type: 'numeric',
          units: 'rpm',
          description: 'Front left wheel speed'
        },
        wheel_speed_fr: {
          name: 'Wheel Speed Front Right',
          type: 'numeric',
          units: 'rpm',
          description: 'Front right wheel speed'
        },
        wheel_speed_rl: {
          name: 'Wheel Speed Rear Left',
          type: 'numeric',
          units: 'rpm',
          description: 'Rear left wheel speed'
        },
        wheel_speed_rr: {
          name: 'Wheel Speed Rear Right',
          type: 'numeric',
          units: 'rpm',
          description: 'Rear right wheel speed'
        }
      };
      
      res.json(signals);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get signals',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Check if file/directory exists
  app.post('/api/files/check', async (req: Request, res: Response) => {
    try {
      const { path: filePath } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ error: 'Path is required' });
      }
      
      const fullPath = path.resolve(filePath);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        const files = await fs.readdir(fullPath);
        res.json(files);
      } else {
        res.json([path.basename(fullPath)]);
      }
    } catch (error) {
      res.status(404).json({
        error: 'Path not found',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Read file content
  app.post('/api/files/read', async (req: Request, res: Response) => {
    try {
      const { path: filePath } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ error: 'Path is required' });
      }
      
      const fullPath = path.resolve(filePath);
      
      // Security check - ensure path is within allowed directories
      const allowedPaths = [
        path.resolve('data'),
        path.resolve('python_backend/test_data')
      ];
      
      const isAllowed = allowedPaths.some(allowedPath => 
        fullPath.startsWith(allowedPath)
      );
      
      if (!isAllowed) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      if (filePath.endsWith('.json')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        res.json(JSON.parse(content));
      } else {
        const content = await fs.readFile(fullPath, 'utf-8');
        res.json({ content });
      }
    } catch (error) {
      res.status(404).json({
        error: 'File not found',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Restart Python backend
  app.post('/api/backend/restart', async (req: Request, res: Response) => {
    try {
      console.log('Restarting Python backend...');
      const success = await pythonBackendV2.restartBackend();
      
      res.json({
        success,
        message: success ? 'Backend restarted successfully' : 'Failed to restart backend'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to restart backend',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}