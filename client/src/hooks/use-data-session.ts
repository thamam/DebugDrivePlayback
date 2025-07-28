/**
 * Data Session Hook - Manages vehicle data loading and session state
 * Simplified from the massive use-debug-player hook
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { mockDataSession, type MockVehicleData } from '@/lib/mock-data';

const BASE_TIMESTAMP_OFFSET = 1752570362.062682;

export function useDataSession() {
  const [location] = useLocation();
  const sessionId = new URLSearchParams(location.split('?')[1] || '').get('session');
  
  const [vehicleData, setVehicleData] = useState<MockVehicleData[]>([]);
  const [dataSession, setDataSession] = useState(mockDataSession);
  const [maxTime, setMaxTime] = useState(932);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load real data when session ID is present
  useEffect(() => {
    if (sessionId || location === '/') {
      setIsLoading(true);
      loadTrajectoryData();
    } else {
      setError('Please load trip data to begin analysis');
      setVehicleData([]);
    }
  }, [sessionId, location]);

  const loadTrajectoryData = async () => {
    try {
      const response = await fetch(`/api/trajectory/${sessionId}`);
      const trajectoryData = await response.json();
      
      if (trajectoryData.success && trajectoryData.trajectory) {
        // Store only essential trajectory metadata for performance
        const sampleDataPoints = trajectoryData.trajectory
          .slice(0, Math.min(1000, trajectoryData.trajectory.length))
          .map((point: any, index: number) => ({
            time: point.timestamp - trajectoryData.time_range[0],
            vehicle_speed: 15 + (index % 10),
            acceleration: 0,
            steering_angle: (index % 20) - 10,
            position_x: point.x,
            position_y: point.y,
            collision_margin: 2.5,
            planned_path_x: point.x + 0.1,
            planned_path_y: point.y + 0.1
          }));
        
        setVehicleData(sampleDataPoints);
        const duration = trajectoryData.time_range[1] - trajectoryData.time_range[0];
        setMaxTime(duration);
        
        setDataSession({
          ...mockDataSession,
          name: 'Kia Niro EV - Real Trip Data',
          duration: duration,
          signalCount: trajectoryData.total_points || sampleDataPoints.length
        });
        setError(null);
      } else {
        setError(`Failed to load trajectory data: ${trajectoryData.error}`);
        setVehicleData([]);
      }
    } catch (error) {
      setError(`Error loading trajectory data: ${error}`);
      setVehicleData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentDataPoint = (currentTime: number) => {
    return vehicleData.find(d => Math.abs(d.time - currentTime) < 0.05) || vehicleData[0];
  };

  return {
    vehicleData,
    dataSession,
    maxTime,
    error,
    isLoading,
    sessionId,
    getCurrentDataPoint
  };
}
