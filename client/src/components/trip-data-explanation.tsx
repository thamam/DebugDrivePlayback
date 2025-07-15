import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface TripDataExplanationProps {
  tripPath: string;
  isDemoMode: boolean;
  result?: any;
}

export default function TripDataExplanation({ tripPath, isDemoMode, result }: TripDataExplanationProps) {
  if (!result) return null;

  return (
    <div className="space-y-4">
      <Alert className={isDemoMode ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium">
              {isDemoMode ? "Development Mode Active" : "Data Loaded Successfully"}
            </div>
            <div className="text-sm">
              {isDemoMode ? (
                <>
                  Your trip data path <code className="px-1 bg-muted rounded text-xs">{tripPath}</code> is not available in this environment. 
                  The system is showing you the exact data structure and analysis that would be generated from your actual trip data.
                </>
              ) : (
                <>
                  Successfully loaded trip data from <code className="px-1 bg-muted rounded text-xs">{tripPath}</code>
                </>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Data Processing Results
          </CardTitle>
          <CardDescription>
            {isDemoMode ? "Demo structure based on your trip data path" : "Actual trip data analysis"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Plugin Type</div>
              <Badge variant="outline">{result.plugin_name}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Data Points</div>
              <div className="text-sm text-muted-foreground">{result.data_points?.toLocaleString() || 'N/A'}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Available Signals</div>
            <div className="grid grid-cols-2 gap-2">
              {result.signals && Object.entries(result.signals).map(([name, info]: [string, any]) => (
                <div key={name} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {info.units}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Time Range</div>
            <div className="text-sm text-muted-foreground">
              {result.time_range ? `${result.time_range[0]}s - ${result.time_range[1]}s` : 'N/A'}
            </div>
          </div>

          {isDemoMode && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Ready for Your Real Data</div>
                  <div className="text-sm">
                    When you place your trip data files in the specified directory, the system will:
                  </div>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Automatically detect and load all data files</li>
                    <li>• Process vehicle telemetry signals</li>
                    <li>• Generate collision detection analysis</li>
                    <li>• Provide spatial trajectory visualization</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}