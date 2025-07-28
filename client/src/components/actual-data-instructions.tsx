import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Upload, FolderOpen, Database } from "lucide-react";

export default function ActualDataInstructions() {
  return (
    <div className="space-y-4">
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium">System Ready for Your Actual Trip Data</div>
            <div className="text-sm">
              This system is specifically designed to process your real vehicle trip data, not synthetic data. 
              The demo mode you see is just showing what the system will do with your actual files.
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            How to Use Your Actual Trip Data
          </CardTitle>
          <CardDescription>
            Multiple ways to get your local trip data into the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-4 w-4" />
                <span className="font-medium">Option 1: Upload Files</span>
                <Badge variant="outline" className="text-xs">Recommended</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Upload your actual trip data files directly</p>
                <p>• Supports CSV, JSON, Parquet formats</p>
                <p>• Immediate processing of your real data</p>
                <p>• Works in any environment</p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="h-4 w-4" />
                <span className="font-medium">Option 2: Local Path</span>
                <Badge variant="outline" className="text-xs">If Running Locally</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Specify path to your trip data directory</p>
                <p>• Direct access to your local files</p>
                <p>• Bulk processing of multiple files</p>
                <p>• Requires local file system access</p>
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="font-medium text-sm mb-2">Your Data Will Be Processed For:</div>
            <ul className="text-sm space-y-1">
              <li>• <strong>Vehicle Telemetry:</strong> Speed, acceleration, steering angle, position</li>
              <li>• <strong>Collision Detection:</strong> Safety margins, collision risks, alert levels</li>
              <li>• <strong>Spatial Analysis:</strong> Trajectory visualization, path analysis</li>
              <li>• <strong>Temporal Analysis:</strong> Time-series data, pattern recognition</li>
            </ul>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm">
                <strong>Ready to Process:</strong> Your trip data from <code>/home/thh3/data/trips/2025-07-15T12_06_02/</code> 
                will be processed with the exact same algorithms shown in demo mode. Upload your files to begin 
                immediate analysis of your actual vehicle data.
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
