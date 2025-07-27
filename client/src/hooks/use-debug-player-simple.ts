/**
 * Simplified Debug Player Hook - Combines focused hooks
 * Replaces the massive 311-line use-debug-player-fixed.ts with a clean API
 */
import { useState, useEffect } from 'react';
import { usePlayerState } from './use-player-state';
import { useDataSession } from './use-data-session';
import { useUIState } from './use-ui-state';
import { useBookmarks } from './use-bookmarks';
import { SimpleDataService } from '@/services/simple-data-service';
import { type CollisionViolation } from '@/lib/mock-data';

export function useDebugPlayerSimple() {
  const [collisionViolations, setCollisionViolations] = useState<CollisionViolation[]>([]);
  
  // Use focused hooks
  const dataSession = useDataSession();
  const playerState = usePlayerState(dataSession.maxTime);
  const uiState = useUIState();
  const bookmarks = useBookmarks();

  // Collision detection logic
  useEffect(() => {
    const currentData = dataSession.getCurrentDataPoint(playerState.currentTime);
    if (currentData && currentData.collision_margin < 1.5) {
      setCollisionViolations(prev => {
        const newViolation: CollisionViolation = {
          time: playerState.currentTime,
          margin: currentData.collision_margin,
          severity: currentData.collision_margin < 1.0 ? 'critical' : 'warning'
        };
        return [...prev.slice(-4), newViolation];
      });
    }
  }, [playerState.currentTime, dataSession.getCurrentDataPoint]);

  // Signal data fetching (simplified)
  useEffect(() => {
    SimpleDataService.getSignalsAtTime(playerState.currentTime);
  }, [playerState.currentTime]);

  return {
    // Player controls
    ...playerState,
    
    // Data
    ...dataSession,
    
    // UI state
    ...uiState,
    
    // Bookmarks
    ...bookmarks,
    addBookmark: () => bookmarks.addBookmark(playerState.currentTime),
    
    // Other state
    collisionViolations,
    isLoadingRealData: dataSession.isLoading,
    
    // Computed
    getCurrentDataPoint: () => dataSession.getCurrentDataPoint(playerState.currentTime)
  };
}