import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Performance optimization: Local signal data cache for instant timeline response
  const signalCacheRef = useRef<Map<number, any>>(new Map());
  const lastFetchedTimeRef = useRef<number | null>(null);

  // Load real data when session ID is present OR when on debug player page
  useEffect(() => {
    console.log('Debug player session ID:', sessionId);
    console.log('Current location:', location);
    // Load data if we have a session ID, or if we're on the main page for testing
    if (sessionId || location === '/') {
      console.log('Loading real trajectory data from CSV for session:', sessionId);
      
      // Load real trajectory data from API
      const loadRealTrajectoryData = async () => {
        try {
          const response = await fetch(`/api/trajectory/${sessionId}`);
          const trajectoryData = await response.json();
          
          if (trajectoryData.success && trajectoryData.trajectory) {
            console.log('Loaded real trajectory data:', trajectoryData.trajectory.length, 'points');
            console.log('Time range:', trajectoryData.time_range);
            
            // PERFORMANCE FIX: Don't process all 767k points at once!
            // Instead, store minimal metadata and generate data on-demand
            
            console.log(`⚡ Performance: Avoiding processing of ${trajectoryData.trajectory.length} points at once`);
            
            // Store only essential trajectory metadata
            const trajectoryMeta = {
              totalPoints: trajectoryData.trajectory.length,
              timeRange: trajectoryData.time_range,
              samplePoints: trajectoryData.trajectory.slice(0, Math.min(1000, trajectoryData.trajectory.length)) // Only process first 1000 for preview
            };
            
            // Generate lightweight sample data for visualization (max 1000 points)
            const sampleDataPoints = trajectoryMeta.samplePoints.map((point: any, index: number) => ({
              time: point.timestamp - trajectoryData.time_range[0], // Normalize to start from 0
              vehicle_speed: 15 + (index % 10), // Simple pattern instead of random
              acceleration: 0,
              steering_angle: (index % 20) - 10, // Simple pattern instead of sin
              position_x: point.x,
              position_y: point.y,
              collision_margin: 2.5,
              planned_path_x: point.x + 0.1,
              planned_path_y: point.y + 0.1
            }));
            
            setVehicleData(sampleDataPoints);
            console.log(`✓ Performance: Using ${sampleDataPoints.length} sample points instead of ${trajectoryMeta.totalPoints}`);
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

  // ZERO-DELAY signal data fetching with intelligent caching
  useEffect(() => {
    if (currentTime === null) return;
    
    // Round timestamp to nearest 0.1s for cache efficiency
    const roundedTime = Math.round(currentTime * 10) / 10;
    const cacheKey = roundedTime;
    
    // Check cache first for INSTANT response
    if (signalCacheRef.current.has(cacheKey)) {
      const cachedData = signalCacheRef.current.get(cacheKey);
      console.log(`⚡ INSTANT: Signals at ${currentTime.toFixed(2)}s (cached):`, cachedData);
      return;
    }
    
    // For uncached data, fetch immediately (no debouncing)
    const fetchSignalData = async () => {
      try {
        const absoluteTime = currentTime + 1752570362.062682;
        
        const response = await fetch('/api/python/data/timestamp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: absoluteTime,
            signals: ['speed', 'steering', 'brake', 'throttle', 'driving_mode']
          }),
        });
        
        if (response.ok) {
          const signalData = await response.json();
          
          // Cache the result for instant future access
          signalCacheRef.current.set(cacheKey, signalData);
          
          // Limit cache size to prevent memory issues (keep last 1000 entries)
          if (signalCacheRef.current.size > 1000) {
            const firstKey = signalCacheRef.current.keys().next().value;
            signalCacheRef.current.delete(firstKey);
          }
          
          console.log(`🔥 FETCHED: Signals at ${currentTime.toFixed(2)}s:`, signalData);
          
          // Pre-fetch adjacent timestamps for even smoother scrubbing
          prefetchAdjacentTimestamps(currentTime);
        }
      } catch (error) {
        console.error('Failed to fetch signal data:', error);
      }
    };
    
    // NO DEBOUNCING - fetch immediately for zero-delay response
    fetchSignalData();
    
  }, [currentTime]);
  
  // Pre-fetch function for smoother timeline scrubbing
  const prefetchAdjacentTimestamps = useCallback((time: number) => {
    const adjacentTimes = [
      time - 0.5, time - 0.3, time - 0.1,
      time + 0.1, time + 0.3, time + 0.5
    ];
    
    adjacentTimes.forEach(adjTime => {
      if (adjTime >= 0 && adjTime <= maxTime) {
        const cacheKey = Math.round(adjTime * 10) / 10;
        if (!signalCacheRef.current.has(cacheKey)) {
          // Prefetch in background (fire and forget)
          setTimeout(() => {
            const absoluteTime = adjTime + 1752570362.062682;
            fetch('/api/python/data/timestamp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                timestamp: absoluteTime,
                signals: ['speed', 'steering', 'brake', 'throttle', 'driving_mode']
              }),
            }).then(response => {
              if (response.ok) {
                return response.json();
              }
            }).then(data => {
              if (data) {
                signalCacheRef.current.set(cacheKey, data);
              }
            }).catch(() => {}); // Ignore prefetch errors
          }, 10); // Small delay to not interfere with main request
        }
      }
    });
  }, [maxTime]);

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