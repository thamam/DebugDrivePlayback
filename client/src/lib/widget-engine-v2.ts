/**
 * Enhanced Widget Engine with persistence support
 */

import { queryClient } from '@/lib/queryClient';
import type { WidgetDefinition, WidgetInput, WidgetOutput, WidgetConfigField, WidgetValidation, WidgetImplementation, WidgetInstance as EngineWidgetInstance } from './widget-engine';

export interface PersistedWidgetInstance {
  id: number;
  definitionId: number;
  sessionId: number | null;
  instanceId: string;
  name: string;
  config: string; // JSON string
  status: 'active' | 'paused' | 'error' | 'stopped';
  position: string | null; // JSON string
  size: string | null; // JSON string
  lastUpdated: string;
  createdAt: string;
}

export class WidgetEngineV2 {
  private definitions: Map<string, WidgetDefinition> = new Map();
  private instances: Map<string, EngineWidgetInstance> = new Map();
  private dataSubscriptions: Map<string, Set<string>> = new Map();
  private apiBaseUrl = '/api/widgets';

  constructor() {
    this.loadBuiltinWidgets();
    this.loadPersistedInstances();
  }

  /**
   * Register a new widget definition (with persistence)
   */
  async registerWidget(definition: WidgetDefinition): Promise<void> {
    this.validateDefinition(definition);
    this.definitions.set(definition.id, definition);

    // Persist to database
    try {
      await this.saveWidgetDefinition(definition);
    } catch (error) {
      console.warn('Failed to persist widget definition:', error);
      // Continue anyway, widget is registered in memory
    }
  }

  /**
   * Create a new widget instance (with persistence)
   */
  async createWidget(
    definitionId: string, 
    instanceId: string, 
    name: string, 
    config: Record<string, any>,
    sessionId?: number
  ): Promise<EngineWidgetInstance> {
    const definition = this.definitions.get(definitionId);
    if (!definition) {
      throw new Error(`Widget definition not found: ${definitionId}`);
    }

    // Validate configuration
    this.validateConfig(config, definition.configSchema);

    // Create instance
    const instance: EngineWidgetInstance = {
      id: instanceId,
      definitionId,
      name,
      config,
      status: 'stopped',
      inputs: {},
      outputs: {},
      lastUpdated: new Date(),
      metadata: {}
    };

    // Initialize widget
    await definition.implementation.initialize(config);
    instance.status = 'active';

    this.instances.set(instanceId, instance);
    this.setupDataSubscriptions(instance, definition);

    // Persist to database
    try {
      await this.saveWidgetInstance(instance, sessionId);
    } catch (error) {
      console.warn('Failed to persist widget instance:', error);
      // Continue anyway, widget is created in memory
    }

    return instance;
  }

  /**
   * Load persisted widget instances
   */
  private async loadPersistedInstances(): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/instances?includeDefinitions=true`);
      if (!response.ok) return;

      const persistedInstances = await response.json() as Array<{
        instance: PersistedWidgetInstance;
        definition: any;
      }>;

      for (const { instance: persistedInstance, definition } of persistedInstances) {
        if (persistedInstance.status === 'active') {
          try {
            // Convert persisted instance to engine instance
            const config = JSON.parse(persistedInstance.config);
            const instance: EngineWidgetInstance = {
              id: persistedInstance.instanceId,
              definitionId: definition?.templateId || persistedInstance.definitionId.toString(),
              name: persistedInstance.name,
              config,
              status: persistedInstance.status,
              inputs: {},
              outputs: {},
              lastUpdated: new Date(persistedInstance.lastUpdated),
              metadata: {
                persistedId: persistedInstance.id,
                sessionId: persistedInstance.sessionId,
                position: persistedInstance.position ? JSON.parse(persistedInstance.position) : null,
                size: persistedInstance.size ? JSON.parse(persistedInstance.size) : null
              }
            };

            // Try to find definition and initialize
            const engineDefinition = this.definitions.get(instance.definitionId);
            if (engineDefinition) {
              await engineDefinition.implementation.initialize(config);
              this.instances.set(instance.id, instance);
              this.setupDataSubscriptions(instance, engineDefinition);
            }
          } catch (error) {
            console.warn(`Failed to restore widget instance ${persistedInstance.instanceId}:`, error);
          }
        }
      }

      console.log(`Restored ${this.instances.size} widget instances from database`);
    } catch (error) {
      console.warn('Failed to load persisted widget instances:', error);
    }
  }

  /**
   * Save widget definition to database
   */
  private async saveWidgetDefinition(definition: WidgetDefinition): Promise<void> {
    const payload = {
      templateId: definition.id,
      name: definition.name,
      description: definition.name, // Use name as description for now
      category: definition.category,
      version: definition.version,
      inputs: JSON.stringify(definition.inputs),
      outputs: JSON.stringify(definition.outputs),
      configSchema: JSON.stringify(definition.configSchema),
      implementation: JSON.stringify({
        // We can't persist actual functions, so we'll store metadata
        type: 'built-in',
        templateId: definition.id
      }),
      isBuiltIn: true
    };

    const response = await fetch(`${this.apiBaseUrl}/definitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to save widget definition: ${response.statusText}`);
    }
  }

  /**
   * Save widget instance to database
   */
  private async saveWidgetInstance(instance: EngineWidgetInstance, sessionId?: number): Promise<void> {
    const payload = {
      templateId: instance.definitionId,
      sessionId: sessionId || null,
      instanceId: instance.id,
      name: instance.name,
      config: JSON.stringify(instance.config),
      status: instance.status,
      position: instance.metadata.position ? JSON.stringify(instance.metadata.position) : null,
      size: instance.metadata.size ? JSON.stringify(instance.metadata.size) : null
    };

    const response = await fetch(`${this.apiBaseUrl}/instances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to save widget instance: ${response.statusText}`);
    }

    const result = await response.json();
    instance.metadata.persistedId = result.id;
  }

  /**
   * Update widget configuration (with persistence)
   */
  async updateWidgetConfig(instanceId: string, config: Record<string, any>): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Widget instance not found: ${instanceId}`);
    }

    const definition = this.definitions.get(instance.definitionId);
    if (!definition) {
      throw new Error(`Widget definition not found: ${instance.definitionId}`);
    }

    this.validateConfig(config, definition.configSchema);
    
    instance.config = config;
    instance.lastUpdated = new Date();
    
    await definition.implementation.initialize(config);

    // Persist to database
    if (instance.metadata.persistedId) {
      try {
        await this.updatePersistedInstance(instance.metadata.persistedId, {
          config: JSON.stringify(config)
        });
      } catch (error) {
        console.warn('Failed to persist widget config update:', error);
      }
    }
  }

  /**
   * Remove widget instance (with persistence)
   */
  async removeWidget(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return;
    }

    const definition = this.definitions.get(instance.definitionId);
    if (definition?.implementation.cleanup) {
      await definition.implementation.cleanup();
    }

    this.instances.delete(instanceId);
    this.cleanupDataSubscriptions(instanceId);

    // Remove from database
    if (instance.metadata.persistedId) {
      try {
        await fetch(`${this.apiBaseUrl}/instances/${instance.metadata.persistedId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.warn('Failed to delete persisted widget instance:', error);
      }
    }
  }

  /**
   * Update widget status (with persistence)
   */
  async setWidgetStatus(instanceId: string, status: 'active' | 'paused' | 'stopped'): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.status = status;
      instance.lastUpdated = new Date();

      // Persist to database
      if (instance.metadata.persistedId) {
        try {
          await this.updatePersistedInstance(instance.metadata.persistedId, { status });
        } catch (error) {
          console.warn('Failed to persist widget status update:', error);
        }
      }
    }
  }

  /**
   * Update widget position/size (with persistence)
   */
  async updateWidgetLayout(
    instanceId: string, 
    position?: { x: number; y: number }, 
    size?: { width: number; height: number }
  ): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    if (position) {
      instance.metadata.position = position;
    }
    if (size) {
      instance.metadata.size = size;
    }

    instance.lastUpdated = new Date();

    // Persist to database
    if (instance.metadata.persistedId) {
      try {
        const updates: any = {};
        if (position) updates.position = JSON.stringify(position);
        if (size) updates.size = JSON.stringify(size);

        await this.updatePersistedInstance(instance.metadata.persistedId, updates);
      } catch (error) {
        console.warn('Failed to persist widget layout update:', error);
      }
    }
  }

  /**
   * Save widget processing data
   */
  async saveWidgetData(
    instanceId: string, 
    timestamp: number, 
    inputData?: any, 
    outputData?: any, 
    error?: string,
    processingTime?: number
  ): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance || !instance.metadata.persistedId) return;

    try {
      await fetch(`${this.apiBaseUrl}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceId: instance.metadata.persistedId,
          timestamp,
          inputData: inputData ? JSON.stringify(inputData) : undefined,
          outputData: outputData ? JSON.stringify(outputData) : undefined,
          error,
          processingTime
        })
      });
    } catch (error) {
      console.warn('Failed to save widget data:', error);
    }
  }

  /**
   * Process data through a widget instance (enhanced with persistence)
   */
  async processWidget(instanceId: string, inputData: Record<string, any>): Promise<void> {
    const startTime = performance.now();
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== 'active') {
      return;
    }

    const definition = this.definitions.get(instance.definitionId);
    if (!definition) {
      return;
    }

    try {
      // Validate inputs
      this.validateInputs(inputData, definition.inputs);

      // Process data
      const outputs = await definition.implementation.process(inputData);
      
      // Update instance
      instance.inputs = inputData;
      instance.outputs = outputs;
      instance.lastUpdated = new Date();
      instance.status = 'active';

      const processingTime = performance.now() - startTime;

      // Save processing data
      await this.saveWidgetData(
        instanceId, 
        Date.now() / 1000, 
        inputData, 
        outputs, 
        undefined, 
        processingTime
      );

    } catch (error) {
      instance.status = 'error';
      instance.metadata = { 
        ...instance.metadata, 
        error: error instanceof Error ? error.message : String(error) 
      };

      const processingTime = performance.now() - startTime;

      // Save error data
      await this.saveWidgetData(
        instanceId, 
        Date.now() / 1000, 
        inputData, 
        undefined, 
        error instanceof Error ? error.message : String(error),
        processingTime
      );
    }
  }

  // Private helper methods
  
  private async updatePersistedInstance(id: number, updates: any): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/instances/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update persisted instance: ${response.statusText}`);
    }
  }

  // Include all the validation and utility methods from the original widget engine
  private validateDefinition(definition: WidgetDefinition): void {
    if (!definition.id || !definition.name || !definition.type) {
      throw new Error('Widget definition missing required fields');
    }

    if (!definition.implementation?.initialize || !definition.implementation?.process || !definition.implementation?.render) {
      throw new Error('Widget implementation missing required methods');
    }
  }

  private validateConfig(config: Record<string, any>, schema: Record<string, WidgetConfigField>): void {
    for (const [key, field] of Object.entries(schema)) {
      const value = config[key];
      
      if (field.validation?.required && (value === undefined || value === null)) {
        throw new Error(`Required config field missing: ${key}`);
      }

      if (value !== undefined && field.validation?.custom) {
        const result = field.validation.custom(value);
        if (result !== true) {
          throw new Error(`Config validation failed for ${key}: ${result}`);
        }
      }
    }
  }

  private validateInputs(inputs: Record<string, any>, schema: WidgetInput[]): void {
    for (const input of schema) {
      if (input.required && !(input.name in inputs)) {
        throw new Error(`Required input missing: ${input.name}`);
      }
    }
  }

  private setupDataSubscriptions(instance: EngineWidgetInstance, definition: WidgetDefinition): void {
    for (const input of definition.inputs) {
      if (input.type === 'signal') {
        if (!this.dataSubscriptions.has(input.name)) {
          this.dataSubscriptions.set(input.name, new Set());
        }
        this.dataSubscriptions.get(input.name)!.add(instance.id);
      }
    }
  }

  private cleanupDataSubscriptions(instanceId: string): void {
    for (const [signal, instances] of this.dataSubscriptions.entries()) {
      instances.delete(instanceId);
      if (instances.size === 0) {
        this.dataSubscriptions.delete(signal);
      }
    }
  }

  private loadBuiltinWidgets(): void {
    // Load built-in widget definitions from templates
    import('./widget-templates').then(({ widgetTemplates }) => {
      widgetTemplates.forEach(template => {
        this.registerWidget(template);
      });
    });
  }

  // Public getter methods (same as original)
  getDefinitions(): WidgetDefinition[] {
    return Array.from(this.definitions.values());
  }

  getInstances(): EngineWidgetInstance[] {
    return Array.from(this.instances.values());
  }

  getInstance(instanceId: string): EngineWidgetInstance | undefined {
    return this.instances.get(instanceId);
  }

  async broadcastData(signal: string, data: any): Promise<void> {
    const subscribers = this.dataSubscriptions.get(signal);
    if (!subscribers) {
      return;
    }

    const promises = Array.from(subscribers).map(instanceId => 
      this.processWidget(instanceId, { [signal]: data })
    );

    await Promise.all(promises);
  }
}

// Global widget engine instance with persistence
export const widgetEngineV2 = new WidgetEngineV2();