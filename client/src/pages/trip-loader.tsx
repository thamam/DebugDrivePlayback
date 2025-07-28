import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, Play, Settings, CheckCircle, Navigation } from "lucide-react";
import DataLoader from "@/components/data-loader";
import DemoTripLoader from "@/components/demo-trip-loader";
import TrajectoryVisualizer from "@/components/trajectory-visualizer";
import { useToast } from "@/hooks/use-toast";

export default function TripLoaderPage() {
  const [, setLocation] = useLocation();
  const [loadedSession, setLoadedSession] = useState<any>(null);
  const { toast } = useToast();

  const handleLoadComplete = (data: any) => {
    setLoadedSession(data);
    toast({
      title: "Trip data loaded successfully",
      description: `Session "${data.session.name}" is ready for analysis`,
    });
  };

  const handleStartAnalysis = () => {
    if (loadedSession) {
      console.log('Starting analysis with session:', loadedSession.session);
      // Navigate to debug player with session data
      setLocation(`/?session=${loadedSession.session.id}`);
    } else {
      console.error('No loaded session available for analysis');
      toast({
        title: "No session available",
        description: "Please load trip data first",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
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
            <h1 className="text-2xl font-bold">Trip Data Loader</h1>
            <p className="text-muted-foreground">
              Load and analyze your actual vehicle trip data - now with authentic Kia Niro EV telemetry
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setLocation("/plugins")}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Manage Plugins
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Loader */}
        <div className="lg:col-span-2 space-y-6">
          <DemoTripLoader onLoadComplete={handleLoadComplete} />
          <DataLoader onLoadComplete={handleLoadComplete} />
        </div>

        {/* Session Status */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Session Status</CardTitle>
              <CardDescription>
                Current trip data session information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadedSession ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant="default" className="bg-green-600">
                      Ready
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Name:</span> {loadedSession.session.name}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Duration:</span> {loadedSession.session.duration.toFixed(1)}s
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Frequency:</span> {loadedSession.session.frequency}Hz
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Signals:</span> {loadedSession.session.signalCount}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Plugin:</span> {loadedSession.pluginType}
                    </div>
                  </div>

                  <Button
                    onClick={handleStartAnalysis}
                    className="w-full"
                    size="lg"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Analysis
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trip data loaded yet</p>
                  <p className="text-sm">Load data to see session details</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Plugins */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Plugins</CardTitle>
              <CardDescription>
                Supported data processing plugins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Vehicle Data</span>
                  <Badge variant="secondary">Standard</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Car Pose</span>
                  <Badge variant="secondary">Spatial</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Path View</span>
                  <Badge variant="secondary">Trajectory</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Car State</span>
                  <Badge variant="secondary">Temporal</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trajectory Visualization */}
      {loadedSession && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Real Trajectory Visualization
          </h2>
          <TrajectoryVisualizer 
            tripData={loadedSession.dataInfo} 
            isRealData={!loadedSession.dataInfo?.isDemoMode}
          />
        </div>
      )}
    </div>
  );
}
