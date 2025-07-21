/**
 * Enhanced Debug Player Hook using centralized data service
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { 
  useDataSource, 
  useLoadSession, 
  useSession, 
  useVehicleData, 
  usePlaybackState,
  useAvailableSignals 
} from '@/hooks/use-data-service';
import { Bookmark, Plugin } from '@shared/schema';
import { VehicleData } from '@/services/data-service';

export interface CollisionViolation {
  time: number;
  margin: number;
  severity: 'warning' | 'critical';
}

export function useDebugPlayerV2() {
  const [location] = useLocation();
  const sessionId = new URLSearchParams(location.split('?')[1] || '').get('session');
  
  // Data service hooks
  const dataSource = useDataSource();
  const loadSession = useLoadSession();
  const session = useSession(sessionId);
  const availableSignals = useAvailableSignals(sessionId);
  const playback = usePlaybackState(sessionId);
  const vehicleData = useVehicleData(sessionId, playback.currentTime);
  
  // UI State
  const [selectedTab, setSelectedTab] = useState('temporal');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeSignals, setActiveSignals] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [collisionViolations, setCollisionViolations] = useState<CollisionViolation[]>([]);
  
  // Initialize active signals when available signals change
  useEffect(() => {
    if (availableSignals.data && availableSignals.data.length > 0) {
      const initialSignals: Record<string, boolean> = {};
      availableSignals.data.forEach(signal => {
        initialSignals[signal] = ['vehicle_speed', 'steering_wheel_angle', 'gps_latitude', 'gps_longitude'].includes(signal);
      });
      setActiveSignals(initialSignals);
    }
  }, [availableSignals.data]);
  
  // Load session if sessionId is provided but not loaded
  useEffect(() => {
    if (sessionId && !session.data && !session.isLoading && !loadSession.isPending) {
      loadSession.mutate(sessionId);
    }
  }, [sessionId, session.data, session.isLoading, loadSession]);
  
  // Check for collision violations
  useEffect(() => {
    if (vehicleData.data && vehicleData.data.collisionMargin < 1.5) {
      setCollisionViolations(prev => {
        const newViolation: CollisionViolation = {
          time: playback.currentTime,
          margin: vehicleData.data!.collisionMargin,
          severity: vehicleData.data!.collisionMargin < 1.0 ? 'critical' : 'warning'
        };
        return [...prev.slice(-4), newViolation];
      });
    }
  }, [vehicleData.data, playback.currentTime]);
  
  // Load default plugins based on data source
  useEffect(() => {
    if (session.data) {
      const defaultPlugins: Plugin[] = [
        {
          id: 1,
          name: 'Car Pose Plugin',
          type: 'analyzer',
          active: true,
          config: {}
        },
        {
          id: 2,
          name: 'Path View Plugin',
          type: 'visualizer',
          active: true,
          config: {}
        },
        {
          id: 3,
          name: 'Collision Plugin',
          type: 'detector',
          active: false,
          config: {}
        }
      ];
      setPlugins(defaultPlugins);
    }
  }, [session.data]);
  
  const toggleSignal = useCallback((signal: string) => {
    setActiveSignals(prev => ({
      ...prev,
      [signal]: !prev[signal]
    }));
  }, []);
  
  const addBookmark = useCallback(() => {
    const newBookmark: Bookmark = {
      id: Date.now(),
      sessionId: session.data?.id ? parseInt(session.data.id) : 1,
      timestamp: playback.currentTime,
      label: `Bookmark ${bookmarks.length + 1}`,
      color: '#4a9eff'
    };
    setBookmarks(prev => [...prev, newBookmark]);
  }, [bookmarks.length, playback.currentTime, session.data]);
  
  const jumpToTime = useCallback((time: number) => {
    playback.seek(time);
    playback.pause();
  }, [playback]);
  
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${minutes.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
  }, []);
  
  const getCurrentDataPoint = useCallback(() => {
    return vehicleData.data || {
      timestamp: playback.currentTime,
      vehicleSpeed: 0,
      acceleration: 0,
      steeringAngle: 0,
      position: { x: 0, y: 0 },
      collisionMargin: 10
    };
  }, [vehicleData.data, playback.currentTime]);
  
  // Convert to legacy format for compatibility
  const legacyVehicleData = vehicleData.data ? [{
    time: vehicleData.data.timestamp,
    vehicle_speed: vehicleData.data.vehicleSpeed,
    acceleration: vehicleData.data.acceleration,
    steering_angle: vehicleData.data.steeringAngle,
    position_x: vehicleData.data.position.x,
    position_y: vehicleData.data.position.y,
    collision_margin: vehicleData.data.collisionMargin,
    planned_path_x: vehicleData.data.position.x + 0.1,
    planned_path_y: vehicleData.data.position.y + 0.1
  }] : [];
  
  const dataSession = session.data ? {
    name: session.data.name,
    duration: session.data.duration,
    signalCount: session.data.signals.length,
    dataPoints: session.data.dataPoints,
    source: session.data.source.type
  } : {
    name: 'No Session Loaded',
    duration: 0,
    signalCount: 0,
    dataPoints: 0,
    source: 'none'
  };
  
  return {
    // State
    currentTime: playback.currentTime,
    isPlaying: playback.isPlaying,
    playbackSpeed: playback.playbackSpeed,
    selectedTab,
    leftSidebarOpen,
    rightSidebarOpen,
    activeSignals,
    bookmarks,
    plugins,
    collisionViolations,
    vehicleData: legacyVehicleData,
    dataSession,
    
    // Data source info
    dataSource: dataSource.data,
    isLoading: session.isLoading || vehicleData.isLoading,
    error: session.error || vehicleData.error,
    
    // Computed
    getCurrentDataPoint,
    formatTime,
    
    // Actions
    setCurrentTime: playback.seek,
    setPlaybackSpeed: playback.setSpeed,
    setSelectedTab,
    setLeftSidebarOpen,
    setRightSidebarOpen,
    toggleSignal,
    addBookmark,
    jumpToTime,
    togglePlayback: playback.isPlaying ? playback.pause : playback.play,
    resetTime: () => playback.seek(0),
    skipToEnd: () => playback.seek(playback.duration),
    
    // New actions
    loadSession: (path: string) => loadSession.mutate(path)
  };
}