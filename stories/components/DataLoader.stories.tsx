import type { Meta, StoryObj } from '@storybook/react';
import DataLoaderV2 from '../../client/src/components/data-loader-v2';

const meta: Meta<typeof DataLoaderV2> = {
  title: 'Components/DataLoader',
  component: DataLoaderV2,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enhanced data loader component with real/demo data support and improved error handling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onLoadComplete: { action: 'load-complete' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onLoadComplete: (data) => {
      console.log('Load complete:', data);
    },
  },
};

export const Loading: Story = {
  args: {
    onLoadComplete: (data) => {
      console.log('Load complete:', data);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Data loader in loading state.',
      },
    },
  },
};

export const WithMockBackend: Story = {
  args: {
    onLoadComplete: (data) => {
      console.log('Load complete:', data);
    },
  },
  parameters: {
    mockData: [
      {
        url: '/api/health',
        method: 'GET',
        status: 200,
        response: {
          status: 'healthy',
          backend_type: 'python',
          version: '1.0.0'
        },
      },
      {
        url: '/api/sessions/load',
        method: 'POST',
        status: 200,
        response: {
          id: 'session-123',
          name: 'Test Trip',
          duration: 100,
          signals: ['vehicle_speed', 'steering_wheel_angle'],
          dataPoints: 1000,
          source: { type: 'real', connectionStatus: 'connected' }
        },
      },
    ],
    docs: {
      description: {
        story: 'Data loader with mocked backend responses for testing.',
      },
    },
  },
};
