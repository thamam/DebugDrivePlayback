import type { Meta, StoryObj } from '@storybook/react';
import TrajectoryVisualizerV2 from '../../client/src/components/trajectory-visualizer-v2';

const meta: Meta<typeof TrajectoryVisualizerV2> = {
  title: 'Components/TrajectoryVisualizer',
  component: TrajectoryVisualizerV2,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Enhanced trajectory visualizer that displays vehicle movement paths with real GPS data and interactive controls.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    sessionId: {
      control: 'text',
      description: 'Session ID for loading trajectory data',
    },
    currentTime: {
      control: { type: 'range', min: 0, max: 180, step: 0.1 },
      description: 'Current playback time in seconds',
    },
    duration: {
      control: { type: 'range', min: 0, max: 300, step: 1 },
      description: 'Total duration of the trip in seconds',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sessionId: 'demo-session',
    currentTime: 0,
    duration: 179.2,
  },
};

export const WithPlayback: Story = {
  args: {
    sessionId: 'demo-session',
    currentTime: 45.5,
    duration: 179.2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Trajectory visualizer showing playback at a specific timestamp.',
      },
    },
  },
};

export const MidJourney: Story = {
  args: {
    sessionId: 'demo-session',
    currentTime: 89.6,
    duration: 179.2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Visualizer showing the middle of a journey with vehicle position indicator.',
      },
    },
  },
};

export const EndOfTrip: Story = {
  args: {
    sessionId: 'demo-session',
    currentTime: 179.0,
    duration: 179.2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Visualizer showing the end of the trip.',
      },
    },
  },
};

export const NoData: Story = {
  args: {
    sessionId: null,
    currentTime: 0,
    duration: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Visualizer when no session data is available.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    sessionId: 'loading-session',
    currentTime: 0,
    duration: 100,
  },
  parameters: {
    mockData: [
      {
        url: '/api/data-range',
        method: 'POST',
        delay: 2000, // 2 second delay to show loading
        status: 200,
        response: {
          dataPoints: [],
        },
      },
    ],
    docs: {
      description: {
        story: 'Visualizer in loading state while fetching trajectory data.',
      },
    },
  },
};