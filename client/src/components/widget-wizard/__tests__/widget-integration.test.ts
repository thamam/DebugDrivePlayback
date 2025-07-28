/**
 * Integration tests for Widget System
 * Tests end-to-end widget workflow and system integration
 */

import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WidgetEngine, WidgetDefinition } from '../../../lib/widget-engine';
import { widgetTemplates } from '../../../lib/widget-templates';

describe('Widget System Integration', () => {
  let engine: WidgetEngine;

  beforeEach(() => {
    engine = new WidgetEngine();
  });

  describe('Template Registration and Loading', () => {
    it('should load all built-in templates', () => {
      const definitions = engine.getDefinitions();
      
      // Should have all built-in templates
      expect(definitions.length).toBeGreaterThan(0);
      
      // Should include core templates
      const templateIds = definitions.map(d => d.id);
      expect(templateIds).toContain('trajectory_visualizer');
      expect(templateIds).toContain('speed_analyzer');
      expect(templateIds).toContain('signal_monitor');
      expect(templateIds).toContain('data_exporter');
    });

    it('should have valid template implementations', () => {
      const definitions = engine.getDefinitions();
      
      definitions.forEach(definition => {
        expect(definition.implementation).toBeDefined();
        expect(definition.implementation.initialize).toBeDefined();
        expect(definition.implementation.process).toBeDefined();
        expect(definition.implementation.render).toBeDefined();
      });
    });
  });

  describe('End-to-End Widget Workflow', () => {
    it('should complete full widget lifecycle', async () => {
      // 1. Create widget from template
      const widgetInstance = await engine.createWidget(
        'trajectory_visualizer',
        'test-widget-1',
        'Test Trajectory Widget',
        {
          showPlannedPath: true,
          pathColor: '#ff0000',
          chartSize: 'large'
        }
      );

      expect(widgetInstance.id).toBe('test-widget-1');
      expect(widgetInstance.status).toBe('active');

      // 2. Process data through widget
      const mockData = {
        w_car_pose_now_x_: 10.5,
        w_car_pose_now_y: 20.3,
        path_x_data: [10, 11, 12],
        path_y_data: [20, 21, 22]
      };

      await engine.processWidget('test-widget-1', mockData);

      // 3. Verify widget processed data
      const updatedWidget = engine.getInstance('test-widget-1');
      expect(updatedWidget?.inputs).toEqual(mockData);
      expect(updatedWidget?.outputs).toHaveProperty('spatial_chart');
      expect(updatedWidget?.outputs).toHaveProperty('statistics');

      // 4. Update widget configuration
      await engine.updateWidgetConfig('test-widget-1', {
        showPlannedPath: false,
        pathColor: '#00ff00',
        chartSize: 'small'
      });

      const configUpdatedWidget = engine.getInstance('test-widget-1');
      expect(configUpdatedWidget?.config.showPlannedPath).toBe(false);
      expect(configUpdatedWidget?.config.pathColor).toBe('#00ff00');

      // 5. Pause and resume widget
      engine.setWidgetStatus('test-widget-1', 'paused');
      expect(engine.getInstance('test-widget-1')?.status).toBe('paused');

      engine.setWidgetStatus('test-widget-1', 'active');
      expect(engine.getInstance('test-widget-1')?.status).toBe('active');

      // 6. Remove widget
      await engine.removeWidget('test-widget-1');
      expect(engine.getInstance('test-widget-1')).toBeUndefined();
    });

    it('should handle multiple widgets simultaneously', async () => {
      // Create multiple widgets
      const widget1 = await engine.createWidget(
        'trajectory_visualizer',
        'widget-1',
        'Trajectory Widget',
        {}
      );

      const widget2 = await engine.createWidget(
        'speed_analyzer',
        'widget-2',
        'Speed Widget',
        {}
      );

      const widget3 = await engine.createWidget(
        'signal_monitor',
        'widget-3',
        'Signal Widget',
        {}
      );

      // Verify all widgets are active
      expect(engine.getInstances()).toHaveLength(3);
      expect(widget1.status).toBe('active');
      expect(widget2.status).toBe('active');
      expect(widget3.status).toBe('active');

      // Process different data through each widget
      await engine.processWidget('widget-1', {
        w_car_pose_now_x_: 10,
        w_car_pose_now_y: 20
      });

      await engine.processWidget('widget-2', {
        current_speed_mps: 25,
        timestamp: 1234567890
      });

      await engine.processWidget('widget-3', {
        signals: { signal1: 10, signal2: 20 },
        timestamp: 1234567890
      });

      // Verify all widgets processed their data
      const instances = engine.getInstances();
      instances.forEach(instance => {
        expect(instance.inputs).toBeDefined();
        expect(instance.outputs).toBeDefined();
      });
    });
  });

  describe('Data Broadcasting Integration', () => {
    it('should broadcast data to subscribed widgets', async () => {
      // Create widgets that subscribe to different signals
      await engine.createWidget(
        'trajectory_visualizer',
        'trajectory-widget',
        'Trajectory Widget',
        {}
      );

      await engine.createWidget(
        'speed_analyzer',
        'speed-widget',
        'Speed Widget',
        {}
      );

      // Broadcast trajectory data
      await engine.broadcastData('w_car_pose_now_x_', 15.5);
      await engine.broadcastData('w_car_pose_now_y', 25.3);

      // Verify trajectory widget received data
      const trajectoryWidget = engine.getInstance('trajectory-widget');
      expect(trajectoryWidget?.inputs).toHaveProperty('w_car_pose_now_x_');
      expect(trajectoryWidget?.inputs).toHaveProperty('w_car_pose_now_y');

      // Broadcast speed data
      await engine.broadcastData('current_speed_mps', 30.5);

      // Verify speed widget received data
      const speedWidget = engine.getInstance('speed-widget');
      expect(speedWidget?.inputs).toHaveProperty('current_speed_mps');
    });

    it('should handle broadcasting to non-subscribed signals', async () => {
      await engine.createWidget(
        'trajectory_visualizer',
        'trajectory-widget',
        'Trajectory Widget',
        {}
      );

      // Broadcast to non-subscribed signal
      await expect(engine.broadcastData('unknown_signal', 42)).resolves.not.toThrow();

      // Widget should not have received unknown signal
      const widget = engine.getInstance('trajectory-widget');
      expect(widget?.inputs).not.toHaveProperty('unknown_signal');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle widget processing errors gracefully', async () => {
      // Create widget with mock implementation that throws error
      const mockDefinition = {
        ...widgetTemplates[0],
        id: 'error-widget',
        implementation: {
          initialize: jest.fn<(config: Record<string, any>) => Promise<void>>().mockResolvedValue(undefined),
          process: jest.fn<(inputs: Record<string, any>) => Promise<Record<string, any>>>().mockRejectedValue(new Error('Processing error')),
          render: jest.fn<(data: Record<string, any>) => React.ReactNode>().mockReturnValue('Error widget')
        }
      };

      engine.registerWidget(mockDefinition as WidgetDefinition);

      const widget = await engine.createWidget(
        'error-widget',
        'error-widget-1',
        'Error Widget',
        {}
      );

      // Process data that will cause error (providing required inputs)
      await engine.processWidget('error-widget-1', { 
        w_car_pose_now_x_: 10.0,
        w_car_pose_now_y: 20.0 
      });

      // Widget should be in error state
      const errorWidget = engine.getInstance('error-widget-1');
      expect(errorWidget?.status).toBe('error');
      expect(errorWidget?.metadata?.error).toBe('Processing error');
    });

    it('should handle widget creation errors', async () => {
      // Try to create widget with invalid template
      await expect(engine.createWidget(
        'non-existent-template',
        'test-widget',
        'Test Widget',
        {}
      )).rejects.toThrow('Widget definition not found');
    });

    it('should handle configuration validation errors', async () => {
      // Create widget with invalid configuration
      const template = widgetTemplates.find(t => t.id === 'trajectory_visualizer');
      if (template) {
        // Add validation to config schema
        template.configSchema.testRequired = {
          type: 'string',
          validation: { required: true }
        };

        await expect(engine.createWidget(
          'trajectory_visualizer',
          'test-widget',
          'Test Widget',
          {} // Missing required field
        )).rejects.toThrow('Required config field missing');
      }
    });
  });

  describe('Performance Integration', () => {
    it('should handle large numbers of widgets efficiently', async () => {
      const startTime = Date.now();
      
      // Create 50 widgets
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(engine.createWidget(
          'signal_monitor',
          `widget-${i}`,
          `Widget ${i}`,
          {}
        ));
      }

      await Promise.all(promises);

      const creationTime = Date.now() - startTime;
      expect(creationTime).toBeLessThan(5000); // Should complete in under 5 seconds

      // Verify all widgets are created
      expect(engine.getInstances()).toHaveLength(50);
    });

    it('should handle concurrent data processing', async () => {
      // Create multiple widgets
      await engine.createWidget('signal_monitor', 'widget-1', 'Widget 1', {});
      await engine.createWidget('signal_monitor', 'widget-2', 'Widget 2', {});
      await engine.createWidget('signal_monitor', 'widget-3', 'Widget 3', {});

      const startTime = Date.now();

      // Process data concurrently
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(engine.broadcastData('signals', { test_signal: i }));
      }

      await Promise.all(promises);

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(2000); // Should complete in under 2 seconds

      // Verify all widgets processed the data
      const instances = engine.getInstances();
      instances.forEach(instance => {
        expect(instance.inputs).toHaveProperty('signals');
      });
    });
  });

  describe('Memory Management Integration', () => {
    it('should clean up widget resources on removal', async () => {
      const mockCleanup = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      
      // Create widget with cleanup function
      const mockDefinition = {
        ...widgetTemplates[0],
        id: 'cleanup-widget',
        configSchema: {}, // Use empty config schema to avoid validation issues
        implementation: {
          initialize: jest.fn<(config: Record<string, any>) => Promise<void>>().mockResolvedValue(undefined),
          process: jest.fn<(inputs: Record<string, any>) => Promise<Record<string, any>>>().mockResolvedValue({}),
          render: jest.fn<(data: Record<string, any>) => React.ReactNode>().mockReturnValue('Cleanup widget'),
          cleanup: mockCleanup
        }
      };

      engine.registerWidget(mockDefinition as WidgetDefinition);

      await engine.createWidget(
        'cleanup-widget',
        'cleanup-widget-1',
        'Cleanup Widget',
        {}
      );

      // Remove widget
      await engine.removeWidget('cleanup-widget-1');

      // Verify cleanup was called
      expect(mockCleanup).toHaveBeenCalled();
    });

    it('should handle widget removal without cleanup function', async () => {
      await engine.createWidget(
        'trajectory_visualizer',
        'no-cleanup-widget',
        'No Cleanup Widget',
        { testRequired: 'test_value' } // Provide required config value
      );

      // Should not throw error when removing widget without cleanup
      await expect(engine.removeWidget('no-cleanup-widget')).resolves.not.toThrow();
    });
  });
});
