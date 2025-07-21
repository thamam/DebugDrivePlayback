import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { generateMockVehicleData, mockBookmarks, mockPlugins, mockDataSession, mockActiveSignals, type MockVehicleData, type CollisionViolation } from '@/lib/mock-data';
import { Bookmark, Plugin } from '@shared/schema';

export function useDebugPlayer() {
  const [location] = useLocation();
  const sessionId = new URLSearchParams(location.split('?')[1] || '').get('session');
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedTab, setSelectedTab] = useState('temporal');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeSignals, setActiveSignals] = useState(mockActiveSignals);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(mockBookmarks);
  const [plugins, setPlugins] = useState<Plugin[]>(mockPlugins);
  const [collisionViolations, setCollisionViolations] = useState<CollisionViolation[]>([]);
  const [vehicleData, setVehicleData] = useState<MockVehicleData[]>([]);
  const [dataSession, setDataSession] = useState(mockDataSession);
  const [maxTime, setMaxTime] = useState(932);
  const [error, setError] = useState<string | null>(null);

  // Load real data when session ID is present
  useEffect(() => {
    console.log('Debug player session ID:', sessionId);
    if (sessionId) {
      console.log('Loading real trajectory data from CSV for session:', sessionId);
      
      // Load real trajectory data from API
      const loadRealTrajectoryData = async () => {
        try {
          const response = await fetch(`/api/trajectory/${sessionId}`);
          const trajectoryData = await response.json();
          
          if (trajectoryData.success && trajectoryData.trajectory) {
            console.log('Loaded real trajectory data:', trajectoryData.trajectory.length, 'points');
            console.log('Time range:', trajectoryData.time_range);
            
            // Convert trajectory data to MockVehicleData format
            const realDataPoints = trajectoryData.trajectory.map((point: any) => ({
              time: point.timestamp - trajectoryData.time_range[0], // Normalize to start from 0
              vehicle_speed: point.speed,
              acceleration: 0, // Calculate from speed if needed
              steering_angle: 0, // Calculate from yaw if needed  
              position_x: point.x,
              position_y: point.y,
              collision_margin: 2.5, // Default safe margin
              planned_path_x: point.x + 0.1, // Slightly offset planned path
              planned_path_y: point.y + 0.1
            }));
            
            setVehicleData(realDataPoints);
            const duration = trajectoryData.time_range[1] - trajectoryData.time_range[0];
            setMaxTime(duration);
            setCurrentTime(0);
            
            // Update session info with real data
            setDataSession({
              ...mockDataSession,
              name: 'Kia Niro EV - Real Trip Data',
              duration: duration,
              signalCount: trajectoryData.total_points || realDataPoints.length
            });
          } else {
            console.error('Failed to load trajectory data:', trajectoryData.error);
            setError(`Failed to load trajectory data: ${trajectoryData.error}`);
            setVehicleData([]);
          }
        } catch (error) {
          console.error('Error loading trajectory data:', error);
          setError(`Error loading trajectory data: ${error}`);
          setVehicleData([]);
        }
      };
      
      loadRealTrajectoryData();
    } else {
      // No session ID - require user to load data
      setError('Please load trip data to begin analysis');
      setVehicleData([]);
    }
  }, [sessionId]);

  const getCurrentDataPoint = useCallback(() => {
    return vehicleData.find(d => Math.abs(d.time - currentTime) < 0.05) || vehicleData[0];
  }, [vehicleData, currentTime]);

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1 * playbackSpeed;
          return next >= maxTime ? 0 : next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, maxTime]);

  // Check for collision violations
  useEffect(() => {
    const currentData = getCurrentDataPoint();
    if (currentData && currentData.collision_margin < 1.5) {
      setCollisionViolations(prev => {
        const newViolation: CollisionViolation = {
          time: currentTime,
          margin: currentData.collision_margin,
          severity: currentData.collision_margin < 1.0 ? 'critical' : 'warning'
        };
        return [...prev.slice(-4), newViolation];
      });
    }
  }, [currentTime, getCurrentDataPoint]);

  const toggleSignal = (signal: string) => {
    setActiveSignals(prev => ({
      ...prev,
      [signal]: !prev[signal as keyof typeof prev]
    }));
  };

  const addBookmark = () => {
    const newBookmark: Bookmark = {
      id: Date.now(),
      sessionId: 1,
      timestamp: currentTime,
      label: `Bookmark ${bookmarks.length + 1}`,
      color: '#4a9eff'
    };
    setBookmarks(prev => [...prev, newBookmark]);
  };

  const jumpToTime = (time: number) => {
    setCurrentTime(time);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${minutes.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const resetTime = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const skipToEnd = () => {
    setCurrentTime(maxTime);
    setIsPlaying(false);
  };

  return {
    // State
    currentTime,
    isPlaying,
    playbackSpeed,
    selectedTab,
    leftSidebarOpen,
    rightSidebarOpen,
    activeSignals,
    bookmarks,
    plugins,
    collisionViolations,
    vehicleData,
    dataSession,
    error,
    isLoadingRealData: false,
    
    // Computed
    getCurrentDataPoint,
    formatTime,
    
    // Actions
    setCurrentTime,
    setPlaybackSpeed,
    setSelectedTab,
    setLeftSidebarOpen,
    setRightSidebarOpen,
    toggleSignal,
    addBookmark,
    jumpToTime,
    togglePlayback,
    resetTime,
    skipToEnd
  };
}