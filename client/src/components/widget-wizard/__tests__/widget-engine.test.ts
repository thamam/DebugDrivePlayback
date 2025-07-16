/**
 * Unit tests for Widget Engine
 * Tests the core widget infrastructure and lifecycle management
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WidgetEngine, WidgetDefinition, WidgetInstance } from '../../../lib/widget-engine';

describe('WidgetEngine', () => {
  let engine: WidgetEngine;
  let mockWidgetDefinition: WidgetDefinition;

  beforeEach(() => {
    engine = new WidgetEngine();
    
    mockWidgetDefinition = {
      id: 'test-widget',
      name: 'Test Widget',
      type: 'test_chart',
      category: 'visualization',
      version: '1.0.0',
      inputs: [
        {
          name: 'test_input',
          type: 'signal',
          dataType: 'number',
          required: true,
          description: 'Test input signal'
        }
      ],
      outputs: [
        {
          name: 'test_output',
          type: 'chart',
          dataType: 'object',
          description: 'Test output chart'
        }
      ],
      configSchema: {
        testConfig: {
          type: 'string',
          default: 'test_value',
          description: 'Test configuration'
        }
      },
      implementation: {
        initialize: jest.fn().mockResolvedValue(undefined),
        process: jest.fn().mockResolvedValue({ test_output: { data: 'test' } }),
        render: jest.fn().mockReturnValue('test render')
      }
    };
  });

  describe('Widget Registration', () => {
    it('should register a widget definition successfully', () => {
      expect(() => engine.registerWidget(mockWidgetDefinition)).not.toThrow();
      
      const definitions = engine.getDefinitions();
      expect(definitions).toHaveLength(1);
      expect(definitions[0]).toEqual(mockWidgetDefinition);
    });

    it('should throw error for invalid widget definition', () => {
      const invalidDefinition = { ...mockWidgetDefinition, id: undefined };
      
      expect(() => engine.registerWidget(invalidDefinition as any)).toThrow();
    });

    it('should throw error for definition missing implementation', () => {
      const invalidDefinition = { ...mockWidgetDefinition, implementation: undefined };
      
      expect(() => engine.registerWidget(invalidDefinition as any)).toThrow();
    });
  });

  describe('Widget Instance Creation', () => {
    beforeEach(() => {
      engine.registerWidget(mockWidgetDefinition);
    });

    it('should create widget instance successfully', async () => {
      const instance = await engine.createWidget(
        'test-widget',
        'test-instance-1',
        'Test Instance',
        { testConfig: 'custom_value' }
      );

      expect(instance).toBeDefined();
      expect(instance.id).toBe('test-instance-1');
      expect(instance.name).toBe('Test Instance');
      expect(instance.status).toBe('active');
      expect(instance.config).toEqual({ testConfig: 'custom_value' });
      expect(mockWidgetDefinition.implementation.initialize).toHaveBeenCalled();
    });

    it('should throw error for non-existent widget definition', async () => {
      await expect(engine.createWidget(
        'non-existent',
        'test-instance',
        'Test',
        {}
      )).rejects.toThrow('Widget definition not found');
    });

    it('should validate configuration against schema', async () => {
      const invalidConfig = { invalidField: 'value' };
      
      // This should not throw since validation is lenient for extra fields
      await expect(engine.createWidget(
        'test-widget',
        'test-instance',
        'Test',
        invalidConfig
      )).resolves.toBeDefined();
    });
  });

  describe('Widget Processing', () => {
    let instance: WidgetInstance;

    beforeEach(async () => {
      engine.registerWidget(mockWidgetDefinition);
      instance = await engine.createWidget(
        'test-widget',
        'test-instance',
        'Test Instance',
        {}
      );
    });

    it('should process widget inputs successfully', async () => {
      const inputData = { test_input: 42 };
      
      await engine.processWidget('test-instance', inputData);
      
      expect(mockWidgetDefinition.implementation.process).toHaveBeenCalledWith(inputData);
      
      const updatedInstance = engine.getInstance('test-instance');
      expect(updatedInstance?.inputs).toEqual(inputData);
      expect(updatedInstance?.outputs).toEqual({ test_output: { data: 'test' } });
    });

    it('should handle processing errors gracefully', async () => {
      const mockError = new Error('Processing failed');
      (mockWidgetDefinition.implementation.process as jest.Mock).mockRejectedValue(mockError);
      
      await engine.processWidget('test-instance', { test_input: 42 });
      
      const updatedInstance = engine.getInstance('test-instance');
      expect(updatedInstance?.status).toBe('error');
      expect(updatedInstance?.metadata?.error).toBe('Processing failed');
    });

    it('should not process inactive widgets', async () => {
      engine.setWidgetStatus('test-instance', 'paused');
      
      await engine.processWidget('test-instance', { test_input: 42 });
      
      expect(mockWidgetDefinition.implementation.process).not.toHaveBeenCalled();
    });
  });

  describe('Widget Lifecycle Management', () => {
    let instance: WidgetInstance;

    beforeEach(async () => {
      engine.registerWidget(mockWidgetDefinition);
      instance = await engine.createWidget(
        'test-widget',
        'test-instance',
        'Test Instance',
        {}
      );
    });

    it('should set widget status correctly', () => {
      engine.setWidgetStatus('test-instance', 'paused');
      
      const updatedInstance = engine.getInstance('test-instance');
      expect(updatedInstance?.status).toBe('paused');
    });

    it('should update widget configuration', async () => {
      const newConfig = { testConfig: 'updated_value' };
      
      await engine.updateWidgetConfig('test-instance', newConfig);
      
      const updatedInstance = engine.getInstance('test-instance');
      expect(updatedInstance?.config).toEqual(newConfig);
      expect(mockWidgetDefinition.implementation.initialize).toHaveBeenCalledWith(newConfig);
    });

    it('should remove widget instance', async () => {
      const mockCleanup = jest.fn().mockResolvedValue(undefined);
      mockWidgetDefinition.implementation.cleanup = mockCleanup;
      
      await engine.removeWidget('test-instance');
      
      expect(mockCleanup).toHaveBeenCalled();
      expect(engine.getInstance('test-instance')).toBeUndefined();
    });

    it('should handle removal of non-existent widget', async () => {
      await expect(engine.removeWidget('non-existent')).resolves.not.toThrow();
    });
  });

  describe('Data Broadcasting', () => {
    beforeEach(async () => {
      engine.registerWidget(mockWidgetDefinition);
      await engine.createWidget(
        'test-widget',
        'test-instance',
        'Test Instance',
        {}
      );
    });

    it('should broadcast data to subscribed widgets', async () => {
      await engine.broadcastData('test_input', 42);
      
      expect(mockWidgetDefinition.implementation.process).toHaveBeenCalledWith({ test_input: 42 });
    });

    it('should handle broadcast to non-subscribed signals', async () => {
      await expect(engine.broadcastData('non_existent_signal', 42)).resolves.not.toThrow();
    });
  });

  describe('Widget Queries', () => {
    beforeEach(async () => {
      engine.registerWidget(mockWidgetDefinition);
      await engine.createWidget(
        'test-widget',
        'test-instance',
        'Test Instance',
        {}
      );
    });

    it('should return all widget definitions', () => {
      const definitions = engine.getDefinitions();
      expect(definitions).toHaveLength(1);
      expect(definitions[0].id).toBe('test-widget');
    });

    it('should return all widget instances', () => {
      const instances = engine.getInstances();
      expect(instances).toHaveLength(1);
      expect(instances[0].id).toBe('test-instance');
    });

    it('should return specific widget instance', () => {
      const instance = engine.getInstance('test-instance');
      expect(instance).toBeDefined();
      expect(instance?.id).toBe('test-instance');
    });

    it('should return undefined for non-existent instance', () => {
      const instance = engine.getInstance('non-existent');
      expect(instance).toBeUndefined();
    });
  });
});