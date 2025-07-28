/**
 * Navigation Component Stories
 * Testing navigation behavior and states
 */

import type { Meta, StoryObj } from '@storybook/react';
import Navigation from '../../client/src/components/navigation';
import { Router } from 'wouter';

const meta: Meta<typeof Navigation> = {
  title: 'Components/Navigation',
  component: Navigation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main navigation component for the Debug Player Framework.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Router>
        <Story />
      </Router>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Navigation>;

export const Default: Story = {};

export const NavigationInContainer: Story = {
  decorators: [
    (Story) => (
      <Router>
        <div className="min-h-screen bg-background">
          <Story />
          <main className="p-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-4">Example Page Content</h1>
              <p className="text-muted-foreground">
                This shows how the navigation looks with page content below it.
              </p>
            </div>
          </main>
        </div>
      </Router>
    ),
  ],
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
