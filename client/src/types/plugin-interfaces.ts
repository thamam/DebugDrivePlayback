// Plugin Interface Definitions for Debug Player Framework
export interface PluginBase {
  name: string;
  version: string;
  description: string;
  pluginType: string;
  isActive: boolean;
  configuration: PluginConfiguration;
}

export interface PluginConfiguration {
  dataColumns: DataColumn[];
  signals: SignalDefinition[];
  dataSource: DataSourceConfig;
  visualization: VisualizationConfig;
  processing: ProcessingConfig;
}

export interface DataColumn {
  name: string;
  dataType: 'float64' | 'int64' | 'string' | 'boolean' | 'timestamp';
  units?: string;
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface SignalDefinition {
  name: string;
  type: 'temporal' | 'spatial' | 'categorical' | 'boolean';
  mode: 'static' | 'dynamic' | 'live';
  description: string;
  outputFormat: SignalOutputFormat;
  handlerFunction: string;
  categories?: string[]; // For categorical signals
}

export interface SignalOutputFormat {
  type: 'single_value' | 'array' | 'object' | 'dataframe';
  structure: Record<string, any>;
  examples: Record<string, any>[];
}

export interface DataSourceConfig {
  type: 'csv' | 'json' | 'binary' | 'streaming' | 'database';
  filePattern: string;
  connectionString?: string;
  format: {
    delimiter?: string;
    encoding?: string;
    headers?: boolean;
    skipRows?: number;
  };
  validation: {
    requiredColumns: string[];
    dataTypes: Record<string, string>;
    constraints: DataConstraint[];
  };
}

export interface DataConstraint {
  column: string;
  type: 'range' | 'regex' | 'enum' | 'not_null' | 'unique';
  value: any;
  message: string;
}

export interface VisualizationConfig {
  enabled: boolean;
  charts: ChartConfig[];
  displays: DisplayConfig[];
  interactions: InteractionConfig[];
}

export interface ChartConfig {
  type: 'line' | 'scatter' | 'bar' | 'spatial_2d' | 'spatial_3d' | 'heatmap';
  title: string;
  axes: {
    x: AxisConfig;
    y: AxisConfig;
    z?: AxisConfig;
  };
  series: SeriesConfig[];
  options: ChartOptions;
}

export interface AxisConfig {
  signal: string;
  label: string;
  units?: string;
  range?: [number, number];
  scale?: 'linear' | 'log' | 'time';
}

export interface SeriesConfig {
  signal: string;
  label: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  marker?: string;
}

export interface ChartOptions {
  legend: boolean;
  grid: boolean;
  zoom: boolean;
  pan: boolean;
  export: boolean;
  realtime: boolean;
}

export interface DisplayConfig {
  type: 'table' | 'gauge' | 'indicator' | 'text' | 'status';
  title: string;
  signal: string;
  format: DisplayFormat;
  position: DisplayPosition;
  conditions?: DisplayCondition[];
}

export interface DisplayFormat {
  precision?: number;
  unit?: string;
  prefix?: string;
  suffix?: string;
  colorScale?: ColorScale;
}

export interface ColorScale {
  type: 'threshold' | 'gradient' | 'categorical';
  values: Array<{
    value: any;
    color: string;
    label?: string;
  }>;
}

export interface DisplayPosition {
  panel: 'left' | 'right' | 'top' | 'bottom' | 'center';
  order: number;
  size: 'small' | 'medium' | 'large';
}

export interface DisplayCondition {
  signal: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
  style: {
    color?: string;
    backgroundColor?: string;
    fontWeight?: 'normal' | 'bold';
    icon?: string;
  };
}

export interface InteractionConfig {
  type: 'hover' | 'click' | 'brush' | 'zoom' | 'pan' | 'select';
  target: string;
  action: InteractionAction;
}

export interface InteractionAction {
  type: 'highlight' | 'filter' | 'navigate' | 'show_details' | 'bookmark' | 'export';
  parameters: Record<string, any>;
}

export interface ProcessingConfig {
  enabled: boolean;
  pipeline: ProcessingStep[];
  caching: CachingConfig;
  performance: PerformanceConfig;
}

export interface ProcessingStep {
  name: string;
  type: 'filter' | 'transform' | 'aggregate' | 'validate' | 'interpolate' | 'smooth';
  parameters: Record<string, any>;
  enabled: boolean;
  order: number;
}

export interface CachingConfig {
  enabled: boolean;
  strategy: 'memory' | 'disk' | 'hybrid';
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache size in MB
  keyPattern: string;
}

export interface PerformanceConfig {
  batchSize: number;
  maxConcurrency: number;
  timeout: number;
  retryAttempts: number;
  optimization: {
    vectorization: boolean;
    parallelization: boolean;
    lazyLoading: boolean;
  };
}

// Pre-defined Plugin Types
export interface PluginTypeTemplate {
  name: string;
  description: string;
  category: 'data_source' | 'visualization' | 'analysis' | 'streaming' | 'hybrid';
  template: Partial<PluginConfiguration>;
  requiredFields: string[];
  examples: PluginExample[];
}

export interface PluginExample {
  name: string;
  description: string;
  configuration: PluginConfiguration;
  sampleData: Record<string, any>;
}

// Plugin Validation
export interface PluginValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

// Plugin Runtime Interface
export interface PluginRuntime {
  pluginId: string;
  status: 'loading' | 'active' | 'error' | 'inactive';
  performance: {
    loadTime: number;
    memoryUsage: number;
    executionTime: number;
    dataPoints: number;
  };
  errors: string[];
  lastUpdate: Date;
}
