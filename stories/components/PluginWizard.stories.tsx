/**
 * Plugin Wizard Stories
 * Testing plugin creation workflow and configurations
 */

import type { Meta, StoryObj } from '@storybook/react';
import PluginWizard from '../../client/src/components/plugin-wizard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof PluginWizard> = {
  title: 'Components/Plugin Wizard',
  component: PluginWizard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Wizard component for creating custom plugins and widgets.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="w-full max-w-4xl">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PluginWizard>;

export const Default: Story = {
  args: {
    onSubmit: (data: any) => console.log('Plugin submitted:', data),
    isLoading: false,
  },
};

export const LoadingState: Story = {
  args: {
    onSubmit: (data: any) => console.log('Plugin submitted:', data),
    isLoading: true,
  },
};

export const InCreateMode: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Plugin wizard in creation mode for testing the full workflow.',
      },
    },
  },
};

export const WithValidationErrors: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Testing form validation and error states.',
      },
    },
  },
};
