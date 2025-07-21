/**
 * Integration Status Stories
 * Testing connection status and integration indicators
 */

import type { Meta, StoryObj } from '@storybook/react';
import IntegrationStatus from '../../client/src/components/integration-status';

const meta: Meta<typeof IntegrationStatus> = {
  title: 'Components/Integration Status',
  component: IntegrationStatus,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Shows the status of various integrations and connections.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof IntegrationStatus>;

export const Default: Story = {
  args: {
    onTestTripData: () => console.log('Testing trip data...'),
  },
};

export const WithTestAction: Story = {
  args: {
    onTestTripData: () => {
      console.log('Testing trip data...');
      alert('Trip data test initiated!');
    },
  },
};