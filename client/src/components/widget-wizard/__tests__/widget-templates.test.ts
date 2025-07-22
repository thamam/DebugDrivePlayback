/**
 * Unit tests for Widget Templates
 * Tests pre-built widget template implementations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { widgetTemplates } from '../../../lib/widget-templates';

describe('Widget Templates', () => {
  describe('Template Structure', () => {
    it('should have all required templates', () => {
      const expectedTemplates = [
        'trajectory_visualizer',
        'speed_analyzer',
        'signal_monitor',
        'data_exporter'
      ];

      const templateIds = widgetTemplates.map(t => t.id);
      expectedTemplates.forEach(id => {
        expect(templateIds).toContain(id);
      });
    });

    it('should have valid template structure', () => {
      widgetTemplates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('type');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('version');
        expect(template).toHaveProperty('inputs');
        expect(template).toHaveProperty('outputs');
        expect(template).toHaveProperty('configSchema');
        expect(template).toHaveProperty('implementation');
      });
    });

    it('should have valid implementation methods', () => {
      widgetTemplates.forEach(template => {
        expect(template.implementation).toHaveProperty('initialize');
        expect(template.implementation).toHaveProperty('process');
        expect(template.implementation).toHaveProperty('render');
        expect(typeof template.implementation.initialize).toBe('function');
        expect(typeof template.implementation.process).toBe('function');
        expect(typeof template.implementation.render).toBe('function');
      });
    });
  });

  describe('Trajectory Visualizer Template', () => {
    let trajectoryTemplate: any;

    beforeEach(() => {
      trajectoryTemplate = widgetTemplates.find(t => t.id === 'trajectory_visualizer');
    });

    it('should have correct configuration', () => {
      expect(trajectoryTemplate.name).toBe('Trajectory Visualizer');
      expect(trajectoryTemplate.category).toBe('visualization');
      expect(trajectoryTemplate.inputs).toHaveLength(4);
      expect(trajectoryTemplate.outputs).toHaveLength(2);
    });

    it('should process trajectory data correctly', async () => {
      const mockInputs = {
        w_car_pose_now_x_: 10.5,
        w_car_pose_now_y: 20.3,
        path_x_data: [10, 11, 12],
        path_y_data: [20, 21, 22]
      };

      const result = await trajectoryTemplate.implementation.process(mockInputs);

      expect(result).toHaveProperty('spatial_chart');
      expect(result).toHaveProperty('statistics');
      expect(result.spatial_chart).toHaveLength(4); // 1 actual + 3 planned
      expect(result.statistics.totalPoints).toBe(4);
      expect(result.statistics.actualPoints).toBe(1);
      expect(result.statistics.plannedPoints).toBe(3);
    });

    it('should handle missing planned path data', async () => {
      const mockInputs = {
        w_car_pose_now_x_: 10.5,
        w_car_pose_now_y: 20.3
      };

      const result = await trajectoryTemplate.implementation.process(mockInputs);

      expect(result.spatial_chart).toHaveLength(1);
      expect(result.statistics.actualPoints).toBe(1);
      expect(result.statistics.plannedPoints).toBe(0);
    });

    it('should initialize without errors', async () => {
      const mockConfig = {
        showPlannedPath: true,
        pathColor: '#ff0000',
        chartSize: 'large'
      };

      await expect(trajectoryTemplate.implementation.initialize(mockConfig)).resolves.not.toThrow();
    });
  });

  describe('Speed Analyzer Template', () => {
    let speedTemplate: any;

    beforeEach(() => {
      speedTemplate = widgetTemplates.find(t => t.id === 'speed_analyzer');
    });

    it('should have correct configuration', () => {
      expect(speedTemplate.name).toBe('Speed Analyzer');
      expect(speedTemplate.category).toBe('analysis');
      expect(speedTemplate.inputs).toHaveLength(3);
      expect(speedTemplate.outputs).toHaveLength(2);
    });

    it('should process speed data correctly', async () => {
      const mockInputs = {
        current_speed_mps: 25.5,
        target_speed_mps: 30.0,
        timestamp: 1234567890
      };

      const result = await speedTemplate.implementation.process(mockInputs);

      expect(result).toHaveProperty('speed_chart');
      expect(result).toHaveProperty('speed_stats');
      expect(result.speed_chart).toHaveLength(1);
      expect(result.speed_chart[0]).toMatchObject({
        time: 1234567890,
        current: 25.5,
        target: 30.0
      });
      expect(result.speed_stats.average).toBe(25.5);
      expect(result.speed_stats.maximum).toBe(25.5);
    });

    it('should handle missing target speed', async () => {
      const mockInputs = {
        current_speed_mps: 25.5,
        timestamp: 1234567890
      };

      const result = await speedTemplate.implementation.process(mockInputs);

      expect(result.speed_chart[0].target).toBe(25.5); // Should default to current
    });

    it('should calculate statistics correctly', async () => {
      const mockInputs = {
        current_speed_mps: 25.5,
        target_speed_mps: 30.0,
        timestamp: 1234567890
      };

      const result = await speedTemplate.implementation.process(mockInputs);

      expect(result.speed_stats).toMatchObject({
        average: 25.5,
        maximum: 25.5,
        dataPoints: 1
      });
      expect(result.speed_stats.variance).toBe(0);
    });
  });

  describe('Signal Monitor Template', () => {
    let signalTemplate: any;

    beforeEach(() => {
      signalTemplate = widgetTemplates.find(t => t.id === 'signal_monitor');
    });

    it('should have correct configuration', () => {
      expect(signalTemplate.name).toBe('Signal Monitor');
      expect(signalTemplate.category).toBe('visualization');
      expect(signalTemplate.inputs).toHaveLength(2);
      expect(signalTemplate.outputs).toHaveLength(2);
    });

    it('should process signal data correctly', async () => {
      const mockInputs = {
        signals: {
          signal1: 10.5,
          signal2: 'active',
          signal3: 20.3
        },
        timestamp: 1234567890
      };

      const result = await signalTemplate.implementation.process(mockInputs);

      expect(result).toHaveProperty('signal_chart');
      expect(result).toHaveProperty('signal_stats');
      expect(result.signal_chart).toHaveLength(1);
      expect(result.signal_chart[0]).toMatchObject({
        time: 1234567890,
        signal1: 10.5,
        signal3: 20.3
      });
      expect(result.signal_chart[0]).not.toHaveProperty('signal2'); // String values filtered out
    });

    it('should handle empty signals', async () => {
      const mockInputs = {
        signals: {},
        timestamp: 1234567890
      };

      const result = await signalTemplate.implementation.process(mockInputs);

      expect(result.signal_chart).toHaveLength(1);
      expect(result.signal_chart[0]).toEqual({ time: 1234567890 });
      expect(result.signal_stats.signalCount).toBe(0);
    });
  });

  describe('Data Exporter Template', () => {
    let exporterTemplate: any;

    beforeEach(() => {
      exporterTemplate = widgetTemplates.find(t => t.id === 'data_exporter');
    });

    it('should have correct configuration', () => {
      expect(exporterTemplate.name).toBe('Data Exporter');
      expect(exporterTemplate.category).toBe('export');
      expect(exporterTemplate.inputs).toHaveLength(2);
      expect(exporterTemplate.outputs).toHaveLength(3);
    });

    it('should export data as CSV', async () => {
      const mockInputs = {
        data: [
          { time: 1, value: 10 },
          { time: 2, value: 20 }
        ],
        format: 'csv'
      };

      const result = await exporterTemplate.implementation.process(mockInputs);

      expect(result).toHaveProperty('csv_file');
      expect(result).toHaveProperty('export_stats');
      expect(result.csv_file).toBe('time,value\n1,10\n2,20');
      expect(result.json_file).toBeNull();
      expect(result.export_stats.format).toBe('csv');
    });

    it('should export data as JSON', async () => {
      const mockInputs = {
        data: [
          { time: 1, value: 10 },
          { time: 2, value: 20 }
        ],
        format: 'json'
      };

      const result = await exporterTemplate.implementation.process(mockInputs);

      expect(result).toHaveProperty('json_file');
      expect(result).toHaveProperty('export_stats');
      expect(result.json_file).toBe(JSON.stringify(mockInputs.data, null, 2));
      expect(result.csv_file).toBeNull();
      expect(result.export_stats.format).toBe('json');
    });

    it('should handle empty data', async () => {
      const mockInputs = {
        data: [],
        format: 'csv'
      };

      const result = await exporterTemplate.implementation.process(mockInputs);

      expect(result.csv_file).toBe('');
      expect(result.export_stats.size).toBe(0);
    });
  });

  describe('Configuration Schemas', () => {
    it('should have valid configuration schemas', () => {
      widgetTemplates.forEach(template => {
        Object.entries(template.configSchema).forEach(([key, schema]) => {
          expect(schema).toHaveProperty('type');
          expect(schema).toHaveProperty('default');
          expect(schema).toHaveProperty('description');
          
          if (schema.type === 'select') {
            expect(schema).toHaveProperty('options');
            expect(Array.isArray(schema.options)).toBe(true);
          }
        });
      });
    });

    it('should have reasonable default values', () => {
      const trajectoryTemplate = widgetTemplates.find(t => t.id === 'trajectory_visualizer');
      
      expect(trajectoryTemplate!.configSchema.showPlannedPath.default).toBe(true);
      expect(trajectoryTemplate!.configSchema.pathColor.default).toBe('#8884d8');
      expect(trajectoryTemplate!.configSchema.chartSize.default).toBe('medium');
    });
  });
});