/**
 * Error Boundary Stories
 * Testing error handling and recovery scenarios
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary } from '../../client/src/components/error-boundary';
import { DataErrorBoundary } from '../../client/src/components/data-error-boundary';
import { WidgetErrorBoundary } from '../../client/src/components/widget-error-boundary';
import { Button } from '../../client/src/components/ui/button';
import React from 'react';

// Component that throws an error for testing
const ErrorComponent: React.FC<{ shouldError?: boolean; errorMessage?: string }> = ({ 
  shouldError = false, 
  errorMessage = 'Test error occurred' 
}) => {
  if (shouldError) {
    throw new Error(errorMessage);
  }
  return <div className="p-4 bg-green-100 rounded">Component working normally</div>;
};

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/Error Boundaries',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Error boundaries catch JavaScript errors in component trees and display fallback UI.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

export const BasicErrorBoundary: Story = {
  args: {
    showDetails: true,
  },
  render: (args) => (
    <ErrorBoundary {...args}>
      <ErrorComponent />
    </ErrorBoundary>
  ),
};

export const ErrorBoundaryWithError: Story = {
  args: {
    showDetails: true,
  },
  render: (args) => (
    <ErrorBoundary {...args}>
      <ErrorComponent shouldError={true} errorMessage="This is a test error for demonstration" />
    </ErrorBoundary>
  ),
};

export const DataErrorBoundaryExample: Story = {
  render: () => (
    <DataErrorBoundary 
      dataSource="test-data-source"
      onRetry={() => console.log('Retrying data load...')}
    >
      <ErrorComponent shouldError={true} errorMessage="Data loading failed" />
    </DataErrorBoundary>
  ),
};

export const WidgetErrorBoundaryExample: Story = {
  render: () => (
    <WidgetErrorBoundary 
      widgetName="Test Widget"
      widgetId="widget-123"
      onRemove={() => console.log('Removing widget...')}
      onReset={() => console.log('Resetting widget...')}
    >
      <ErrorComponent shouldError={true} errorMessage="Widget rendering failed" />
    </WidgetErrorBoundary>
  ),
};

export const ErrorBoundaryWithCustomFallback: Story = {
  render: () => (
    <ErrorBoundary 
      fallback={
        <div className="p-4 bg-red-100 border border-red-300 rounded">
          <h3 className="font-bold text-red-800">Custom Error UI</h3>
          <p className="text-red-600">Something went wrong with a custom error display.</p>
        </div>
      }
    >
      <ErrorComponent shouldError={true} />
    </ErrorBoundary>
  ),
};

export const InteractiveErrorTest: Story = {
  render: () => {
    const [shouldError, setShouldError] = React.useState(false);
    
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={() => setShouldError(true)}>
            Trigger Error
          </Button>
          <Button onClick={() => setShouldError(false)} variant="outline">
            Reset Component
          </Button>
        </div>
        
        <ErrorBoundary 
          showDetails={true}
          resetKeys={[shouldError]}
        >
          <ErrorComponent shouldError={shouldError} />
        </ErrorBoundary>
      </div>
    );
  },
};
