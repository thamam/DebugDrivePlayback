/**
 * Widget Collaboration System - Enable widgets to work together
 */

import { widgetEngineV3 } from './widget-engine-v3';
import type { WidgetMessage, WidgetInstance } from './widget-engine';

export interface WidgetWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  conditions: WorkflowCondition[];
  isActive: boolean;
  createdAt: Date;
  lastExecuted?: Date;
}

export interface WorkflowStep {
  id: string;
  type: 'widget-action' | 'data-transform' | 'condition-check' | 'delay';
  widgetId?: string;
  action?: string;
  parameters?: Record<string, any>;
  nextSteps: string[];
  errorHandling?: {
    retryCount: number;
    fallbackStep?: string;
  };
}

export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'data-threshold' | 'widget-message';
  config: Record<string, any>;
}

export interface WorkflowCondition {
  id: string;
  expression: string;
  description: string;
}

export interface DataPipeline {
  id: string;
  name: string;
  sourceWidgetId: string;
  targetWidgetIds: string[];
  transformations: DataTransformation[];
  isActive: boolean;
  bufferSize: number;
  flushInterval: number;
}

export interface DataTransformation {
  type: 'filter' | 'map' | 'aggregate' | 'merge' | 'split';
  config: Record<string, any>;
  order: number;
}

export interface WidgetGroup {
  id: string;
  name: string;
  description: string;
  widgetIds: string[];
  layout: GroupLayout;
  sharedConfig: Record<string, any>;
  syncSettings: {
    timeRange: boolean;
    zoom: boolean;
    selection: boolean;
  };
}

export interface GroupLayout {
  type: 'grid' | 'tabs' | 'accordion' | 'custom';
  config: Record<string, any>;
}

/**
 * Widget Collaboration Manager
 */
export class WidgetCollaboration {
  private workflows: Map<string, WidgetWorkflow> = new Map();
  private pipelines: Map<string, DataPipeline> = new Map();
  private groups: Map<string, WidgetGroup> = new Map();
  private executionQueue: Array<{ workflowId: string; stepId: string; context: any }> = [];
  private isProcessing = false;

  constructor() {
    this.startExecutionLoop();
    this.setupEventListeners();
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflow: Omit<WidgetWorkflow, 'id' | 'createdAt'>): Promise<string> {
    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const fullWorkflow: WidgetWorkflow = {
      ...workflow,
      id: workflowId,
      createdAt: new Date()
    };

    this.workflows.set(workflowId, fullWorkflow);
    
    // Setup triggers
    this.setupWorkflowTriggers(fullWorkflow);
    
    console.log(`Workflow created: ${workflowId}`);
    return workflowId;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, context: any = {}): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.isActive) {
      throw new Error(`Workflow not found or inactive: ${workflowId}`);
    }

    // Find starting steps (steps with no predecessors)
    const startingSteps = workflow.steps.filter(step => 
      !workflow.steps.some(s => s.nextSteps.includes(step.id))
    );

    // Queue starting steps for execution
    startingSteps.forEach(step => {
      this.executionQueue.push({
        workflowId,
        stepId: step.id,
        context
      });
    });

    workflow.lastExecuted = new Date();
    console.log(`Workflow ${workflowId} queued for execution`);
  }

  /**
   * Create a data pipeline between widgets
   */
  async createDataPipeline(pipeline: Omit<DataPipeline, 'id'>): Promise<string> {
    const pipelineId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const fullPipeline: DataPipeline = {
      ...pipeline,
      id: pipelineId
    };

    this.pipelines.set(pipelineId, fullPipeline);
    
    // Setup data flow
    this.setupDataPipeline(fullPipeline);
    
    console.log(`Data pipeline created: ${pipelineId}`);
    return pipelineId;
  }

  /**
   * Create a widget group
   */
  async createWidgetGroup(group: Omit<WidgetGroup, 'id'>): Promise<string> {
    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const fullGroup: WidgetGroup = {
      ...group,
      id: groupId
    };

    this.groups.set(groupId, fullGroup);
    
    // Setup group synchronization
    this.setupGroupSync(fullGroup);
    
    console.log(`Widget group created: ${groupId}`);
    return groupId;
  }

  /**
   * Add widget to group
   */
  async addWidgetToGroup(groupId: string, widgetId: string): Promise<void> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    if (!group.widgetIds.includes(widgetId)) {
      group.widgetIds.push(widgetId);
      this.setupWidgetGroupSync(widgetId, group);
      console.log(`Widget ${widgetId} added to group ${groupId}`);
    }
  }

  /**
   * Synchronize widget groups
   */
  async syncWidgetGroup(groupId: string, event: string, data: any): Promise<void> {
    const group = this.groups.get(groupId);
    if (!group) return;

    // Broadcast sync event to all widgets in group
    const promises = group.widgetIds.map(widgetId => 
      widgetEngineV3.sendMessage('system', {
        type: 'group-sync',
        toInstanceId: widgetId,
        payload: {
          groupId,
          event,
          data,
          syncSettings: group.syncSettings
        }
      })
    );

    await Promise.all(promises);
  }

  /**
   * Create widget template from workflow
   */
  async createTemplateFromWorkflow(workflowId: string, templateName: string): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Create a composite widget template that encapsulates the entire workflow
    const template = {
      id: `composite-${templateName.toLowerCase().replace(/\s+/g, '-')}`,
      name: templateName,
      type: 'composite',
      category: 'workflow',
      description: `Composite widget from workflow: ${workflow.name}`,
      workflow: workflow,
      implementation: {
        async initialize(config: any) {
          // Initialize all widgets in the workflow
          console.log(`Initializing composite widget: ${templateName}`);
        },
        
        async process(inputs: any) {
          // Execute the workflow with inputs
          return await this.executeWorkflow(workflowId, inputs);
        },
        
        render(outputs: any, config: any) {
          return `
            <div class="composite-widget">
              <h3>${templateName}</h3>
              <div class="workflow-status">
                Status: ${workflow.isActive ? 'Active' : 'Inactive'}
              </div>
              <div class="workflow-steps">
                Steps: ${workflow.steps.length}
              </div>
            </div>
          `;
        }
      }
    };

    return template;
  }

  /**
   * Get workflow execution history
   */
  getWorkflowHistory(workflowId: string): any[] {
    // Return execution history for the workflow
    return []; // Placeholder - would be implemented with proper storage
  }

  /**
   * Get active pipelines
   */
  getActivePipelines(): DataPipeline[] {
    return Array.from(this.pipelines.values()).filter(p => p.isActive);
  }

  /**
   * Get widget groups
   */
  getWidgetGroups(): WidgetGroup[] {
    return Array.from(this.groups.values());
  }

  // Private methods

  private async executeWorkflowStep(workflowId: string, stepId: string, context: any): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    const step = workflow.steps.find(s => s.id === stepId);
    if (!step) return;

    try {
      let result;

      switch (step.type) {
        case 'widget-action':
          result = await this.executeWidgetAction(step, context);
          break;
        case 'data-transform':
          result = await this.executeDataTransform(step, context);
          break;
        case 'condition-check':
          result = await this.executeConditionCheck(step, context);
          break;
        case 'delay':
          result = await this.executeDelay(step, context);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      // Queue next steps
      step.nextSteps.forEach(nextStepId => {
        this.executionQueue.push({
          workflowId,
          stepId: nextStepId,
          context: { ...context, previousResult: result }
        });
      });

      return result;
    } catch (error) {
      console.error(`Workflow step failed: ${stepId}`, error);
      
      // Handle error based on step configuration
      if (step.errorHandling) {
        if (step.errorHandling.retryCount > 0) {
          // Retry logic
          setTimeout(() => {
            step.errorHandling!.retryCount--;
            this.executionQueue.push({ workflowId, stepId, context });
          }, 1000);
        } else if (step.errorHandling.fallbackStep) {
          // Execute fallback step
          this.executionQueue.push({
            workflowId,
            stepId: step.errorHandling.fallbackStep,
            context: { ...context, error }
          });
        }
      }
    }
  }

  private async executeWidgetAction(step: WorkflowStep, context: any): Promise<any> {
    if (!step.widgetId || !step.action) return;

    // Send action message to widget
    await widgetEngineV3.sendMessage('workflow', {
      type: 'action-request',
      toInstanceId: step.widgetId,
      payload: {
        action: step.action,
        parameters: step.parameters,
        context
      }
    });

    return { type: 'widget-action', widgetId: step.widgetId, action: step.action };
  }

  private async executeDataTransform(step: WorkflowStep, context: any): Promise<any> {
    // Execute data transformation logic
    const { type, config } = step.parameters || {};
    
    switch (type) {
      case 'filter':
        return this.filterData(context.data, config);
      case 'map':
        return this.mapData(context.data, config);
      case 'aggregate':
        return this.aggregateData(context.data, config);
      default:
        return context.data;
    }
  }

  private async executeConditionCheck(step: WorkflowStep, context: any): Promise<boolean> {
    const { expression } = step.parameters || {};
    
    // Simple expression evaluation (in production, use a proper expression engine)
    try {
      const result = eval(expression.replace(/\$\{([^}]+)\}/g, (match: string, key: string) => {
        return JSON.stringify(context[key]);
      }));
      return Boolean(result);
    } catch (error) {
      console.error('Condition evaluation failed:', error);
      return false;
    }
  }

  private async executeDelay(step: WorkflowStep, context: any): Promise<void> {
    const { duration = 1000 } = step.parameters || {};
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  private setupWorkflowTriggers(workflow: WidgetWorkflow): void {
    workflow.triggers.forEach(trigger => {
      switch (trigger.type) {
        case 'schedule':
          this.setupScheduleTrigger(workflow.id, trigger.config);
          break;
        case 'event':
          this.setupEventTrigger(workflow.id, trigger.config);
          break;
        case 'data-threshold':
          this.setupDataThresholdTrigger(workflow.id, trigger.config);
          break;
        case 'widget-message':
          this.setupWidgetMessageTrigger(workflow.id, trigger.config);
          break;
      }
    });
  }

  private setupScheduleTrigger(workflowId: string, config: any): void {
    const { interval, unit = 'seconds' } = config;
    const milliseconds = this.convertToMilliseconds(interval, unit);
    
    setInterval(() => {
      this.executeWorkflow(workflowId, { trigger: 'schedule' });
    }, milliseconds);
  }

  private setupEventTrigger(workflowId: string, config: any): void {
    // Setup event listener for workflow trigger
    document.addEventListener(config.eventName, () => {
      this.executeWorkflow(workflowId, { trigger: 'event', eventName: config.eventName });
    });
  }

  private setupDataThresholdTrigger(workflowId: string, config: any): void {
    // Monitor data and trigger workflow when threshold is met
    // This would integrate with the data monitoring system
  }

  private setupWidgetMessageTrigger(workflowId: string, config: any): void {
    // Listen for specific widget messages
    widgetEngineV3.subscribeToMessages('workflow', (message) => {
      if (message.type === config.messageType) {
        this.executeWorkflow(workflowId, { trigger: 'message', message });
      }
    });
  }

  private setupDataPipeline(pipeline: DataPipeline): void {
    // Subscribe to source widget data
    widgetEngineV3.subscribeToMessages(pipeline.sourceWidgetId, (message) => {
      if (message.type === 'data-output') {
        this.processDataThroughPipeline(pipeline, message.payload);
      }
    });
  }

  private async processDataThroughPipeline(pipeline: DataPipeline, data: any): Promise<void> {
    let transformedData = data;

    // Apply transformations in order
    const sortedTransformations = pipeline.transformations.sort((a, b) => a.order - b.order);
    
    for (const transformation of sortedTransformations) {
      transformedData = await this.applyTransformation(transformedData, transformation);
    }

    // Send to target widgets
    const promises = pipeline.targetWidgetIds.map(widgetId =>
      widgetEngineV3.sendMessage(pipeline.sourceWidgetId, {
        type: 'pipeline-data',
        toInstanceId: widgetId,
        payload: {
          pipelineId: pipeline.id,
          data: transformedData
        }
      })
    );

    await Promise.all(promises);
  }

  private async applyTransformation(data: any, transformation: DataTransformation): Promise<any> {
    switch (transformation.type) {
      case 'filter':
        return this.filterData(data, transformation.config);
      case 'map':
        return this.mapData(data, transformation.config);
      case 'aggregate':
        return this.aggregateData(data, transformation.config);
      case 'merge':
        return this.mergeData(data, transformation.config);
      case 'split':
        return this.splitData(data, transformation.config);
      default:
        return data;
    }
  }

  private setupGroupSync(group: WidgetGroup): void {
    // Setup synchronization for widget group
    group.widgetIds.forEach(widgetId => {
      this.setupWidgetGroupSync(widgetId, group);
    });
  }

  private setupWidgetGroupSync(widgetId: string, group: WidgetGroup): void {
    // Listen for sync events from widget
    widgetEngineV3.subscribeToMessages(widgetId, (message) => {
      if (message.type === 'sync-event') {
        this.syncWidgetGroup(group.id, message.payload.event, message.payload.data);
      }
    });
  }

  private startExecutionLoop(): void {
    setInterval(() => {
      if (!this.isProcessing && this.executionQueue.length > 0) {
        this.processExecutionQueue();
      }
    }, 100);
  }

  private async processExecutionQueue(): Promise<void> {
    this.isProcessing = true;
    
    try {
      while (this.executionQueue.length > 0) {
        const item = this.executionQueue.shift();
        if (item) {
          await this.executeWorkflowStep(item.workflowId, item.stepId, item.context);
        }
      }
    } catch (error) {
      console.error('Execution queue processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private setupEventListeners(): void {
    // Setup global event listeners for collaboration features
    document.addEventListener('widget-created', (event: any) => {
      // Auto-add to relevant groups
      this.handleWidgetCreated(event.detail.widgetId);
    });

    document.addEventListener('widget-removed', (event: any) => {
      // Remove from groups and cleanup
      this.handleWidgetRemoved(event.detail.widgetId);
    });
  }

  private handleWidgetCreated(widgetId: string): void {
    // Check if widget should be auto-added to any groups
    this.groups.forEach(group => {
      if (group.sharedConfig.autoAddNewWidgets) {
        this.addWidgetToGroup(group.id, widgetId);
      }
    });
  }

  private handleWidgetRemoved(widgetId: string): void {
    // Remove widget from all groups
    this.groups.forEach(group => {
      const index = group.widgetIds.indexOf(widgetId);
      if (index !== -1) {
        group.widgetIds.splice(index, 1);
      }
    });
  }

  // Data transformation helpers
  private filterData(data: any, config: any): any {
    if (!Array.isArray(data)) return data;
    const { condition } = config;
    return data.filter((item: any) => eval(condition.replace(/\$item/g, JSON.stringify(item))));
  }

  private mapData(data: any, config: any): any {
    if (!Array.isArray(data)) return data;
    const { transform } = config;
    return data.map((item: any) => eval(transform.replace(/\$item/g, JSON.stringify(item))));
  }

  private aggregateData(data: any, config: any): any {
    if (!Array.isArray(data)) return data;
    const { operation, field } = config;
    
    switch (operation) {
      case 'sum':
        return data.reduce((sum: number, item: any) => sum + (item[field] || 0), 0);
      case 'average':
        const sum = data.reduce((sum: number, item: any) => sum + (item[field] || 0), 0);
        return sum / data.length;
      case 'max':
        return Math.max(...data.map((item: any) => item[field] || 0));
      case 'min':
        return Math.min(...data.map((item: any) => item[field] || 0));
      default:
        return data;
    }
  }

  private mergeData(data: any, config: any): any {
    // Merge data with external source
    return { ...data, ...config.mergeWith };
  }

  private splitData(data: any, config: any): any[] {
    // Split data into multiple parts
    const { field } = config;
    const groups: Record<string, any[]> = {};
    
    if (Array.isArray(data)) {
      data.forEach(item => {
        const key = item[field] || 'default';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
    }
    
    return Object.values(groups);
  }

  private convertToMilliseconds(value: number, unit: string): number {
    switch (unit) {
      case 'seconds': return value * 1000;
      case 'minutes': return value * 60 * 1000;
      case 'hours': return value * 60 * 60 * 1000;
      case 'days': return value * 24 * 60 * 60 * 1000;
      default: return value;
    }
  }
}

// Global collaboration instance
export const widgetCollaboration = new WidgetCollaboration();