/**
 * Widget Manager Page Stories
 * Testing widget management interface
 */

import type { Meta, StoryObj } from '@storybook/react';
import WidgetManager from '../../client/src/pages/widget-manager';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import { TooltipProvider } from '../../client/src/components/ui/tooltip';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof WidgetManager> = {
  title: 'Pages/Widget Manager',
  component: WidgetManager,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interface for creating and managing custom widgets.',
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
type Story = StoryObj<typeof WidgetManager>;

export const Default: Story = {};

export const WithExistingWidgets: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Widget manager with existing widgets loaded.',
      },
    },
  },
};
