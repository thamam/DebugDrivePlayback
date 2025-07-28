import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { widgetEngine } from '@/lib/widget-engine';
import WidgetRenderer from './widget-renderer';
import WidgetWizard from './widget-wizard';
import { Grid, Plus, RefreshCw, Settings, Grid3x3 } from 'lucide-react';

export default function WidgetDashboard() {
  const [widgets, setWidgets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadWidgets = () => {
      const instances = widgetEngine.getInstances();
      const activeWidgets = instances
        .filter(instance => instance.status === 'active')
        .map(instance => instance.id);
      
      setWidgets(activeWidgets);
      setIsLoading(false);
    };

    loadWidgets();
    
    const interval = setInterval(loadWidgets, 3000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading widgets...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Grid3x3 className="h-6 w-6" />
            Widget Dashboard
          </h2>
          <p className="text-muted-foreground">
            Live view of your active data visualization widgets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <WidgetWizard />
        </div>
      </div>

      {widgets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Grid3x3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Widgets</h3>
            <p className="text-muted-foreground mb-4">
              Create your first widget to start visualizing your vehicle data
            </p>
            <WidgetWizard />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {widgets.map(widgetId => (
            <WidgetRenderer key={widgetId} widgetId={widgetId} />
          ))}
        </div>
      )}

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Infrastructure Note:</strong> This widget system provides the foundation for external data analyzers. 
          Use the Widget Wizard to create new visualization and analysis components that can be added to your debug player.
        </AlertDescription>
      </Alert>
    </div>
  );
}
