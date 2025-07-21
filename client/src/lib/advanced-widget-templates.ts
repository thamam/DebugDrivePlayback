/**
 * Advanced Widget Templates with enhanced functionality
 */

import type { AdvancedWidgetDefinition, WidgetAlert } from './widget-engine-v3';
import type { WidgetInput, WidgetOutput, WidgetConfigField } from './widget-engine';

/**
 * Advanced Time Series Chart Widget
 */
export const advancedTimeSeriesWidget: AdvancedWidgetDefinition = {
  id: 'advanced-timeseries',
  name: 'Advanced Time Series Chart',
  description: 'High-performance time series chart with real-time updates and advanced analytics',
  type: 'visualization',
  category: 'analytics',
  version: '2.0.0',
  inputs: [
    {
      name: 'data',
      type: 'timeseries',
      description: 'Time series data points',
      required: true
    },
    {
      name: 'annotations',
      type: 'object',
      description: 'Chart annotations and markers',
      required: false
    }
  ],
  outputs: [
    {
      name: 'selection',
      type: 'object',
      description: 'Selected time range or data points'
    },
    {
      name: 'statistics',
      type: 'object',
      description: 'Computed statistics for visible data'
    }
  ],
  configSchema: {
    signals: {
      type: 'array',
      label: 'Signals to Display',
      description: 'Select which signals to visualize',
      validation: { required: true }
    },
    timeRange: {
      type: 'number',
      label: 'Time Range (seconds)',
      description: 'How much historical data to show',
      defaultValue: 60,
      validation: { min: 1, max: 3600 }
    },
    refreshRate: {
      type: 'number',
      label: 'Refresh Rate (Hz)',
      description: 'How often to update the chart',
      defaultValue: 10,
      validation: { min: 0.1, max: 60 }
    },
    aggregation: {
      type: 'select',
      label: 'Data Aggregation',
      description: 'How to aggregate data points',
      options: ['none', 'average', 'max', 'min', 'sum'],
      defaultValue: 'none'
    },
    showStatistics: {
      type: 'boolean',
      label: 'Show Statistics',
      description: 'Display real-time statistics panel',
      defaultValue: true
    },
    alertThresholds: {
      type: 'object',
      label: 'Alert Thresholds',
      description: 'Configure alert thresholds for signals',
      defaultValue: {}
    }
  },
  permissions: ['data-access'],
  dependencies: [],
  lifecycle: {
    async onMount() {
      console.log('Advanced time series widget mounted');
    },
    async onUnmount() {
      console.log('Advanced time series widget unmounted');
    },
    async onConfigChange(oldConfig, newConfig) {
      console.log('Configuration changed:', { oldConfig, newConfig });
    }
  },
  communication: {
    canSend: ['selection-changed', 'alert-triggered'],
    canReceive: ['zoom-to-range', 'highlight-signal']
  },
  monitoring: {
    metrics: ['render-time', 'data-points-processed', 'memory-usage'],
    alerts: [
      {
        id: 'high-render-time',
        condition: (metric) => metric.metricName === 'render-time' && metric.value > 100,
        message: 'Chart rendering is slow',
        severity: 'warning'
      },
      {
        id: 'memory-leak',
        condition: (metric) => metric.metricName === 'memory-usage' && metric.value > 50 * 1024 * 1024,
        message: 'High memory usage detected',
        severity: 'error'
      }
    ]
  },
  implementation: {
    async initialize(config) {
      // Initialize chart with configuration
      console.log('Initializing advanced time series chart with config:', config);
    },
    
    async process(inputs) {
      const { data, annotations = {} } = inputs;
      
      // Process time series data
      const processedData = this.aggregateData(data, config.aggregation);
      const statistics = this.computeStatistics(processedData);
      
      // Check for alert conditions
      this.checkAlerts(statistics, config.alertThresholds);
      
      return {
        selection: null,
        statistics
      };
    },
    
    render(outputs, config) {
      // Render chart with processed data
      return `
        <div class="advanced-timeseries-widget">
          <div class="chart-container">
            <!-- Chart implementation would go here -->
            <canvas id="chart-${config.instanceId}"></canvas>
          </div>
          ${config.showStatistics ? `
            <div class="statistics-panel">
              <div class="stat">
                <label>Average:</label>
                <span>${outputs.statistics?.average?.toFixed(2) || 'N/A'}</span>
              </div>
              <div class="stat">
                <label>Max:</label>
                <span>${outputs.statistics?.max?.toFixed(2) || 'N/A'}</span>
              </div>
              <div class="stat">
                <label>Min:</label>
                <span>${outputs.statistics?.min?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    },
    
    async cleanup() {
      console.log('Cleaning up advanced time series chart');
    },

    // Helper methods
    aggregateData(data: any[], method: string) {
      if (method === 'none' || !Array.isArray(data)) return data;
      
      // Implement data aggregation logic
      switch (method) {
        case 'average':
          return data.reduce((acc, val) => acc + val, 0) / data.length;
        case 'max':
          return Math.max(...data);
        case 'min':
          return Math.min(...data);
        case 'sum':
          return data.reduce((acc, val) => acc + val, 0);
        default:
          return data;
      }
    },

    computeStatistics(data: any[]) {
      if (!Array.isArray(data) || data.length === 0) {
        return { average: 0, max: 0, min: 0, count: 0 };
      }

      const values = data.map(d => typeof d === 'number' ? d : d.value).filter(v => typeof v === 'number');
      
      return {
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        max: Math.max(...values),
        min: Math.min(...values),
        count: values.length,
        standardDeviation: this.calculateStandardDeviation(values)
      };
    },

    calculateStandardDeviation(values: number[]) {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
      const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
      return Math.sqrt(variance);
    },

    checkAlerts(statistics: any, thresholds: Record<string, any>) {
      // Check each configured threshold
      Object.entries(thresholds).forEach(([signal, threshold]) => {
        const value = statistics[signal];
        if (value !== undefined) {
          if (threshold.min !== undefined && value < threshold.min) {
            this.triggerAlert(`${signal} below minimum threshold: ${value} < ${threshold.min}`);
          }
          if (threshold.max !== undefined && value > threshold.max) {
            this.triggerAlert(`${signal} above maximum threshold: ${value} > ${threshold.max}`);
          }
        }
      });
    },

    triggerAlert(message: string) {
      console.warn('Widget Alert:', message);
      // Send alert through widget communication system
    }
  }
};

/**
 * Machine Learning Predictor Widget
 */
export const mlPredictorWidget: AdvancedWidgetDefinition = {
  id: 'ml-predictor',
  name: 'ML Predictor',
  description: 'Machine learning-based prediction widget for time series forecasting',
  type: 'analysis',
  category: 'ai',
  version: '1.5.0',
  inputs: [
    {
      name: 'trainingData',
      type: 'timeseries',
      description: 'Historical data for model training',
      required: true
    },
    {
      name: 'features',
      type: 'array',
      description: 'Feature columns for prediction',
      required: true
    }
  ],
  outputs: [
    {
      name: 'predictions',
      type: 'timeseries',
      description: 'Predicted values'
    },
    {
      name: 'confidence',
      type: 'number',
      description: 'Prediction confidence score'
    },
    {
      name: 'modelMetrics',
      type: 'object',
      description: 'Model performance metrics'
    }
  ],
  configSchema: {
    algorithm: {
      type: 'select',
      label: 'ML Algorithm',
      description: 'Machine learning algorithm to use',
      options: ['linear-regression', 'random-forest', 'neural-network', 'arima'],
      defaultValue: 'linear-regression'
    },
    predictionHorizon: {
      type: 'number',
      label: 'Prediction Horizon',
      description: 'How far ahead to predict (in time units)',
      defaultValue: 10,
      validation: { min: 1, max: 100 }
    },
    trainingWindow: {
      type: 'number',
      label: 'Training Window',
      description: 'Size of training data window',
      defaultValue: 100,
      validation: { min: 10, max: 1000 }
    },
    retrainInterval: {
      type: 'number',
      label: 'Retrain Interval (minutes)',
      description: 'How often to retrain the model',
      defaultValue: 60,
      validation: { min: 1, max: 1440 }
    },
    confidenceThreshold: {
      type: 'number',
      label: 'Confidence Threshold',
      description: 'Minimum confidence for predictions',
      defaultValue: 0.7,
      validation: { min: 0, max: 1 }
    }
  },
  permissions: ['data-access', 'model-training'],
  dependencies: ['tensorflow-js'],
  lifecycle: {
    async onMount() {
      console.log('ML Predictor widget mounted');
    }
  },
  communication: {
    canSend: ['prediction-ready', 'model-updated'],
    canReceive: ['retrain-model', 'update-parameters']
  },
  monitoring: {
    metrics: ['prediction-accuracy', 'training-time', 'model-size'],
    alerts: [
      {
        id: 'low-accuracy',
        condition: (metric) => metric.metricName === 'prediction-accuracy' && metric.value < 0.6,
        message: 'Model accuracy is below threshold',
        severity: 'warning'
      }
    ]
  },
  implementation: {
    async initialize(config) {
      console.log('Initializing ML predictor with config:', config);
      // Initialize ML model based on algorithm choice
    },
    
    async process(inputs) {
      const { trainingData, features } = inputs;
      
      // Train/update model
      const model = await this.trainModel(trainingData, features, config.algorithm);
      
      // Generate predictions
      const predictions = await this.predict(model, config.predictionHorizon);
      const confidence = this.calculateConfidence(predictions);
      const modelMetrics = this.evaluateModel(model, trainingData);
      
      return {
        predictions,
        confidence,
        modelMetrics
      };
    },
    
    render(outputs, config) {
      return `
        <div class="ml-predictor-widget">
          <div class="header">
            <h3>ML Predictions (${config.algorithm})</h3>
            <div class="confidence">
              Confidence: ${(outputs.confidence * 100).toFixed(1)}%
            </div>
          </div>
          <div class="predictions-chart">
            <!-- Predictions visualization -->
          </div>
          <div class="model-metrics">
            <div class="metric">
              <label>Accuracy:</label>
              <span>${outputs.modelMetrics?.accuracy?.toFixed(3) || 'N/A'}</span>
            </div>
            <div class="metric">
              <label>RMSE:</label>
              <span>${outputs.modelMetrics?.rmse?.toFixed(3) || 'N/A'}</span>
            </div>
          </div>
        </div>
      `;
    },

    async trainModel(data: any[], features: string[], algorithm: string) {
      // Implement model training based on algorithm
      console.log(`Training ${algorithm} model with ${data.length} samples`);
      return { type: algorithm, trained: true };
    },

    async predict(model: any, horizon: number) {
      // Generate predictions
      const predictions = Array.from({ length: horizon }, (_, i) => ({
        timestamp: Date.now() + i * 1000,
        value: Math.random() * 100 // Placeholder prediction
      }));
      return predictions;
    },

    calculateConfidence(predictions: any[]) {
      // Calculate prediction confidence
      return Math.random() * 0.4 + 0.6; // Placeholder confidence
    },

    evaluateModel(model: any, testData: any[]) {
      // Evaluate model performance
      return {
        accuracy: Math.random() * 0.3 + 0.7,
        rmse: Math.random() * 10 + 5,
        mae: Math.random() * 8 + 3
      };
    }
  }
};

/**
 * Anomaly Detection Widget
 */
export const anomalyDetectionWidget: AdvancedWidgetDefinition = {
  id: 'anomaly-detector',
  name: 'Anomaly Detector',
  description: 'Real-time anomaly detection for vehicle data streams',
  type: 'analysis',
  category: 'monitoring',
  version: '1.3.0',
  inputs: [
    {
      name: 'dataStream',
      type: 'stream',
      description: 'Real-time data stream',
      required: true
    },
    {
      name: 'baselineData',
      type: 'timeseries',
      description: 'Historical baseline data',
      required: false
    }
  ],
  outputs: [
    {
      name: 'anomalies',
      type: 'array',
      description: 'Detected anomalies'
    },
    {
      name: 'anomalyScore',
      type: 'number',
      description: 'Current anomaly score'
    },
    {
      name: 'threshold',
      type: 'number',
      description: 'Current detection threshold'
    }
  ],
  configSchema: {
    algorithm: {
      type: 'select',
      label: 'Detection Algorithm',
      options: ['statistical', 'isolation-forest', 'lstm-autoencoder', 'local-outlier-factor'],
      defaultValue: 'statistical'
    },
    sensitivity: {
      type: 'number',
      label: 'Sensitivity',
      description: 'Detection sensitivity (0.1 = very sensitive, 1.0 = less sensitive)',
      defaultValue: 0.5,
      validation: { min: 0.1, max: 1.0 }
    },
    windowSize: {
      type: 'number',
      label: 'Analysis Window',
      description: 'Number of data points to analyze',
      defaultValue: 50,
      validation: { min: 10, max: 500 }
    },
    adaptiveThreshold: {
      type: 'boolean',
      label: 'Adaptive Threshold',
      description: 'Automatically adjust threshold based on data patterns',
      defaultValue: true
    }
  },
  permissions: ['data-access'],
  communication: {
    canSend: ['anomaly-detected', 'threshold-updated'],
    canReceive: ['update-sensitivity', 'reset-baseline']
  },
  monitoring: {
    metrics: ['detection-rate', 'false-positive-rate', 'processing-latency'],
    alerts: [
      {
        id: 'high-anomaly-rate',
        condition: (metric) => metric.metricName === 'detection-rate' && metric.value > 0.1,
        message: 'High anomaly detection rate',
        severity: 'warning'
      }
    ]
  },
  implementation: {
    async initialize(config) {
      console.log('Initializing anomaly detector:', config);
    },
    
    async process(inputs) {
      const { dataStream, baselineData } = inputs;
      
      // Detect anomalies in the data stream
      const anomalies = this.detectAnomalies(dataStream, config);
      const anomalyScore = this.calculateAnomalyScore(dataStream);
      const threshold = config.adaptiveThreshold ? 
        this.calculateAdaptiveThreshold(baselineData) : 
        this.getStaticThreshold(config.sensitivity);
      
      return {
        anomalies,
        anomalyScore,
        threshold
      };
    },
    
    render(outputs, config) {
      const anomalyCount = outputs.anomalies?.length || 0;
      const scoreColor = outputs.anomalyScore > outputs.threshold ? 'red' : 'green';
      
      return `
        <div class="anomaly-detector-widget">
          <div class="header">
            <h3>Anomaly Detection</h3>
            <div class="algorithm-badge">${config.algorithm}</div>
          </div>
          <div class="metrics">
            <div class="metric">
              <label>Anomaly Score:</label>
              <span style="color: ${scoreColor}">
                ${outputs.anomalyScore?.toFixed(3) || '0.000'}
              </span>
            </div>
            <div class="metric">
              <label>Threshold:</label>
              <span>${outputs.threshold?.toFixed(3) || '0.000'}</span>
            </div>
            <div class="metric">
              <label>Anomalies Detected:</label>
              <span class="anomaly-count">${anomalyCount}</span>
            </div>
          </div>
          <div class="anomaly-list">
            ${outputs.anomalies?.map(anomaly => `
              <div class="anomaly-item">
                <span class="timestamp">${new Date(anomaly.timestamp).toLocaleTimeString()}</span>
                <span class="score">${anomaly.score.toFixed(3)}</span>
                <span class="description">${anomaly.description}</span>
              </div>
            `).join('') || '<div class="no-anomalies">No anomalies detected</div>'}
          </div>
        </div>
      `;
    },

    detectAnomalies(dataStream: any[], config: any) {
      // Implement anomaly detection logic
      const anomalies = [];
      
      // Placeholder implementation
      dataStream.forEach((point, index) => {
        if (Math.random() < 0.05) { // 5% chance for demo
          anomalies.push({
            timestamp: point.timestamp || Date.now(),
            value: point.value,
            score: Math.random() * 0.5 + 0.5,
            description: `Anomaly detected in ${point.signal || 'data'}`
          });
        }
      });
      
      return anomalies;
    },

    calculateAnomalyScore(dataStream: any[]) {
      // Calculate current anomaly score
      return Math.random() * 0.8; // Placeholder
    },

    calculateAdaptiveThreshold(baselineData: any[]) {
      // Calculate adaptive threshold based on baseline
      return 0.5 + Math.random() * 0.3; // Placeholder
    },

    getStaticThreshold(sensitivity: number) {
      return 1.0 - sensitivity;
    }
  }
};

// Export all advanced widget templates
export const advancedWidgetTemplates = [
  advancedTimeSeriesWidget,
  mlPredictorWidget,
  anomalyDetectionWidget
];