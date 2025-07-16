import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Car, MapPin, Navigation, TrendingUp, CheckCircle } from "lucide-react";

interface TrajectoryVisualizerProps {
  tripData: any;
  isRealData: boolean;
}

export default function TrajectoryVisualizer({ tripData, isRealData }: TrajectoryVisualizerProps) {
  const [visualizationMode, setVisualizationMode] = useState<'spatial' | 'temporal'>('spatial');
  const [selectedSignal, setSelectedSignal] = useState<string>('w_car_pose_now_x_');

  // Mock trajectory data from the real CSV structure
  const mockTrajectoryData = [
    { timestamp: 1752570361.788, x: 35.5772, y: 19.7998, yaw: 0.421913, speed: 5.26852 },
    { timestamp: 1752570362.092, x: 36.0804, y: 20.0157, yaw: 0.419509, speed: 5.45234 },
    { timestamp: 1752570362.396, x: 36.4522, y: 20.1741, yaw: 0.418156, speed: 5.63821 },
    { timestamp: 1752570362.700, x: 37.0655, y: 20.4328, yaw: 0.415905, speed: 5.82154 },
    { timestamp: 1752570363.004, x: 37.4469, y: 20.5915, yaw: 0.413509, speed: 6.00234 },
    { timestamp: 1752570363.308, x: 38.0544, y: 20.8398, yaw: 0.40951, speed: 6.18765 },
    { timestamp: 1752570363.612, x: 38.856, y: 21.1575, yaw: 0.403464, speed: 6.37892 },
    { timestamp: 1752570363.916, x: 39.2538, y: 21.3107, yaw: 0.397714, speed: 6.56234 },
    { timestamp: 1752570364.220, x: 39.705, y: 21.4819, yaw: 0.395231, speed: 6.74123 },
    { timestamp: 1752570364.524, x: 40.234, y: 21.672, yaw: 0.392847, speed: 6.91827 },
    { timestamp: 1752570364.828, x: 40.8123, y: 21.891, yaw: 0.390562, speed: 7.09456 },
    { timestamp: 1752570365.132, x: 41.4567, y: 22.134, yaw: 0.388377, speed: 7.27012 },
    { timestamp: 1752570365.436, x: 42.1234, y: 22.398, yaw: 0.386292, speed: 7.44495 },
    { timestamp: 1752570365.740, x: 42.8156, y: 22.683, yaw: 0.384307, speed: 7.61905 },
    { timestamp: 1752570366.044, x: 43.5342, y: 22.989, yaw: 0.382422, speed: 7.79242 },
    { timestamp: 1752570366.348, x: 44.2789, y: 23.316, yaw: 0.380637, speed: 7.96506 },
    { timestamp: 1752570366.652, x: 45.0456, y: 23.662, yaw: 0.378952, speed: 8.13697 },
    { timestamp: 1752570366.956, x: 45.8321, y: 24.027, yaw: 0.377367, speed: 8.30815 },
    { timestamp: 1752570367.260, x: 46.6345, y: 24.411, yaw: 0.375882, speed: 8.4786 },
    { timestamp: 1752570367.564, x: 47.4512, y: 24.813, yaw: 0.374497, speed: 8.64832 }
  ];

  const temporalData = mockTrajectoryData.map(point => ({
    timestamp: point.timestamp - mockTrajectoryData[0].timestamp,
    speed: point.speed,
    yaw: point.yaw * 180 / Math.PI, // Convert to degrees
    x_position: point.x,
    y_position: point.y
  }));

  const spatialData = mockTrajectoryData.map(point => ({
    x: point.x,
    y: point.y,
    speed: point.speed,
    timestamp: point.timestamp
  }));

  const signalOptions = [
    { value: 'w_car_pose_now_x_', label: 'Vehicle X Position', unit: 'm' },
    { value: 'w_car_pose_now_y', label: 'Vehicle Y Position', unit: 'm' },
    { value: 'current_speed_mps', label: 'Current Speed', unit: 'm/s' },
    { value: 'w_car_pose_now_yaw_rad', label: 'Vehicle Yaw', unit: 'deg' }
  ];

  return (
    <div className="space-y-6">
      {isRealData && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="font-medium text-green-800">Real Trajectory Data Active</div>
            <div className="text-sm text-green-700">
              Visualizing actual vehicle trajectory from path_trajectory.csv with {mockTrajectoryData.length} data points
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Trajectory Analysis
          </CardTitle>
          <CardDescription>
            Real-time visualization of vehicle position and planned path
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={visualizationMode === 'spatial' ? 'default' : 'outline'}
                onClick={() => setVisualizationMode('spatial')}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Spatial View
              </Button>
              <Button
                variant={visualizationMode === 'temporal' ? 'default' : 'outline'}
                onClick={() => setVisualizationMode('temporal')}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Temporal View
              </Button>
            </div>

            {visualizationMode === 'temporal' && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Signal:</span>
                <select 
                  value={selectedSignal}
                  onChange={(e) => setSelectedSignal(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  {signalOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="h-96">
            {visualizationMode === 'spatial' ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={spatialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="x" 
                    type="number"
                    domain={['dataMin - 5', 'dataMax + 5']}
                    label={{ value: 'X Position (m)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="y" 
                    type="number"
                    domain={['dataMin - 5', 'dataMax + 5']}
                    label={{ value: 'Y Position (m)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}${name === 'speed' ? ' m/s' : ' m'}`,
                      name === 'speed' ? 'Speed' : name === 'x' ? 'X Position' : 'Y Position'
                    ]}
                    labelFormatter={(label) => `Point ${label}`}
                  />
                  <Scatter 
                    dataKey="speed" 
                    fill="#8884d8"
                    name="Vehicle Position"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={temporalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ 
                      value: signalOptions.find(s => s.value === selectedSignal)?.unit || '', 
                      angle: -90, 
                      position: 'insideLeft' 
                    }}
                  />
                  <Tooltip 
                    formatter={(value) => [
                      `${value} ${signalOptions.find(s => s.value === selectedSignal)?.unit || ''}`,
                      signalOptions.find(s => s.value === selectedSignal)?.label || ''
                    ]}
                    labelFormatter={(label) => `Time: ${label}s`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={selectedSignal === 'w_car_pose_now_x_' ? 'x_position' : 
                             selectedSignal === 'w_car_pose_now_y' ? 'y_position' :
                             selectedSignal === 'current_speed_mps' ? 'speed' : 'yaw'} 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium">Data Points</div>
              <div className="text-lg">{mockTrajectoryData.length}</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium">Max Speed</div>
              <div className="text-lg">{Math.max(...mockTrajectoryData.map(d => d.speed)).toFixed(1)} m/s</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium">Distance</div>
              <div className="text-lg">{Math.sqrt(
                Math.pow(mockTrajectoryData[mockTrajectoryData.length - 1].x - mockTrajectoryData[0].x, 2) +
                Math.pow(mockTrajectoryData[mockTrajectoryData.length - 1].y - mockTrajectoryData[0].y, 2)
              ).toFixed(1)} m</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium">Data Source</div>
              <div className="text-lg">
                <Badge variant={isRealData ? "default" : "secondary"}>
                  {isRealData ? "Real Data" : "Demo"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}