import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Settings, 
  Play, 
  Pause, 
  MoreVertical, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2,
  BarChart3,
  Map,
  Code,
  CheckCircle,
  AlertCircle,
  Grid
} from "lucide-react";
import WidgetWizard from "./widget-wizard";
import { widgetEngine } from "@/lib/widget-engine";

interface Widget {
  id: string;
  name: string;
  type: string;
  category: 'visualization' | 'analysis' | 'data_source' | 'export';
  status: 'active' | 'paused' | 'error' | 'stopped';
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
  lastUpdated: string;
}

const mockWidgets: Widget[] = [
  {
    id: '1',
    name: 'Vehicle Trajectory',
    type: 'trajectory_visualizer',
    category: 'visualization',
    status: 'active',
    config: { showPlannedPath: true, pathColor: '#8884d8', chartSize: 'medium' },
    inputs: ['w_car_pose_now_x_', 'w_car_pose_now_y'],
    outputs: ['spatial_chart'],
    lastUpdated: '2025-07-16T10:30:00Z'
  },
  {
    id: '2',
    name: 'Speed Analysis',
    type: 'speed_analyzer',
    category: 'analysis',
    status: 'active',
    config: { showTarget: true, units: 'mps', analysisWindow: 10 },
    inputs: ['current_speed_mps', 'target_speed_mps'],
    outputs: ['speed_stats', 'speed_chart'],
    lastUpdated: '2025-07-16T10:25:00Z'
  },
  {
    id: '3',
    name: 'Wheel Speed Monitor',
    type: 'signal_monitor',
    category: 'visualization',
    status: 'paused',
    config: { signals: ['front_left_wheel_speed', 'front_right_wheel_speed'], chartType: 'line', timeWindow: 60 },
    inputs: ['front_left_wheel_speed', 'front_right_wheel_speed'],
    outputs: ['signal_chart'],
    lastUpdated: '2025-07-16T10:20:00Z'
  }
];

export default function WidgetManager() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [activeTab, setActiveTab] = useState('active');

  // Load widgets from the engine
  useEffect(() => {
    const loadWidgets = () => {
      const instances = widgetEngine.getInstances();
      const formattedWidgets = instances.map(instance => ({
        id: instance.id,
        name: instance.name,
        type: instance.definitionId,
        category: 'visualization' as const, // Default category
        status: instance.status,
        config: instance.config,
        inputs: Object.keys(instance.inputs || {}),
        outputs: Object.keys(instance.outputs || {}),
        lastUpdated: instance.lastUpdated.toISOString()
      }));
      
      setWidgets(formattedWidgets);
    };

    loadWidgets();
    
    // Refresh widgets every few seconds
    const interval = setInterval(loadWidgets, 5000);
    return () => clearInterval(interval);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visualization':
        return Eye;
      case 'analysis':
        return BarChart3;
      case 'data_source':
        return Code;
      case 'export':
        return Settings;
      default:
        return Settings;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'stopped':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleWidgetAction = (widgetId: string, action: string) => {
    const status = action === 'start' ? 'active' : action === 'pause' ? 'paused' : 'stopped';
    widgetEngine.setWidgetStatus(widgetId, status);
    
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, status }
        : widget
    ));
  };

  const handleDeleteWidget = async (widgetId: string) => {
    try {
      await widgetEngine.removeWidget(widgetId);
      setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
    } catch (error) {
      console.error('Error deleting widget:', error);
    }
  };

  const filterWidgets = (status?: string) => {
    if (!status || status === 'all') return widgets;
    return widgets.filter(widget => widget.status === status);
  };

  const renderWidget = (widget: Widget) => {
    const CategoryIcon = getCategoryIcon(widget.category);
    
    return (
      <Card key={widget.id} className="hover:shadow-md transition-shadow" data-testid="widget-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CategoryIcon className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">{widget.name}</CardTitle>
                <CardDescription>{widget.type}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(widget.status)}`} />
                <Badge variant={widget.status === 'active' ? 'default' : 'secondary'}>
                  {widget.status}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="widget-menu-button">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {widget.status === 'active' ? (
                    <DropdownMenuItem onClick={() => handleWidgetAction(widget.id, 'pause')}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleWidgetAction(widget.id, 'start')}>
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Configure
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteWidget(widget.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Inputs:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {widget.inputs.map((input, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {input}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Outputs:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {widget.outputs.map((output, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {output}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(widget.lastUpdated).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Widget Manager</h1>
          <p className="text-muted-foreground">
            Manage your data visualization and analysis widgets
          </p>
        </div>
        <WidgetWizard />
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Widget System Active:</strong> {widgets.filter(w => w.status === 'active').length} widgets running, processing real vehicle data from your trip.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active ({widgets.filter(w => w.status === 'active').length})</TabsTrigger>
          <TabsTrigger value="all">All Widgets ({widgets.length})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({widgets.filter(w => w.status === 'paused').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterWidgets('active').map(renderWidget)}
          </div>
          {filterWidgets('active').length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active widgets. Create a new widget to start analyzing your vehicle data.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {widgets.map(renderWidget)}
          </div>
        </TabsContent>

        <TabsContent value="paused" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterWidgets('paused').map(renderWidget)}
          </div>
          {filterWidgets('paused').length === 0 && (
            <Alert>
              <AlertDescription>
                No paused widgets.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
