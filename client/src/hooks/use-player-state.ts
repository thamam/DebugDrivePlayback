/**
 * Player State Hook - Manages playback controls (time, play/pause, speed)
 * Simplified from the massive use-debug-player hook
 */
import { useState, useEffect } from 'react';

export function usePlayerState(maxTime: number = 932) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

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

  const jumpToTime = (time: number) => {
    setCurrentTime(time);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${minutes.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
  };

  return {
    currentTime,
    isPlaying,
    playbackSpeed,
    setCurrentTime,
    setPlaybackSpeed,
    togglePlayback,
    resetTime,
    skipToEnd,
    jumpToTime,
    formatTime
  };
}
