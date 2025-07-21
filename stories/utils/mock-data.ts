/**
 * Mock data utilities for Storybook stories
 */

export const mockTripData = {
  id: 'trip-123',
  name: 'Test Drive Session',
  duration: 180.5,
  startTime: Date.now() - 180500,
  endTime: Date.now(),
  signals: ['vehicle_speed', 'steering_wheel_angle', 'gps_latitude', 'gps_longitude'],
  dataPoints: 1805,
  source: {
    type: 'real' as const,
    connectionStatus: 'connected' as const
  }
};

export const mockVehicleData = {
  timestamp: Date.now(),
  vehicle_speed: 45.6,
  acceleration: 0.8,
  steering_wheel_angle: -2.5,
  gps_latitude: 37.7749,
  gps_longitude: -122.4194,
  collision_margin: 7.2,
  brake_pedal: 0,
  throttle_pedal: 35
};

export const mockSignals = {
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
  }
};

export const mockHealthStatus = {
  status: 'healthy' as const,
  lastCheck: Date.now(),
  uptime: 3600,
  version: '2.0.0',
  connections: {
    database: true,
    python_backend: true
  }
};

export const mockWidgetDefinition = {
  id: 'widget-123',
  templateId: 'chart-template',
  name: 'Speed Chart',
  config: {
    signals: ['vehicle_speed'],
    chartType: 'line',
    timeRange: 60
  },
  layout: {
    x: 0,
    y: 0,
    width: 6,
    height: 4
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

export const generateTimeSeriesData = (
  signal: string,
  duration: number = 60,
  interval: number = 0.1
): Array<{ timestamp: number; value: number }> => {
  const data = [];
  const startTime = Date.now() - duration * 1000;
  
  for (let i = 0; i <= duration / interval; i++) {
    const timestamp = startTime + i * interval * 1000;
    let value = 0;
    
    switch (signal) {
      case 'vehicle_speed':
        value = 30 + 20 * Math.sin(i * 0.01) + Math.random() * 5;
        break;
      case 'steering_wheel_angle':
        value = 15 * Math.sin(i * 0.005) + Math.random() * 2;
        break;
      case 'acceleration':
        value = 2 * Math.cos(i * 0.008) + Math.random() * 0.5;
        break;
      default:
        value = Math.random() * 100;
    }
    
    data.push({ timestamp, value });
  }
  
  return data;
};