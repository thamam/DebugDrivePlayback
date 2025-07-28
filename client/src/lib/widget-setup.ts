/**
 * Widget Setup - Registers simple widgets
 * Replaces complex widget template initialization
 */
import { widgetRegistry } from './simple-widget-registry';
import { TrajectoryWidget, SpeedWidget, SignalWidget, ExportWidget } from '@/components/simple-widgets';

// Register built-in widgets
widgetRegistry.register({
  id: 'trajectory',
  name: 'Trajectory Visualizer',
  category: 'visualization',
  component: TrajectoryWidget
});

widgetRegistry.register({
  id: 'speed',
  name: 'Speed Analyzer',
  category: 'analysis',
  component: SpeedWidget
});

widgetRegistry.register({
  id: 'signals',
  name: 'Signal Monitor',
  category: 'analysis',
  component: SignalWidget
});

widgetRegistry.register({
  id: 'export',
  name: 'Data Exporter',
  category: 'export',
  component: ExportWidget
});

export { widgetRegistry };
