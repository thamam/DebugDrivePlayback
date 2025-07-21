/**
 * Storybook helper utilities and decorators
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import { TooltipProvider } from '../../client/src/components/ui/tooltip';
import { Toaster } from '../../client/src/components/ui/toaster';
import { ErrorBoundary } from '../../client/src/components/error-boundary';

// Create a clean query client for each story
export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Standard app decorator with all necessary providers
export const withAppProviders = (Story: React.ComponentType) => {
  const queryClient = createQueryClient();
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router>
            <Story />
            <Toaster />
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// Decorator for components that need just the UI providers
export const withUIProviders = (Story: React.ComponentType) => (
  <TooltipProvider>
    <Story />
    <Toaster />
  </TooltipProvider>
);

// Decorator for components that need query client
export const withQueryClient = (Story: React.ComponentType) => {
  const queryClient = createQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  );
};

// Decorator for routing-dependent components
export const withRouter = (Story: React.ComponentType) => (
  <Router>
    <Story />
  </Router>
);

// Mock API responses for Storybook
export const mockApiResponses = {
  '/api/health': {
    status: 'healthy',
    lastCheck: Date.now(),
    uptime: 3600,
    version: '2.0.0'
  },
  
  '/api/sessions/load': {
    id: 'session-123',
    name: 'Mock Session',
    duration: 180,
    startTime: Date.now() - 180000,
    endTime: Date.now(),
    signals: ['vehicle_speed', 'steering_wheel_angle'],
    dataPoints: 1800,
    source: {
      type: 'demo',
      connectionStatus: 'connected'
    }
  },
  
  '/api/signals': {
    vehicle_speed: {
      name: 'Vehicle Speed',
      type: 'numeric',
      units: 'km/h',
      description: 'Current vehicle speed'
    },
    steering_wheel_angle: {
      name: 'Steering Wheel Angle',
      type: 'numeric',
      units: 'degrees',
      description: 'Steering wheel angle'
    }
  }
};

// Helper to setup MSW handlers for Storybook
export const createMockHandlers = () => {
  // This would be used with MSW if needed
  console.log('Mock handlers created for Storybook');
};