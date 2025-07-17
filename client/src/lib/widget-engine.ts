/**
 * Widget Engine - Core infrastructure for dynamic widget creation and management
 * This is the foundation that allows external widgets to be added via the Widget Wizard
 */

export interface WidgetDefinition {
  id: string;
  name: string;
  type: string;
  category: 'visualization' | 'analysis' | 'data_source' | 'export';
  version: string;
  inputs: WidgetInput[];
  outputs: WidgetOutput[];
  configSchema: Record<string, WidgetConfigField>;
  implementation: WidgetImplementation;
}

export interface WidgetInput {
  name: string;
  type: 'signal' | 'data' | 'config';
  dataType: 'number' | 'string' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  validation?: WidgetValidation;
}

export interface WidgetOutput {
  name: string;
  type: 'chart' | 'data' | 'alert' | 'export';
  dataType: 'number' | 'string' | 'boolean' | 'array' | 'object';
  description?: string;
}

export interface WidgetConfigField {
  type: 'string' | 'number' | 'boolean' | 'select' | 'array' | 'object';
  default?: any;
  options?: string[] | number[];
  validation?: WidgetValidation;
  description?: string;
}

export interface WidgetValidation {
  min?: number;
  max?: number;
  pattern?: string;
  required?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface WidgetImplementation {
  initialize: (config: Record<string, any>) => Promise<void>;
  process: (inputs: Record<string, any>) => Promise<Record<string, any>>;
  render: (data: Record<string, any>) => React.ReactNode;
  cleanup?: () => Promise<void>;
}

export interface WidgetInstance {
  id: string;
  definitionId: string;
  name: string;
  config: Record<string, any>;
  status: 'active' | 'paused' | 'error' | 'stopped';
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  lastUpdated: Date;
  metadata: Record<string, any>;
}

export class WidgetEngine {
  private definitions: Map<string, WidgetDefinition> = new Map();
  private instances: Map<string, WidgetInstance> = new Map();
  private dataSubscriptions: Map<string, Set<string>> = new Map();
  private processingQueue: Array<{instanceId: string, priority: number}> = [];

  constructor() {
    this.loadBuiltinWidgets();
  }

  /**
   * Register a new widget definition
   */
  registerWidget(definition: WidgetDefinition): void {
    this.validateDefinition(definition);
    this.definitions.set(definition.id, definition);
  }

  /**
   * Create a new widget instance from a definition
   */
  async createWidget(
    definitionId: string, 
    instanceId: string, 
    name: string, 
    config: Record<string, any>
  ): Promise<WidgetInstance> {
    const definition = this.definitions.get(definitionId);
    if (!definition) {
      throw new Error(`Widget definition not found: ${definitionId}`);
    }

    // Validate configuration
    this.validateConfig(config, definition.configSchema);

    // Create instance
    const instance: WidgetInstance = {
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

    return instance;
  }

  /**
   * Process data through a widget instance
   */
  async processWidget(instanceId: string, inputData: Record<string, any>): Promise<void> {
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

    } catch (error) {
      instance.status = 'error';
      instance.metadata = { ...instance.metadata, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Get all widget definitions
   */
  getDefinitions(): WidgetDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Get all widget instances
   */
  getInstances(): WidgetInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get widget instance by ID
   */
  getInstance(instanceId: string): WidgetInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Update widget configuration
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
  }

  /**
   * Remove widget instance
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
  }

  /**
   * Pause/resume widget
   */
  setWidgetStatus(instanceId: string, status: 'active' | 'paused' | 'stopped'): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.status = status;
      instance.lastUpdated = new Date();
    }
  }

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

  private setupDataSubscriptions(instance: WidgetInstance, definition: WidgetDefinition): void {
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

  /**
   * Broadcast data to subscribed widgets
   */
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

// Global widget engine instance
export const widgetEngine = new WidgetEngine();