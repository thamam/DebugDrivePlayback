import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Database, Cpu, FileText, Play } from "lucide-react";

interface IntegrationStatusProps {
  onTestTripData: () => void;
}

export default function IntegrationStatus({ onTestTripData }: IntegrationStatusProps) {
  const [pythonBackendStatus, setPythonBackendStatus] = useState<'checking' | 'connected' | 'demo'>('checking');
  const [plugins, setPlugins] = useState<any[]>([]);
  const [signals, setSignals] = useState<any>({});
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      // Check Python backend plugins
      const pluginsResponse = await fetch('/api/python/plugins');
      const pluginsData = await pluginsResponse.json();
      setPlugins(pluginsData);

      // Check available signals
      const signalsResponse = await fetch('/api/python/signals');
      const signalsData = await signalsResponse.json();
      setSignals(signalsData);

      // Test data loading capability
      const testResponse = await fetch('/api/python/load-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: '/home/thh3/data/trips/2025-04-07T10_50_18',
          pluginType: 'vehicle_data'
        })
      });
      
      const testData = await testResponse.json();
      
      // Determine backend status
      if (testData.message?.includes('Path not found')) {
        setPythonBackendStatus('demo');
      } else {
        setPythonBackendStatus('connected');
      }
      
      setLastCheck(new Date());
    } catch (error) {
      console.error('Integration check failed:', error);
      setPythonBackendStatus('demo');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'demo':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded-full animate-pulse" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Python Backend Connected';
      case 'demo':
        return 'Demo Mode - Ready for Trip Data';
      default:
        return 'Checking...';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Python Backend Integration Status</h3>
          <p className="text-sm text-muted-foreground">
            Last checked: {lastCheck.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" onClick={checkIntegrationStatus}>
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Backend Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4" />
              Backend Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(pythonBackendStatus)}
              <span className="text-sm font-medium">{getStatusText(pythonBackendStatus)}</span>
            </div>
            <Badge variant={pythonBackendStatus === 'connected' ? 'default' : 'secondary'}>
              {pythonBackendStatus === 'connected' ? 'Live' : 'Demo'}
            </Badge>
          </CardContent>
        </Card>

        {/* Plugins Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Available Plugins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {plugins.map((plugin, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{plugin.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {plugin.signals?.length || 0} signals
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Signals Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Signal Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(signals).slice(0, 3).map(([name, info]: [string, any]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm">{name}</span>
                  <Badge variant="outline" className="text-xs">
                    {info.type}
                  </Badge>
                </div>
              ))}
              {Object.keys(signals).length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{Object.keys(signals).length - 3} more
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Status Alert */}
      <Alert className={pythonBackendStatus === 'demo' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {pythonBackendStatus === 'demo' ? (
            <div className="space-y-2">
              <div className="font-medium">Demo Mode Active</div>
              <div className="text-sm">
                The system is ready to process your trip data from <code>/home/thh3/data/trips/2025-04-07T10_50_18</code>. 
                Currently running in demo mode with synthetic data for testing.
              </div>
              <div className="text-sm">
                <strong>Ready for:</strong> Vehicle data processing, collision detection, spatial analysis, and real-time visualization.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="font-medium">Python Backend Connected</div>
              <div className="text-sm">
                Full integration active. Ready to process actual trip data with real-time analysis.
              </div>
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Test Trip Data Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Test Trip Data Processing
          </CardTitle>
          <CardDescription>
            Demonstrate the integration with your trip data path
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onTestTripData} className="w-full">
            Test Load: /home/thh3/data/trips/2025-04-07T10_50_18
          </Button>
        </CardContent>
      </Card>

      {/* Integration Details */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Data Processing</div>
              <div className="text-muted-foreground">Python backend with plugin architecture</div>
            </div>
            <div>
              <div className="font-medium">Signal Types</div>
              <div className="text-muted-foreground">Temporal, spatial, collision detection</div>
            </div>
            <div>
              <div className="font-medium">Supported Formats</div>
              <div className="text-muted-foreground">CSV, JSON, Parquet, streaming</div>
            </div>
            <div>
              <div className="font-medium">Real-time Analysis</div>
              <div className="text-muted-foreground">Collision detection, safety margins</div>
            </div>
          </div>
          
          <div className="bg-muted p-3 rounded-lg">
            <div className="font-medium text-sm">Next Steps</div>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>• Place your trip data at the specified path</li>
              <li>• Use the Trip Loader to load and analyze data</li>
              <li>• Create custom plugins for specialized analysis</li>
              <li>• Visualize results in the Debug Player</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
