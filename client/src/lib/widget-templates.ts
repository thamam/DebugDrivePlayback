/**
 * Widget Templates - Pre-built widget implementations for common use cases
 * These templates provide the foundation for the Widget Wizard
 */

import { WidgetDefinition, WidgetImplementation } from './widget-engine';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import React from 'react';

/**
 * Trajectory Visualizer Widget
 * Displays vehicle trajectory using actual path data
 */
const trajectoryVisualizerImplementation: WidgetImplementation = {
  initialize: async (config) => {
    // Initialize trajectory visualization
    console.log('Initializing trajectory visualizer with config:', config);
  },
  
  process: async (inputs) => {
    // Process trajectory data
    const { w_car_pose_now_x_, w_car_pose_now_y, path_x_data, path_y_data } = inputs;
    
    // Create trajectory points from real data
    const trajectoryPoints = [];
    if (w_car_pose_now_x_ && w_car_pose_now_y) {
      trajectoryPoints.push({
        x: w_car_pose_now_x_,
        y: w_car_pose_now_y,
        type: 'actual'
      });
    }
    
    // Add planned path points if available
    if (path_x_data && path_y_data) {
      for (let i = 0; i < Math.min(path_x_data.length, path_y_data.length); i++) {
        trajectoryPoints.push({
          x: path_x_data[i],
          y: path_y_data[i],
          type: 'planned'
        });
      }
    }
    
    return {
      spatial_chart: trajectoryPoints,
      statistics: {
        totalPoints: trajectoryPoints.length,
        actualPoints: trajectoryPoints.filter(p => p.type === 'actual').length,
        plannedPoints: trajectoryPoints.filter(p => p.type === 'planned').length
      }
    };
  },
  
  render: (data) => {
    const { spatial_chart } = data;
    
    return React.createElement(ResponsiveContainer, { width: '100%', height: 300 },
      React.createElement(ScatterChart, { data: spatial_chart },
        React.createElement(CartesianGrid, { strokeDasharray: '3 3' }),
        React.createElement(XAxis, { dataKey: 'x', type: 'number' }),
        React.createElement(YAxis, { dataKey: 'y', type: 'number' }),
        React.createElement(Tooltip),
        React.createElement(Scatter, { dataKey: 'x', fill: '#8884d8' })
      )
    );
  }
};

/**
 * Speed Analyzer Widget
 * Analyzes vehicle speed patterns from real data
 */
const speedAnalyzerImplementation: WidgetImplementation = {
  initialize: async (config) => {
    console.log('Initializing speed analyzer with config:', config);
  },
  
  process: async (inputs) => {
    const { current_speed_mps, target_speed_mps, timestamp } = inputs;
    
    // Create speed analysis data
    const speedData = [];
    if (current_speed_mps !== undefined && timestamp !== undefined) {
      speedData.push({
        time: timestamp,
        current: current_speed_mps,
        target: target_speed_mps || current_speed_mps
      });
    }
    
    // Calculate statistics
    const avgSpeed = speedData.reduce((sum, d) => sum + d.current, 0) / speedData.length;
    const maxSpeed = Math.max(...speedData.map(d => d.current));
    const speedVariance = speedData.reduce((sum, d) => sum + Math.pow(d.current - avgSpeed, 2), 0) / speedData.length;
    
    return {
      speed_chart: speedData,
      speed_stats: {
        average: avgSpeed,
        maximum: maxSpeed,
        variance: speedVariance,
        dataPoints: speedData.length
      }
    };
  },
  
  render: (data) => {
    const { speed_chart } = data;
    
    return React.createElement(ResponsiveContainer, { width: '100%', height: 300 },
      React.createElement(LineChart, { data: speed_chart },
        React.createElement(CartesianGrid, { strokeDasharray: '3 3' }),
        React.createElement(XAxis, { dataKey: 'time' }),
        React.createElement(YAxis),
        React.createElement(Tooltip),
        React.createElement(Line, { type: 'monotone', dataKey: 'current', stroke: '#8884d8', name: 'Current Speed' }),
        React.createElement(Line, { type: 'monotone', dataKey: 'target', stroke: '#82ca9d', name: 'Target Speed' })
      )
    );
  }
};

/**
 * Signal Monitor Widget
 * Generic signal monitoring for any data stream
 */
const signalMonitorImplementation: WidgetImplementation = {
  initialize: async (config) => {
    console.log('Initializing signal monitor with config:', config);
  },
  
  process: async (inputs) => {
    const { signals, timestamp } = inputs;
    
    // Create signal chart data
    const signalData = [];
    if (signals && timestamp) {
      const dataPoint = { time: timestamp };
      
      Object.entries(signals).forEach(([key, value]) => {
        if (typeof value === 'number') {
          dataPoint[key] = value;
        }
      });
      
      signalData.push(dataPoint);
    }
    
    return {
      signal_chart: signalData,
      signal_stats: {
        signalCount: Object.keys(signals || {}).length,
        timestamp: timestamp
      }
    };
  },
  
  render: (data) => {
    const { signal_chart } = data;
    
    return React.createElement(ResponsiveContainer, { width: '100%', height: 300 },
      React.createElement(LineChart, { data: signal_chart },
        React.createElement(CartesianGrid, { strokeDasharray: '3 3' }),
        React.createElement(XAxis, { dataKey: 'time' }),
        React.createElement(YAxis),
        React.createElement(Tooltip),
        React.createElement(Line, { type: 'monotone', dataKey: 'value', stroke: '#8884d8' })
      )
    );
  }
};

/**
 * Data Exporter Widget
 * Exports processed data in various formats
 */
const dataExporterImplementation: WidgetImplementation = {
  initialize: async (config) => {
    console.log('Initializing data exporter with config:', config);
  },
  
  process: async (inputs) => {
    const { data, format } = inputs;
    
    // Process data for export
    let exportData = data;
    
    if (format === 'csv') {
      // Convert to CSV format
      exportData = convertToCSV(data);
    } else if (format === 'json') {
      // Convert to JSON format
      exportData = JSON.stringify(data, null, 2);
    }
    
    return {
      csv_file: format === 'csv' ? exportData : null,
      json_file: format === 'json' ? exportData : null,
      export_stats: {
        format: format,
        size: exportData.length,
        timestamp: new Date().toISOString()
      }
    };
  },
  
  render: (data) => {
    const { export_stats } = data;
    
    return React.createElement('div', { className: 'p-4 border rounded-lg' },
      React.createElement('h3', { className: 'font-semibold mb-2' }, 'Data Export'),
      React.createElement('div', { className: 'space-y-2' },
        React.createElement('div', null, `Format: ${export_stats?.format || 'Unknown'}`),
        React.createElement('div', null, `Size: ${export_stats?.size || 0} bytes`),
        React.createElement('div', null, `Exported: ${export_stats?.timestamp || 'Never'}`)
      )
    );
  }
};

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Pre-built widget definitions using the templates
 */
export const widgetTemplates: WidgetDefinition[] = [
  {
    id: 'trajectory_visualizer',
    name: 'Trajectory Visualizer',
    type: 'spatial_chart',
    category: 'visualization',
    version: '1.0.0',
    inputs: [
      {
        name: 'w_car_pose_now_x_',
        type: 'signal',
        dataType: 'number',
        required: true,
        description: 'Vehicle X position'
      },
      {
        name: 'w_car_pose_now_y',
        type: 'signal',
        dataType: 'number',
        required: true,
        description: 'Vehicle Y position'
      },
      {
        name: 'path_x_data',
        type: 'signal',
        dataType: 'array',
        required: false,
        description: 'Planned path X coordinates'
      },
      {
        name: 'path_y_data',
        type: 'signal',
        dataType: 'array',
        required: false,
        description: 'Planned path Y coordinates'
      }
    ],
    outputs: [
      {
        name: 'spatial_chart',
        type: 'chart',
        dataType: 'object',
        description: 'Spatial trajectory chart'
      },
      {
        name: 'statistics',
        type: 'data',
        dataType: 'object',
        description: 'Trajectory statistics'
      }
    ],
    configSchema: {
      showPlannedPath: {
        type: 'boolean',
        default: true,
        description: 'Show planned path overlay'
      },
      pathColor: {
        type: 'string',
        default: '#8884d8',
        description: 'Path color'
      },
      chartSize: {
        type: 'select',
        options: ['small', 'medium', 'large'],
        default: 'medium',
        description: 'Chart size'
      }
    },
    implementation: trajectoryVisualizerImplementation
  },
  {
    id: 'speed_analyzer',
    name: 'Speed Analyzer',
    type: 'analysis_chart',
    category: 'analysis',
    version: '1.0.0',
    inputs: [
      {
        name: 'current_speed_mps',
        type: 'signal',
        dataType: 'number',
        required: true,
        description: 'Current vehicle speed'
      },
      {
        name: 'target_speed_mps',
        type: 'signal',
        dataType: 'number',
        required: false,
        description: 'Target vehicle speed'
      },
      {
        name: 'timestamp',
        type: 'signal',
        dataType: 'number',
        required: true,
        description: 'Data timestamp'
      }
    ],
    outputs: [
      {
        name: 'speed_chart',
        type: 'chart',
        dataType: 'object',
        description: 'Speed analysis chart'
      },
      {
        name: 'speed_stats',
        type: 'data',
        dataType: 'object',
        description: 'Speed statistics'
      }
    ],
    configSchema: {
      showTarget: {
        type: 'boolean',
        default: true,
        description: 'Show target speed line'
      },
      units: {
        type: 'select',
        options: ['mps', 'kmh', 'mph'],
        default: 'mps',
        description: 'Speed units'
      },
      analysisWindow: {
        type: 'number',
        default: 10,
        description: 'Analysis window (seconds)'
      }
    },
    implementation: speedAnalyzerImplementation
  },
  {
    id: 'signal_monitor',
    name: 'Signal Monitor',
    type: 'signal_chart',
    category: 'visualization',
    version: '1.0.0',
    inputs: [
      {
        name: 'signals',
        type: 'signal',
        dataType: 'object',
        required: true,
        description: 'Signal data object'
      },
      {
        name: 'timestamp',
        type: 'signal',
        dataType: 'number',
        required: true,
        description: 'Data timestamp'
      }
    ],
    outputs: [
      {
        name: 'signal_chart',
        type: 'chart',
        dataType: 'object',
        description: 'Signal monitoring chart'
      },
      {
        name: 'signal_stats',
        type: 'data',
        dataType: 'object',
        description: 'Signal statistics'
      }
    ],
    configSchema: {
      signals: {
        type: 'array',
        default: [],
        description: 'Signals to monitor'
      },
      chartType: {
        type: 'select',
        options: ['line', 'area', 'bar'],
        default: 'line',
        description: 'Chart type'
      },
      timeWindow: {
        type: 'number',
        default: 60,
        description: 'Time window (seconds)'
      }
    },
    implementation: signalMonitorImplementation
  },
  {
    id: 'data_exporter',
    name: 'Data Exporter',
    type: 'export_tool',
    category: 'export',
    version: '1.0.0',
    inputs: [
      {
        name: 'data',
        type: 'data',
        dataType: 'object',
        required: true,
        description: 'Data to export'
      },
      {
        name: 'format',
        type: 'config',
        dataType: 'string',
        required: true,
        description: 'Export format'
      }
    ],
    outputs: [
      {
        name: 'csv_file',
        type: 'export',
        dataType: 'string',
        description: 'CSV file content'
      },
      {
        name: 'json_file',
        type: 'export',
        dataType: 'string',
        description: 'JSON file content'
      },
      {
        name: 'export_stats',
        type: 'data',
        dataType: 'object',
        description: 'Export statistics'
      }
    ],
    configSchema: {
      format: {
        type: 'select',
        options: ['csv', 'json', 'xlsx'],
        default: 'csv',
        description: 'Export format'
      },
      includeHeaders: {
        type: 'boolean',
        default: true,
        description: 'Include column headers'
      },
      filterSignals: {
        type: 'array',
        default: [],
        description: 'Signals to include in export'
      }
    },
    implementation: dataExporterImplementation
  }
];