/**
 * Advanced Widget Engine V3 with enhanced features
 */

import { queryClient } from '@/lib/queryClient';
import { widgetEngineV2 } from './widget-engine-v2';
import type { WidgetDefinition, WidgetInstance, WidgetInput, WidgetOutput } from './widget-engine';

// Enhanced widget types
export interface AdvancedWidgetDefinition extends WidgetDefinition {
  permissions?: string[];
  dependencies?: string[];
  lifecycle?: {
    onMount?: () => Promise<void>;
    onUnmount?: () => Promise<void>;
    onConfigChange?: (oldConfig: any, newConfig: any) => Promise<void>;
  };
  communication?: {
    canSend?: string[];
    canReceive?: string[];
  };
  monitoring?: {
    metrics?: string[];
    alerts?: WidgetAlert[];
  };
}

export interface WidgetAlert {
  id: string;
  condition: (data: any) => boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface WidgetMessage {
  id: string;
  fromInstanceId: string;
  toInstanceId?: string; // If undefined, broadcast
  type: string;
  payload: any;
  timestamp: number;
}

export interface WidgetMetric {
  instanceId: string;
  metricName: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface WidgetSnapshot {
  timestamp: number;
  instances: WidgetInstance[];
  metrics: WidgetMetric[];
  messages: WidgetMessage[];
}

/**
 * Advanced Widget Engine with real-time monitoring and communication
 */
export class WidgetEngineV3 {
  private messageQueue: WidgetMessage[] = [];
  private messageHandlers: Map<string, Set<(message: WidgetMessage) => void>> = new Map();
  private metrics: Map<string, WidgetMetric[]> = new Map();
  private alerts: Map<string, WidgetAlert[]> = new Map();
  private performanceMonitor: PerformanceMonitor;
  private dataStreams: Map<string, DataStream> = new Map();
  private widgetCommunication: WidgetCommunication;

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.widgetCommunication = new WidgetCommunication(this);
    this.setupGlobalMessageHandling();
  }

  /**
   * Enhanced widget creation with lifecycle management
   */
  async createAdvancedWidget(
    definition: AdvancedWidgetDefinition,
    instanceId: string,
    name: string,
    config: Record<string, any>,
    sessionId?: number
  ): Promise<WidgetInstance> {
    // Check permissions and dependencies
    await this.validateWidgetPermissions(definition);
    await this.checkWidgetDependencies(definition);

    // Create base widget
    const instance = await widgetEngineV2.createWidget(
      definition.id,
      instanceId,
      name,
      config,
      sessionId
    );

    // Setup advanced features
    await this.setupWidgetLifecycle(instance, definition);
    this.setupWidgetCommunication(instance, definition);
    this.setupWidgetMonitoring(instance, definition);
    this.setupDataStreams(instance, definition);

    // Call onMount lifecycle
    if (definition.lifecycle?.onMount) {
      try {
        await definition.lifecycle.onMount();
        this.recordMetric(instanceId, 'lifecycle.mount.success', 1);
      } catch (error) {
        this.recordMetric(instanceId, 'lifecycle.mount.error', 1);
        console.error(`Widget ${instanceId} mount failed:`, error);
      }
    }

    return instance;
  }

  /**
   * Send message between widgets
   */
  async sendMessage(fromInstanceId: string, message: Omit<WidgetMessage, 'id' | 'fromInstanceId' | 'timestamp'>): Promise<void> {
    const fullMessage: WidgetMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromInstanceId,
      timestamp: Date.now(),
      ...message
    };

    this.messageQueue.push(fullMessage);
    
    // Route message
    if (message.toInstanceId) {
      // Direct message
      const handlers = this.messageHandlers.get(message.toInstanceId);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(fullMessage);
          } catch (error) {
            console.error(`Message handler error for ${message.toInstanceId}:`, error);
          }
        });
      }
    } else {
      // Broadcast message
      this.messageHandlers.forEach((handlers, instanceId) => {
        if (instanceId !== fromInstanceId) {
          handlers.forEach(handler => {
            try {
              handler(fullMessage);
            } catch (error) {
              console.error(`Broadcast handler error for ${instanceId}:`, error);
            }
          });
        }
      });
    }

    this.recordMetric(fromInstanceId, 'communication.messages.sent', 1);
  }

  /**
   * Subscribe to widget messages
   */
  subscribeToMessages(instanceId: string, handler: (message: WidgetMessage) => void): () => void {
    if (!this.messageHandlers.has(instanceId)) {
      this.messageHandlers.set(instanceId, new Set());
    }
    
    this.messageHandlers.get(instanceId)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(instanceId);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(instanceId);
        }
      }
    };
  }

  /**
   * Record widget metric
   */
  recordMetric(instanceId: string, metricName: string, value: number, metadata?: Record<string, any>): void {
    const metric: WidgetMetric = {
      instanceId,
      metricName,
      value,
      timestamp: Date.now(),
      metadata
    };

    if (!this.metrics.has(instanceId)) {
      this.metrics.set(instanceId, []);
    }

    const instanceMetrics = this.metrics.get(instanceId)!;
    instanceMetrics.push(metric);

    // Keep only last 1000 metrics per instance
    if (instanceMetrics.length > 1000) {
      instanceMetrics.splice(0, instanceMetrics.length - 1000);
    }

    // Check for alerts
    this.checkMetricAlerts(instanceId, metric);
  }

  /**
   * Get widget metrics
   */
  getMetrics(instanceId?: string, metricName?: string, timeRange?: { start: number; end: number }): WidgetMetric[] {
    let allMetrics: WidgetMetric[] = [];

    if (instanceId) {
      allMetrics = this.metrics.get(instanceId) || [];
    } else {
      this.metrics.forEach(metrics => {
        allMetrics.push(...metrics);
      });
    }

    // Filter by metric name
    if (metricName) {
      allMetrics = allMetrics.filter(m => m.metricName === metricName);
    }

    // Filter by time range
    if (timeRange) {
      allMetrics = allMetrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    return allMetrics.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Create data stream for real-time widget data
   */
  createDataStream(instanceId: string, config: DataStreamConfig): DataStream {
    const stream = new DataStream(instanceId, config);
    this.dataStreams.set(instanceId, stream);
    return stream;
  }

  /**
   * Get widget performance metrics
   */
  getPerformanceMetrics(instanceId?: string): PerformanceMetrics {
    return this.performanceMonitor.getMetrics(instanceId);
  }

  /**
   * Export widget configuration and state
   */
  async exportWidgetSnapshot(): Promise<WidgetSnapshot> {
    return {
      timestamp: Date.now(),
      instances: widgetEngineV2.getInstances(),
      metrics: this.getMetrics(),
      messages: this.messageQueue.slice(-100) // Last 100 messages
    };
  }

  /**
   * Import widget configuration and state
   */
  async importWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
    // Clear existing state
    this.messageQueue.length = 0;
    this.metrics.clear();

    // Restore metrics
    snapshot.metrics.forEach(metric => {
      if (!this.metrics.has(metric.instanceId)) {
        this.metrics.set(metric.instanceId, []);
      }
      this.metrics.get(metric.instanceId)!.push(metric);
    });

    // Restore messages
    this.messageQueue.push(...snapshot.messages);

    console.log('Widget snapshot imported successfully');
  }

  /**
   * Create dynamic widget template from existing widget
   */
  async createWidgetTemplate(sourceInstanceId: string, templateName: string): Promise<AdvancedWidgetDefinition> {
    const instance = widgetEngineV2.getInstance(sourceInstanceId);
    if (!instance) {
      throw new Error(`Source widget instance not found: ${sourceInstanceId}`);
    }

    const sourceDefinition = widgetEngineV2.getDefinitions().find(d => d.id === instance.definitionId);
    if (!sourceDefinition) {
      throw new Error(`Source widget definition not found: ${instance.definitionId}`);
    }

    // Create new template based on source
    const templateDefinition: AdvancedWidgetDefinition = {
      ...sourceDefinition,
      id: `template-${templateName.toLowerCase().replace(/\s+/g, '-')}`,
      name: templateName,
      category: 'custom',
      version: '1.0.0',
      lifecycle: {
        onMount: async () => {
          console.log(`Custom template ${templateName} mounted`);
        }
      }
    };

    await widgetEngineV2.registerWidget(templateDefinition);
    return templateDefinition;
  }

  // Private methods

  private async validateWidgetPermissions(definition: AdvancedWidgetDefinition): Promise<void> {
    if (!definition.permissions) return;

    // Check if user has required permissions
    for (const permission of definition.permissions) {
      // Implement permission checking logic
      console.log(`Checking permission: ${permission}`);
    }
  }

  private async checkWidgetDependencies(definition: AdvancedWidgetDefinition): Promise<void> {
    if (!definition.dependencies) return;

    for (const dependency of definition.dependencies) {
      const dependencyExists = widgetEngineV2.getDefinitions().some(d => d.id === dependency);
      if (!dependencyExists) {
        throw new Error(`Widget dependency not found: ${dependency}`);
      }
    }
  }

  private async setupWidgetLifecycle(instance: WidgetInstance, definition: AdvancedWidgetDefinition): Promise<void> {
    // Setup lifecycle event handlers
    if (definition.lifecycle) {
      instance.metadata.lifecycle = definition.lifecycle;
    }
  }

  private setupWidgetCommunication(instance: WidgetInstance, definition: AdvancedWidgetDefinition): void {
    if (definition.communication) {
      instance.metadata.communication = definition.communication;
    }
  }

  private setupWidgetMonitoring(instance: WidgetInstance, definition: AdvancedWidgetDefinition): void {
    if (definition.monitoring) {
      this.alerts.set(instance.id, definition.monitoring.alerts || []);
      instance.metadata.monitoring = definition.monitoring;
    }
  }

  private setupDataStreams(instance: WidgetInstance, definition: AdvancedWidgetDefinition): void {
    // Setup real-time data streams if needed
    const streamConfig: DataStreamConfig = {
      bufferSize: 100,
      updateInterval: 1000,
      autoFlush: true
    };
    
    this.createDataStream(instance.id, streamConfig);
  }

  private checkMetricAlerts(instanceId: string, metric: WidgetMetric): void {
    const alerts = this.alerts.get(instanceId);
    if (!alerts) return;

    alerts.forEach(alert => {
      try {
        if (alert.condition(metric)) {
          this.triggerAlert(instanceId, alert, metric);
        }
      } catch (error) {
        console.error(`Alert condition check failed for ${alert.id}:`, error);
      }
    });
  }

  private triggerAlert(instanceId: string, alert: WidgetAlert, metric: WidgetMetric): void {
    console.warn(`Widget Alert [${alert.severity}]: ${alert.message}`, { instanceId, metric });
    
    // Send alert as message
    this.sendMessage(instanceId, {
      type: 'alert',
      payload: {
        alert,
        metric,
        timestamp: Date.now()
      }
    });
  }

  private setupGlobalMessageHandling(): void {
    // Setup global error handling for widgets
    window.addEventListener('error', (event) => {
      if (event.filename?.includes('widget')) {
        console.error('Widget runtime error:', event.error);
      }
    });
  }
}

/**
 * Performance Monitor for widgets
 */
class PerformanceMonitor {
  private metrics: Map<string, PerformanceEntry[]> = new Map();

  recordPerformance(instanceId: string, operation: string, duration: number): void {
    if (!this.metrics.has(instanceId)) {
      this.metrics.set(instanceId, []);
    }

    const entry: PerformanceEntry = {
      name: operation,
      duration,
      startTime: Date.now() - duration,
      entryType: 'measure'
    };

    this.metrics.get(instanceId)!.push(entry);
  }

  getMetrics(instanceId?: string): PerformanceMetrics {
    const result: PerformanceMetrics = {
      totalOperations: 0,
      averageDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      operationCounts: {}
    };

    const allEntries: PerformanceEntry[] = [];
    
    if (instanceId) {
      allEntries.push(...(this.metrics.get(instanceId) || []));
    } else {
      this.metrics.forEach(entries => allEntries.push(...entries));
    }

    if (allEntries.length === 0) {
      result.minDuration = 0;
      return result;
    }

    result.totalOperations = allEntries.length;
    result.averageDuration = allEntries.reduce((sum, entry) => sum + entry.duration, 0) / allEntries.length;
    result.maxDuration = Math.max(...allEntries.map(e => e.duration));
    result.minDuration = Math.min(...allEntries.map(e => e.duration));

    allEntries.forEach(entry => {
      result.operationCounts[entry.name] = (result.operationCounts[entry.name] || 0) + 1;
    });

    return result;
  }
}

/**
 * Widget Communication System
 */
class WidgetCommunication {
  constructor(private engine: WidgetEngineV3) {}

  async establishConnection(instanceA: string, instanceB: string): Promise<void> {
    // Create bidirectional communication channel
    await this.engine.sendMessage(instanceA, {
      type: 'connection.request',
      toInstanceId: instanceB,
      payload: { requesterId: instanceA }
    });
  }

  async broadcastToCategory(category: string, message: any): Promise<void> {
    const instances = widgetEngineV2.getInstances().filter(instance => {
      const definition = widgetEngineV2.getDefinitions().find(d => d.id === instance.definitionId);
      return definition?.category === category;
    });

    for (const instance of instances) {
      await this.engine.sendMessage('system', {
        type: 'category.broadcast',
        toInstanceId: instance.id,
        payload: message
      });
    }
  }
}

/**
 * Real-time data stream for widgets
 */
export class DataStream {
  private buffer: any[] = [];
  private subscribers: Set<(data: any) => void> = new Set();
  private flushInterval?: NodeJS.Timeout;

  constructor(
    private instanceId: string,
    private config: DataStreamConfig
  ) {
    if (config.autoFlush && config.updateInterval) {
      this.flushInterval = setInterval(() => {
        this.flush();
      }, config.updateInterval);
    }
  }

  push(data: any): void {
    this.buffer.push({
      data,
      timestamp: Date.now()
    });

    if (this.buffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  subscribe(callback: (data: any) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  flush(): void {
    if (this.buffer.length === 0) return;

    const data = [...this.buffer];
    this.buffer.length = 0;

    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Data stream subscriber error:`, error);
      }
    });
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.subscribers.clear();
    this.buffer.length = 0;
  }
}

// Type definitions
export interface DataStreamConfig {
  bufferSize: number;
  updateInterval?: number;
  autoFlush: boolean;
}

export interface PerformanceEntry {
  name: string;
  duration: number;
  startTime: number;
  entryType: string;
}

export interface PerformanceMetrics {
  totalOperations: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
  operationCounts: Record<string, number>;
}

// Global widget engine V3 instance
export const widgetEngineV3 = new WidgetEngineV3();