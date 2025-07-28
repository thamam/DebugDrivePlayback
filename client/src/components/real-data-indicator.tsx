import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Database, Calendar, Car } from "lucide-react";

interface RealDataIndicatorProps {
  isUsingRealData: boolean;
  dataPath: string;
  dataInfo?: any;
}

export default function RealDataIndicator({ isUsingRealData, dataPath, dataInfo }: RealDataIndicatorProps) {
  if (!isUsingRealData) return null;

  return (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800">Real Trip Data Active</span>
            <Badge variant="outline" className="text-green-700 border-green-300">
              Kia Niro EV
            </Badge>
          </div>
          
          <div className="text-sm text-green-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>July 15, 2025</span>
              </div>
              <div className="flex items-center gap-1">
                <Car className="h-3 w-3" />
                <span>3 min drive</span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-green-600">
            Processing real vehicle telemetry from <code className="px-1 bg-green-100 rounded">{dataPath}</code>
          </div>
          
          {dataInfo && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-green-100 p-2 rounded">
                <div className="font-medium">Data Points</div>
                <div>{dataInfo.data_points?.toLocaleString()}</div>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <div className="font-medium">Signals</div>
                <div>{dataInfo.signals ? Object.keys(dataInfo.signals).length : 0}</div>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <div className="font-medium">Duration</div>
                <div>{dataInfo.time_range ? `${Math.round(dataInfo.time_range[1] - dataInfo.time_range[0])}s` : 'N/A'}</div>
              </div>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
