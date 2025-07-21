/**
 * React hooks for using the centralized data service
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService, SessionData, VehicleData, SignalData } from '@/services/data-service';
import { useEffect, useState } from 'react';

/**
 * Hook to monitor data source connection status
 */
export function useDataSource() {
  return useQuery({
    queryKey: ['dataSource'],
    queryFn: () => dataService.getDataSource(),
    refetchInterval: 5000,
    staleTime: 3000
  });
}

/**
 * Hook to load a session
 */
export function useLoadSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (pathOrId: string) => dataService.loadSession(pathOrId),
    onSuccess: (data) => {
      queryClient.setQueryData(['session', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['signals'] });
    }
  });
}

/**
 * Hook to get session data
 */
export function useSession(sessionId: string | null) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const cached = queryClient.getQueryData<SessionData>(['session', sessionId]);
      return cached || dataService.loadSession(sessionId);
    },
    enabled: !!sessionId
  });
}

/**
 * Hook to get vehicle data for a timestamp
 */
export function useVehicleData(sessionId: string | null, timestamp: number) {
  return useQuery({
    queryKey: ['vehicleData', sessionId, Math.floor(timestamp * 10) / 10],
    queryFn: () => {
      if (!sessionId) return null;
      return dataService.getVehicleData(sessionId, timestamp);
    },
    enabled: !!sessionId,
    staleTime: 100
  });
}

/**
 * Hook to get signal data for a time range
 */
export function useSignalData(
  sessionId: string | null,
  signals: string[],
  startTime: number,
  endTime: number,
  interval: number = 0.1
) {
  return useQuery({
    queryKey: ['signalData', sessionId, signals, startTime, endTime, interval],
    queryFn: () => {
      if (!sessionId || signals.length === 0) return [];
      return dataService.getSignalData(sessionId, signals, startTime, endTime, interval);
    },
    enabled: !!sessionId && signals.length > 0
  });
}

/**
 * Hook to get available signals
 */
export function useAvailableSignals(sessionId: string | null) {
  return useQuery({
    queryKey: ['signals', sessionId],
    queryFn: () => {
      if (!sessionId) return [];
      return dataService.getAvailableSignals(sessionId);
    },
    enabled: !!sessionId
  });
}

/**
 * Hook to subscribe to real-time updates
 */
export function useRealtimeData(
  sessionId: string | null,
  onUpdate: (data: VehicleData) => void
) {
  useEffect(() => {
    if (!sessionId) return;
    
    const unsubscribe = dataService.subscribeToUpdates(sessionId, onUpdate);
    return unsubscribe;
  }, [sessionId, onUpdate]);
}

/**
 * Hook to manage playback state with real data
 */
export function usePlaybackState(sessionId: string | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const session = useSession(sessionId);
  
  useEffect(() => {
    if (!isPlaying || !session.data) return;
    
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + (0.1 * playbackSpeed);
        if (next >= session.data!.duration) {
          setIsPlaying(false);
          return session.data!.duration;
        }
        return next;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, session.data]);
  
  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const seek = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, session.data?.duration || 0)));
  };
  const setSpeed = (speed: number) => {
    setPlaybackSpeed(Math.max(0.25, Math.min(speed, 4)));
  };
  
  return {
    isPlaying,
    currentTime,
    playbackSpeed,
    duration: session.data?.duration || 0,
    play,
    pause,
    seek,
    setSpeed
  };
}

const queryClient = useQueryClient();