import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, Database, Cpu, FileText, Play, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import IntegrationStatus from "@/components/integration-status";

export default function IntegrationDemo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [currentTestStep, setCurrentTestStep] = useState(0);

  const integrationTests = [
    {
      name: "Python Backend Connection",
      description: "Test connection to Python backend plugins",
      endpoint: "/api/python/plugins",
      method: "GET"
    },
    {
      name: "Signal Definitions",
      description: "Retrieve available signal definitions",
      endpoint: "/api/python/signals",
      method: "GET"
    },
    {
      name: "Trip Data Path Test",
      description: "Test loading from actual trip data path",
      endpoint: "/api/python/load-data",
      method: "POST",
      body: {
        filePath: "/home/thh3/data/trips/2025-04-07T10_50_18",
        pluginType: "vehicle_data"
      }
    },
    {
      name: "Session Creation",
      description: "Create trip data session in database",
      endpoint: "/api/sessions",
      method: "POST",
      body: {
        name: "Integration Demo Session",
        description: "Testing Python backend integration",
        filePath: "/home/thh3/data/trips/2025-04-07T10_50_18",
        userId: 1
      }
    }
  ];

  const runIntegrationTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    const results = [];
    
    for (let i = 0; i < integrationTests.length; i++) {
      const test = integrationTests[i];
      setCurrentTestStep(i + 1);
      
      try {
        const response = await fetch(test.endpoint, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: test.body ? JSON.stringify(test.body) : undefined
        });
        
        const data = await response.json();
        
        results.push({
          ...test,
          success: response.ok,
          status: response.status,
          result: data,
          timestamp: new Date().toISOString()
        });
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
        
      } catch (error: any) {
        results.push({
          ...test,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    setTestResults(results);
    setIsRunningTests(false);
    setCurrentTestStep(0);
    
    toast({
      title: "Integration Tests Complete",
      description: `${results.filter(r => r.success).length}/${results.length} tests passed`,
    });
  };

  const handleTestTripData = async () => {
    try {
      const response = await fetch('/api/python/load-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: '/home/thh3/data/trips/2025-04-07T10_50_18',
          pluginType: 'vehicle_data'
        })
      });
      
      const result = await response.json();
      
      toast({
        title: "Trip Data Test Result",
        description: result.message || "Test completed successfully",
      });
      
      console.log('Trip data test result:', result);
    } catch (error) {
      toast({
        title: "Trip Data Test Failed",
        description: "Check console for details",
        variant: "destructive"
      });
      console.error('Trip data test failed:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Python Backend Integration Demo</h1>
            <p className="text-muted-foreground">
              Comprehensive demonstration of the trip data processing integration
            </p>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Database className="h-3 w-3" />
          Integration Ready
        </Badge>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Integration Status</TabsTrigger>
          <TabsTrigger value="tests">System Tests</TabsTrigger>
          <TabsTrigger value="demo">Trip Data Demo</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <IntegrationStatus onTestTripData={handleTestTripData} />
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Integration System Tests
              </CardTitle>
              <CardDescription>
                Comprehensive tests of all integration components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={runIntegrationTests}
                  disabled={isRunningTests}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isRunningTests ? 'Running Tests...' : 'Run Integration Tests'}
                </Button>
                {isRunningTests && (
                  <div className="flex items-center gap-2">
                    <Progress value={(currentTestStep / integrationTests.length) * 100} className="w-48" />
                    <span className="text-sm text-muted-foreground">
                      {currentTestStep}/{integrationTests.length}
                    </span>
                  </div>
                )}
              </div>

              {testResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Test Results</h3>
                  {testResults.map((result, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <div className="font-medium">{result.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {result.description}
                            </div>
                          </div>
                        </div>
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                      
                      <div className="mt-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Endpoint:</span>
                          <code className="px-2 py-1 bg-muted rounded text-xs">
                            {result.method} {result.endpoint}
                          </code>
                        </div>
                        
                        {result.result && (
                          <div className="mt-2">
                            <span className="font-medium">Response:</span>
                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.result, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {result.error && (
                          <div className="mt-2 text-red-600">
                            <span className="font-medium">Error:</span> {result.error}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Trip Data Processing Demo
              </CardTitle>
              <CardDescription>
                Demonstration of actual trip data processing capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Ready for Trip Data Processing</div>
                    <div className="text-sm">
                      The system is configured to process trip data from:
                      <code className="ml-2 px-2 py-1 bg-muted rounded text-xs">
                        /home/thh3/data/trips/2025-04-07T10_50_18
                      </code>
                    </div>
                    <div className="text-sm">
                      Currently running in demo mode with synthetic data fallback.
                      When your actual trip data is available, the system will automatically
                      process it with the Python backend.
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Processing Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Vehicle telemetry data
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Collision detection analysis
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Spatial trajectory analysis
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Real-time signal processing
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Supported Data Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        CSV files
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        JSON data
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Parquet files
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Streaming data
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-medium">1.</span>
                      <span>Place your trip data files in the specified directory</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium">2.</span>
                      <span>Use the Trip Loader to process your data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium">3.</span>
                      <span>Visualize results in the Debug Player interface</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium">4.</span>
                      <span>Create custom analysis plugins as needed</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}