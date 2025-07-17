import { VehicleData, Bookmark, Plugin } from "@shared/schema";

export interface MockVehicleData {
  time: number;
  vehicle_speed: number;
  acceleration: number;
  steering_angle: number;
  position_x: number;
  position_y: number;
  collision_margin: number;
  planned_path_x: number;
  planned_path_y: number;
}

export function generateMockVehicleData(): MockVehicleData[] {
  const data: MockVehicleData[] = [];
  for (let i = 0; i <= 932; i += 0.1) {
    const time = Math.round(i * 10) / 10;
    data.push({
      time: time,
      vehicle_speed: 25 + 10 * Math.sin(time * 0.1) + Math.random() * 2,
      acceleration: Math.sin(time * 0.2) * 2 + Math.random() * 0.5,
      steering_angle: Math.sin(time * 0.15) * 15 + Math.random() * 2,
      position_x: time * 2 + Math.sin(time * 0.1) * 5,
      position_y: Math.sin(time * 0.05) * 10 + Math.random() * 1,
      collision_margin: Math.max(0.5, 3 + Math.sin(time * 0.3) * 2 + Math.random() * 0.5),
      planned_path_x: time * 2,
      planned_path_y: Math.sin(time * 0.05) * 8
    });
  }
  return data;
}

export const mockBookmarks: Bookmark[] = [
  { id: 1, sessionId: 1, timestamp: 127.3, label: 'Sharp Turn', color: '#ff8c42' },
  { id: 2, sessionId: 1, timestamp: 245.7, label: 'Collision Warning', color: '#ff4757' },
  { id: 3, sessionId: 1, timestamp: 512.1, label: 'Lane Change', color: '#4a9eff' }
];

export const mockPlugins: Plugin[] = [
  { 
    id: 1, 
    name: 'CarPosePlugin', 
    description: 'Vehicle positioning data', 
    isActive: true, 
    version: '1.0.0',
    pluginType: 'visualization',
    configuration: '{}',
    createdAt: new Date()
  },
  { 
    id: 2, 
    name: 'PathViewPlugin', 
    description: 'Path visualization', 
    isActive: true, 
    version: '1.2.0',
    pluginType: 'visualization',
    configuration: '{}',
    createdAt: new Date()
  },
  { 
    id: 3, 
    name: 'CollisionPlugin', 
    description: 'Collision detection', 
    isActive: true, 
    version: '2.1.0',
    pluginType: 'analysis',
    configuration: '{}',
    createdAt: new Date()
  }
];

export const mockDataSession = {
  id: 1,
  name: 'autonomous_drive_2024-12-15.json',
  filename: 'highway_drive_001.csv',
  fileSize: 133373952, // 127.3 MB
  duration: 932.0,
  frequency: 20,
  signalCount: 47,
  createdAt: new Date()
};

export interface CollisionViolation {
  time: number;
  margin: number;
  severity: 'warning' | 'critical';
}

export const mockActiveSignals = {
  'vehicle_speed': true,
  'acceleration': true,
  'steering_angle': false,
  'position_x': true,
  'position_y': true,
  'collision_margin': true
};
