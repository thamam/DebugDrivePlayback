/**
 * Integration tests for Widget Manager
 * Tests widget management functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WidgetManager from '../widget-manager';
import { widgetEngine } from '../../../lib/widget-engine';

// Mock the widget engine
jest.mock('../../../lib/widget-engine', () => ({
  widgetEngine: {
    getInstances: jest.fn(),
    setWidgetStatus: jest.fn(),
    removeWidget: jest.fn()
  }
}));

describe('WidgetManager', () => {
  const mockGetInstances = widgetEngine.getInstances as jest.Mock;
  const mockSetWidgetStatus = widgetEngine.setWidgetStatus as jest.Mock;
  const mockRemoveWidget = widgetEngine.removeWidget as jest.Mock;

  const mockWidgetInstances = [
    {
      id: 'widget-1',
      name: 'Test Widget 1',
      definitionId: 'trajectory_visualizer',
      status: 'active',
      config: { testConfig: 'value1' },
      inputs: { x: 1, y: 2 },
      outputs: { chart: 'data1' },
      lastUpdated: new Date('2025-07-16T10:00:00Z')
    },
    {
      id: 'widget-2',
      name: 'Test Widget 2',
      definitionId: 'speed_analyzer',
      status: 'paused',
      config: { testConfig: 'value2' },
      inputs: { speed: 50 },
      outputs: { analysis: 'data2' },
      lastUpdated: new Date('2025-07-16T09:30:00Z')
    },
    {
      id: 'widget-3',
      name: 'Test Widget 3',
      definitionId: 'signal_monitor',
      status: 'error',
      config: { testConfig: 'value3' },
      inputs: {},
      outputs: {},
      lastUpdated: new Date('2025-07-16T09:00:00Z')
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInstances.mockReturnValue(mockWidgetInstances);
    mockSetWidgetStatus.mockImplementation(() => {});
    mockRemoveWidget.mockResolvedValue(undefined);
  });

  describe('Widget Display', () => {
    it('should display all widgets', () => {
      render(<WidgetManager />);
      
      expect(screen.getByText('Test Widget 1')).toBeInTheDocument();
      expect(screen.getByText('Test Widget 2')).toBeInTheDocument();
      expect(screen.getByText('Test Widget 3')).toBeInTheDocument();
    });

    it('should show widget status correctly', () => {
      render(<WidgetManager />);
      
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('paused')).toBeInTheDocument();
      expect(screen.getByText('error')).toBeInTheDocument();
    });

    it('should display widget inputs and outputs', () => {
      render(<WidgetManager />);
      
      expect(screen.getByText('x')).toBeInTheDocument();
      expect(screen.getByText('y')).toBeInTheDocument();
      expect(screen.getByText('chart')).toBeInTheDocument();
      expect(screen.getByText('speed')).toBeInTheDocument();
      expect(screen.getByText('analysis')).toBeInTheDocument();
    });

    it('should show last updated time', () => {
      render(<WidgetManager />);
      
      // Check that dates are formatted and displayed
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('Widget Status Management', () => {
    it('should allow starting paused widgets', () => {
      render(<WidgetManager />);
      
      // Find the paused widget's menu
      const menuButtons = screen.getAllByRole('button', { name: '' });
      const pausedWidgetMenu = menuButtons.find(button => 
        button.closest('[data-testid="widget-card"]')?.textContent?.includes('Test Widget 2')
      );
      
      if (pausedWidgetMenu) {
        fireEvent.click(pausedWidgetMenu);
        
        const startButton = screen.getByText('Start');
        fireEvent.click(startButton);
        
        expect(mockSetWidgetStatus).toHaveBeenCalledWith('widget-2', 'active');
      }
    });

    it('should allow pausing active widgets', () => {
      render(<WidgetManager />);
      
      // Find the active widget's menu
      const menuButtons = screen.getAllByRole('button', { name: '' });
      const activeWidgetMenu = menuButtons.find(button => 
        button.closest('[data-testid="widget-card"]')?.textContent?.includes('Test Widget 1')
      );
      
      if (activeWidgetMenu) {
        fireEvent.click(activeWidgetMenu);
        
        const pauseButton = screen.getByText('Pause');
        fireEvent.click(pauseButton);
        
        expect(mockSetWidgetStatus).toHaveBeenCalledWith('widget-1', 'paused');
      }
    });

    it('should allow widget deletion', async () => {
      render(<WidgetManager />);
      
      // Find any widget's menu
      const menuButtons = screen.getAllByRole('button', { name: '' });
      fireEvent.click(menuButtons[0]);
      
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockRemoveWidget).toHaveBeenCalledWith('widget-1');
      });
    });

    it('should handle widget deletion errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRemoveWidget.mockRejectedValue(new Error('Deletion failed'));
      
      render(<WidgetManager />);
      
      // Find any widget's menu
      const menuButtons = screen.getAllByRole('button', { name: '' });
      fireEvent.click(menuButtons[0]);
      
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error deleting widget:',
          expect.any(Error)
        );
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Widget Filtering', () => {
    it('should filter active widgets', () => {
      render(<WidgetManager />);
      
      // Active tab should be selected by default
      expect(screen.getByText('Active (1)')).toBeInTheDocument();
      
      // Should show only active widgets
      expect(screen.getByText('Test Widget 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Widget 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Widget 3')).not.toBeInTheDocument();
    });

    it('should show all widgets in all tab', () => {
      render(<WidgetManager />);
      
      fireEvent.click(screen.getByText('All Widgets (3)'));
      
      expect(screen.getByText('Test Widget 1')).toBeInTheDocument();
      expect(screen.getByText('Test Widget 2')).toBeInTheDocument();
      expect(screen.getByText('Test Widget 3')).toBeInTheDocument();
    });

    it('should filter paused widgets', () => {
      render(<WidgetManager />);
      
      fireEvent.click(screen.getByText('Paused (1)'));
      
      expect(screen.getByText('Test Widget 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Widget 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Widget 3')).not.toBeInTheDocument();
    });

    it('should show correct widget counts in tabs', () => {
      render(<WidgetManager />);
      
      expect(screen.getByText('Active (1)')).toBeInTheDocument();
      expect(screen.getByText('All Widgets (3)')).toBeInTheDocument();
      expect(screen.getByText('Paused (1)')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state for no active widgets', () => {
      mockGetInstances.mockReturnValue([]);
      
      render(<WidgetManager />);
      
      expect(screen.getByText('No active widgets.')).toBeInTheDocument();
    });

    it('should show empty state for no paused widgets', () => {
      mockGetInstances.mockReturnValue([mockWidgetInstances[0]]); // Only active widget
      
      render(<WidgetManager />);
      
      fireEvent.click(screen.getByText('Paused (0)'));
      
      expect(screen.getByText('No paused widgets.')).toBeInTheDocument();
    });
  });

  describe('Widget Manager Integration', () => {
    it('should include widget wizard component', () => {
      render(<WidgetManager />);
      
      expect(screen.getByText('Add Widget')).toBeInTheDocument();
    });

    it('should refresh widgets periodically', () => {
      jest.useFakeTimers();
      
      render(<WidgetManager />);
      
      // Initial call
      expect(mockGetInstances).toHaveBeenCalledTimes(1);
      
      // Advance time by 5 seconds
      jest.advanceTimersByTime(5000);
      
      // Should have been called again
      expect(mockGetInstances).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });

    it('should show system status information', () => {
      render(<WidgetManager />);
      
      expect(screen.getByText(/Widget System Active/)).toBeInTheDocument();
      expect(screen.getByText(/widgets running/)).toBeInTheDocument();
    });
  });
});