/**
 * UI State Hook - Manages sidebar, tabs, and UI-related state
 * Simplified from the massive use-debug-player hook
 */
import { useState } from 'react';
import { mockActiveSignals } from '@/lib/mock-data';

export function useUIState() {
  const [selectedTab, setSelectedTab] = useState('temporal');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeSignals, setActiveSignals] = useState(mockActiveSignals);

  const toggleSignal = (signal: string) => {
    setActiveSignals(prev => ({
      ...prev,
      [signal]: !prev[signal as keyof typeof prev]
    }));
  };

  return {
    selectedTab,
    leftSidebarOpen,
    rightSidebarOpen,
    activeSignals,
    setSelectedTab,
    setLeftSidebarOpen,
    setRightSidebarOpen,
    toggleSignal
  };
}
