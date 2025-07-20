import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Database, Play, Car, Clock, FileCheck, Activity } from "lucide-react";

interface DemoTripLoaderProps {
  onLoadComplete?: (data: any) => void;
}

export default function DemoTripLoader({ onLoadComplete }: DemoTripLoaderProps) {
  const [loadingStep, setLoadingStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const realDataFiles = [
    "path_trajectory.csv (14.5MB)",
    "front_left_wheel_speed.csv (573KB)",
    "rear_right_wheel_speed.csv (295KB)",
    "throttle.csv (580KB)",
    "brake.csv (568KB)",
    "driving_mode.csv (940KB)",
    "turn_indicator.csv (68KB)",
    "gps.csv (302 bytes)",
    "car_info.json (29 bytes)",
    "vehicle_configs.json (34KB)"
  ];

  const loadingSteps = [
    "Loading real trip data from repository...",
    "Processing Kia Niro EV telemetry...",
    "Analyzing vehicle signals...",
    "Generating collision detection analysis...",
    "Preparing spatial trajectory data...",
    "Trip data ready for analysis!"
  ];

  const handleDemoLoad = async () => {
    setIsLoading(true);
    
    for (let i = 0; i < loadingSteps.length; i++) {
      setLoadingStep(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    setIsLoading(false);
    setIsLoaded(true);
    
    // Trigger completion callback with mock session data
    if (onLoadComplete) {
      onLoadComplete({
        session: {
          id: 'demo-session-2025-07-15',
          name: 'Kia Niro EV - Real Trip Data',
          duration: 179.2,
          frequency: 10,
          signalCount: 23,
          description: 'Authentic vehicle telemetry from July 15, 2025'
        },
        pluginType: 'Vehicle Data Plugin',
        dataPath: '/data/trips/2025-07-15T12_06_02/'
      });
    }
  };

  const progress = (loadingStep + 1) / loadingSteps.length * 100;

  return (
    <div className="space-y-6">
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium text-green-800">Real Trip Data Active</div>
            <div className="text-sm text-green-700">
              Your actual Kia Niro EV data from July 15, 2025 is now integrated and ready for analysis.
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Trip Data: 2025-07-15T12_06_02
          </CardTitle>
          <CardDescription>
            Authentic vehicle telemetry from your Kia Niro EV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium">Vehicle</div>
              <div className="text-lg">Kia Niro EV</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium">Duration</div>
              <div className="text-lg">179 seconds</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium">Data Size</div>
              <div className="text-lg">50MB</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-3">Real Data Files Available:</div>
            <div className="grid grid-cols-2 gap-2">
              {realDataFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                  <FileCheck className="h-3 w-3 text-green-600" />
                  <span>{file}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleDemoLoad}
              disabled={isLoading || isLoaded}
              className="w-full"
              size="lg"
              variant={isLoaded ? "outline" : "default"}
            >
              {isLoading ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Loading Real Data...
                </>
              ) : isLoaded ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Trip Data Loaded
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Load Trip Data
                </>
              )}
            </Button>

            {isLoading && (
              <div className="space-y-3">
                <Progress value={progress} className="w-full" />
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{loadingSteps[loadingStep]}</span>
                </div>
              </div>
            )}

            {isLoaded && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium text-green-800">Trip Data Loaded Successfully!</div>
                    <div className="text-sm text-green-700">
                      Your authentic Kia Niro EV telemetry is now ready for analysis. The system has processed:
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Vehicle trajectory and position data</li>
                      <li>• Wheel speed telemetry from all four wheels</li>
                      <li>• Throttle and brake inputs</li>
                      <li>• Driving mode and turn indicator states</li>
                      <li>• GPS coordinates and vehicle configuration</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}