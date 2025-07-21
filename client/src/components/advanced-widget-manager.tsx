/**
 * Advanced Widget Manager with enhanced collaboration features
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Stop, 
  Trash2, 
  Download, 
  Upload, 
  Share, 
  Copy,
  BarChart3,
  Network,
  Workflow,
  Store,
  Group,
  MessageCircle,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { widgetEngineV3 } from '@/lib/widget-engine-v3';
import { widgetMarketplace } from '@/lib/widget-marketplace';
import { widgetCollaboration } from '@/lib/widget-collaboration';
import type { WidgetInstance } from '@/lib/widget-engine';
import type { WidgetWorkflow, DataPipeline, WidgetGroup } from '@/lib/widget-collaboration';

interface AdvancedWidgetManagerProps {
  onWidgetCreate?: (widget: WidgetInstance) => void;
  onWidgetUpdate?: (widget: WidgetInstance) => void;
  onWidgetRemove?: (widgetId: string) => void;
}

export default function AdvancedWidgetManager({
  onWidgetCreate,
  onWidgetUpdate,
  onWidgetRemove
}: AdvancedWidgetManagerProps) {
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [workflows, setWorkflows] = useState<WidgetWorkflow[]>([]);
  const [pipelines, setPipelines] = useState<DataPipeline[]>([]);
  const [groups, setGroups] = useState<WidgetGroup[]>([]);
  const [selectedTab, setSelectedTab] = useState('widgets');
  const [selectedWidget, setSelectedWidget] = useState<WidgetInstance | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadWidgets();
    loadWorkflows();
    loadPipelines();
    loadGroups();
  }, []);

  const loadWidgets = () => {
    const allWidgets = widgetEngineV3.getInstances();
    setWidgets(allWidgets);
  };

  const loadWorkflows = () => {
    // Load workflows from collaboration system
    // This would be implemented with proper data fetching
    setWorkflows([]);
  };

  const loadPipelines = () => {
    const activePipelines = widgetCollaboration.getActivePipelines();
    setPipelines(activePipelines);
  };

  const loadGroups = () => {
    const allGroups = widgetCollaboration.getWidgetGroups();
    setGroups(allGroups);
  };

  const handleCreateWidget = async (templateId: string, config: any) => {
    try {
      setIsCreating(true);
      const instanceId = `widget-${Date.now()}`;
      const widget = await widgetEngineV3.createAdvancedWidget(
        templateId, // This would need to be resolved to a definition
        instanceId,
        config.name || 'New Widget',
        config
      );
      
      setWidgets([...widgets, widget]);
      onWidgetCreate?.(widget);
    } catch (error) {
      console.error('Failed to create widget:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    try {
      await widgetEngineV3.removeWidget(widgetId);
      setWidgets(widgets.filter(w => w.id !== widgetId));
      onWidgetRemove?.(widgetId);
    } catch (error) {
      console.error('Failed to remove widget:', error);
    }
  };

  const handleWidgetStatusChange = async (widgetId: string, status: 'active' | 'paused' | 'stopped') => {
    try {
      await widgetEngineV3.setWidgetStatus(widgetId, status);
      setWidgets(widgets.map(w => 
        w.id === widgetId ? { ...w, status } : w
      ));
    } catch (error) {
      console.error('Failed to update widget status:', error);
    }
  };

  const filteredWidgets = widgets.filter(widget => {
    const matchesSearch = widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         widget.definitionId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || 
                           widget.metadata?.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="advanced-widget-manager p-6 space-y-6">
      <div className="header flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Widget Manager</h2>
          <p className="text-muted-foreground">
            Manage widgets, workflows, and collaborations
          </p>
        </div>
        <div className="actions flex gap-2">
          <Button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Widget
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="widgets" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Widgets
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="pipelines" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Pipelines
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Group className="h-4 w-4" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="widgets" className="space-y-4">
          <WidgetManagementPanel
            widgets={filteredWidgets}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            onStatusChange={handleWidgetStatusChange}
            onRemove={handleRemoveWidget}
            onSelect={setSelectedWidget}
          />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <WorkflowManagementPanel
            workflows={workflows}
            widgets={widgets}
            onWorkflowCreate={() => loadWorkflows()}
          />
        </TabsContent>

        <TabsContent value="pipelines" className="space-y-4">
          <PipelineManagementPanel
            pipelines={pipelines}
            widgets={widgets}
            onPipelineCreate={() => loadPipelines()}
          />
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <GroupManagementPanel
            groups={groups}
            widgets={widgets}
            onGroupCreate={() => loadGroups()}
          />
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <MarketplacePanel onInstall={() => loadWidgets()} />
        </TabsContent>
      </Tabs>

      {selectedWidget && (
        <WidgetDetailsPanel
          widget={selectedWidget}
          onClose={() => setSelectedWidget(null)}
          onUpdate={(widget) => {
            setWidgets(widgets.map(w => w.id === widget.id ? widget : w));
            onWidgetUpdate?.(widget);
          }}
        />
      )}
    </div>
  );
}

function WidgetManagementPanel({
  widgets,
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  onStatusChange,
  onRemove,
  onSelect
}: any) {
  return (
    <div className="space-y-4">
      <div className="filters flex gap-4">
        <Input
          placeholder="Search widgets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="visualization">Visualization</SelectItem>
            <SelectItem value="analysis">Analysis</SelectItem>
            <SelectItem value="monitoring">Monitoring</SelectItem>
            <SelectItem value="ai">AI/ML</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((widget: WidgetInstance) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            onStatusChange={onStatusChange}
            onRemove={onRemove}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function WidgetCard({ widget, onStatusChange, onRemove, onSelect }: any) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Stop className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => onSelect(widget)}>
            <CardTitle className="text-lg flex items-center gap-2">
              {widget.name}
              {getStatusIcon(widget.status)}
            </CardTitle>
            <CardDescription>{widget.definitionId}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(widget.id, widget.status === 'active' ? 'paused' : 'active');
              }}
            >
              {widget.status === 'active' ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(widget.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Last Updated:</span>
            <span>{widget.lastUpdated.toLocaleTimeString()}</span>
          </div>
          {widget.metadata?.metrics && (
            <div className="flex gap-2 flex-wrap">
              {Object.entries(widget.metadata.metrics).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkflowManagementPanel({ workflows, widgets, onWorkflowCreate }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Workflows</h3>
        <Button onClick={onWorkflowCreate}>Create Workflow</Button>
      </div>
      
      <div className="grid gap-4">
        {workflows.map((workflow: WidgetWorkflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {workflow.name}
                <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                  {workflow.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
              <CardDescription>{workflow.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm">
                <span>Steps: {workflow.steps.length}</span>
                <span>Triggers: {workflow.triggers.length}</span>
                <span>Created: {workflow.createdAt.toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PipelineManagementPanel({ pipelines, widgets, onPipelineCreate }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Data Pipelines</h3>
        <Button onClick={onPipelineCreate}>Create Pipeline</Button>
      </div>
      
      <div className="grid gap-4">
        {pipelines.map((pipeline: DataPipeline) => (
          <Card key={pipeline.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {pipeline.name}
                <Badge variant={pipeline.isActive ? 'default' : 'secondary'}>
                  {pipeline.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Source: {pipeline.sourceWidgetId}</span>
                  <span>Targets: {pipeline.targetWidgetIds.length}</span>
                </div>
                <div className="text-sm">
                  Transformations: {pipeline.transformations.length}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GroupManagementPanel({ groups, widgets, onGroupCreate }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Widget Groups</h3>
        <Button onClick={onGroupCreate}>Create Group</Button>
      </div>
      
      <div className="grid gap-4">
        {groups.map((group: WidgetGroup) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  Widgets: {group.widgetIds.length}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {group.widgetIds.map(widgetId => (
                    <Badge key={widgetId} variant="outline">
                      {widgets.find((w: WidgetInstance) => w.id === widgetId)?.name || widgetId}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MarketplacePanel({ onInstall }: any) {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await widgetMarketplace.searchWidgets({ search: query });
      setSearchResults(results.widgets);
    } catch (error) {
      console.error('Marketplace search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="search">
        <Input
          placeholder="Search marketplace..."
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      
      <div className="grid gap-4">
        {searchResults.map((widget: any) => (
          <Card key={widget.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {widget.name}
                <Badge>{widget.pricing.type}</Badge>
              </CardTitle>
              <CardDescription>{widget.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  by {widget.author} • v{widget.version}
                </div>
                <Button 
                  size="sm"
                  onClick={() => {
                    widgetMarketplace.installWidget(widget.id).then(onInstall);
                  }}
                >
                  Install
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WidgetDetailsPanel({ widget, onClose, onUpdate }: any) {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    // Load widget metrics
    const widgetMetrics = widgetEngineV3.getMetrics(widget.id);
    setMetrics(widgetMetrics);
  }, [widget.id]);

  return (
    <Card className="fixed inset-y-4 right-4 w-96 z-50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Widget Details
          <Button size="sm" variant="ghost" onClick={onClose}>
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input value={widget.name} readOnly />
        </div>
        
        <div>
          <Label>Status</Label>
          <Badge variant={widget.status === 'active' ? 'default' : 'secondary'}>
            {widget.status}
          </Badge>
        </div>

        <div>
          <Label>Performance Metrics</Label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {metrics.map((metric: any, index) => (
              <div key={index} className="text-sm flex justify-between">
                <span>{metric.metricName}:</span>
                <span>{metric.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Configuration</Label>
          <Textarea 
            value={JSON.stringify(widget.config, null, 2)} 
            readOnly 
            className="h-32"
          />
        </div>
      </CardContent>
    </Card>
  );
}