/**
 * Debug Player Page Stories
 * Testing the main debug player interface
 */

import type { Meta, StoryObj } from '@storybook/react';
import DebugPlayer from '../../client/src/pages/debug-player';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import { TooltipProvider } from '../../client/src/components/ui/tooltip';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const meta: Meta<typeof DebugPlayer> = {
  title: 'Pages/Debug Player',
  component: DebugPlayer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main debug player interface for analyzing vehicle data.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router>
            <Story />
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DebugPlayer>;

export const Default: Story = {};

export const WithLoadedData: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Debug player with simulated loaded trip data.',
      },
    },
  },
};

export const ErrorState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Debug player in error state when data loading fails.',
      },
    },
  },
};