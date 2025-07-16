import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { widgetEngine, WidgetInstance } from '@/lib/widget-engine';
import { AlertCircle, CheckCircle, Pause, Play } from 'lucide-react';

interface WidgetRendererProps {
  widgetId: string;
  className?: string;
}

export default function WidgetRenderer({ widgetId, className = '' }: WidgetRendererProps) {
  const [widget, setWidget] = useState<WidgetInstance | null>(null);
  const [renderContent, setRenderContent] = useState<React.ReactNode>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateWidget = () => {
      const instance = widgetEngine.getInstance(widgetId);
      if (instance) {
        setWidget(instance);
        
        // Get the widget definition to render content
        const definitions = widgetEngine.getDefinitions();
        const definition = definitions.find(d => d.id === instance.definitionId);
        
        if (definition && instance.outputs) {
          try {
            const content = definition.implementation.render(instance.outputs);
            setRenderContent(content);
            setError(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Render error');
            setRenderContent(null);
          }
        }
      } else {
        setWidget(null);
        setRenderContent(null);
        setError('Widget not found');
      }
    };

    updateWidget();
    
    // Update widget content periodically
    const interval = setInterval(updateWidget, 1000);
    return () => clearInterval(interval);
  }, [widgetId]);

  if (!widget) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Widget not found: {widgetId}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-3 w-3" />;
      case 'paused':
        return <Pause className="h-3 w-3" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <CheckCircle className="h-3 w-3" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{widget.name}</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(widget.status)}`} />
            <Badge variant={widget.status === 'active' ? 'default' : 'secondary'} className="flex items-center gap-1">
              {getStatusIcon(widget.status)}
              {widget.status}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {widget.definitionId} • Updated: {new Date(widget.lastUpdated).toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : widget.status === 'error' ? (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Widget error: {widget.metadata?.error || 'Unknown error'}
            </AlertDescription>
          </Alert>
        ) : null}
        
        {widget.status === 'active' && renderContent ? (
          <div className="widget-content">
            {renderContent}
          </div>
        ) : widget.status === 'paused' ? (
          <div className="text-center py-8 text-muted-foreground">
            Widget is paused
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Widget is not active
          </div>
        )}
        
        {widget.status === 'active' && (
          <div className="mt-4 text-xs text-muted-foreground">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Inputs:</strong> {Object.keys(widget.inputs || {}).join(', ') || 'None'}
              </div>
              <div>
                <strong>Outputs:</strong> {Object.keys(widget.outputs || {}).join(', ') || 'None'}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}