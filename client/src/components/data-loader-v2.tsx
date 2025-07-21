/**
 * Enhanced Data Loader using centralized data service
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Database, CheckCircle, AlertCircle, Loader2, FolderOpen, WifiOff, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDataSource, useLoadSession } from "@/hooks/use-data-service";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DataLoaderProps {
  onLoadComplete: (sessionData: any) => void;
}

export default function DataLoaderV2({ onLoadComplete }: DataLoaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tripPath, setTripPath] = useState<string>("data/trips/2025-07-15T12_06_02");
  const [pluginType, setPluginType] = useState<string>("vehicle_data");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [loadingMode, setLoadingMode] = useState<"file" | "path">("path");
  const { toast } = useToast();
  
  // Data service hooks
  const dataSource = useDataSource();
  const loadSession = useLoadSession();

  const pluginTypes = [
    { value: "vehicle_data", label: "Vehicle Data", description: "Standard vehicle telemetry data" },
    { value: "car_pose", label: "Car Pose", description: "Vehicle position and orientation" },
    { value: "path_view", label: "Path View", description: "Path trajectory and collision data" },
    { value: "car_state", label: "Car State", description: "Vehicle state information" },
    { value: "custom", label: "Custom", description: "Custom data format" }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Validate file type
      const allowedTypes = ['.csv', '.json', '.parquet', '.txt'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV, JSON, Parquet, or TXT file",
          variant: "destructive"
        });
        setSelectedFile(null);
        return;
      }

      // Check file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 500MB",
          variant: "destructive"
        });
        setSelectedFile(null);
        return;
      }
    }
  };

  const handleLoadFromPath = async () => {
    if (!tripPath.trim()) {
      toast({
        title: "No path provided",
        description: "Please enter a trip data path",
        variant: "destructive"
      });
      return;
    }

    setUploadProgress(0);
    setLoadingStatus("Loading trip data...");

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      setLoadingStatus("Processing data...");
      
      // Load session using data service
      const result = await loadSession.mutateAsync(tripPath);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setLoadingStatus("Data loaded successfully!");

      // Call the callback with session data
      onLoadComplete({
        sessionId: result.id,
        name: result.name,
        duration: result.duration,
        signalCount: result.signals.length,
        dataPoints: result.dataPoints,
        dataSource: result.source.type,
        path: tripPath
      });

      toast({
        title: "Success",
        description: `Loaded ${result.name} (${result.dataPoints} data points) from ${result.source.type === 'real' ? 'Python backend' : result.source.type === 'file' ? 'CSV files' : 'demo data'}`,
      });

      // Reset form
      setUploadProgress(0);
      setLoadingStatus("");
    } catch (error: any) {
      clearInterval(progressInterval as any);
      console.error('Error loading data:', error);
      
      toast({
        title: "Error loading data",
        description: error.message || "Failed to load trip data. Please check the path and try again.",
        variant: "destructive"
      });
      
      setUploadProgress(0);
      setLoadingStatus("");
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setUploadProgress(0);
    setLoadingStatus("Uploading file...");

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('plugin_type', pluginType);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      const response = await fetch('/api/upload-data', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setLoadingStatus("File uploaded successfully!");

      onLoadComplete({
        sessionId: `uploaded-${Date.now()}`,
        name: selectedFile.name,
        duration: data.time_range?.[1] - data.time_range?.[0] || 0,
        signalCount: Object.keys(data.signals || {}).length,
        dataPoints: data.data_points || 0,
        dataSource: 'file',
        fileName: selectedFile.name
      });

      toast({
        title: "Success",
        description: `Uploaded ${selectedFile.name} successfully`,
      });

      // Reset form
      setSelectedFile(null);
      setUploadProgress(0);
      setLoadingStatus("");
    } catch (error: any) {
      console.error('Error uploading file:', error);
      
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive"
      });
      
      setUploadProgress(0);
      setLoadingStatus("");
    }
  };

  // Connection status badge
  const ConnectionStatus = () => {
    if (!dataSource.data) return null;
    
    const { type, connectionStatus, lastError } = dataSource.data;
    
    return (
      <div className="flex items-center gap-2">
        {connectionStatus === 'connected' ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <Badge variant="outline" className="text-green-600">
              {type === 'real' ? 'Python Backend' : type === 'file' ? 'File System' : 'Demo Mode'}
            </Badge>
          </>
        ) : connectionStatus === 'connecting' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <Badge variant="outline">Connecting...</Badge>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <Badge variant="outline" className="text-red-600">
              {type === 'demo' ? 'Demo Mode' : 'Disconnected'}
            </Badge>
          </>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Data Loader</CardTitle>
            <CardDescription>
              Load vehicle data from files or trip directories
            </CardDescription>
          </div>
          <ConnectionStatus />
        </div>
      </CardHeader>
      <CardContent>
        {dataSource.data?.connectionStatus === 'error' && dataSource.data.lastError && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Python backend unavailable: {dataSource.data.lastError}. Using fallback mode.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-6">
          {/* Loading Mode Selection */}
          <div className="flex gap-4">
            <Button
              variant={loadingMode === "path" ? "default" : "outline"}
              onClick={() => setLoadingMode("path")}
              className="flex-1"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Load from Directory
            </Button>
            <Button
              variant={loadingMode === "file" ? "default" : "outline"}
              onClick={() => setLoadingMode("file")}
              className="flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </div>

          {loadingMode === "path" ? (
            // Directory Path Mode
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trip-path">Trip Data Path</Label>
                <Input
                  id="trip-path"
                  type="text"
                  placeholder="data/trips/2025-07-15T12_06_02"
                  value={tripPath}
                  onChange={(e) => setTripPath(e.target.value)}
                  disabled={loadSession.isPending}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the path to your trip data directory containing CSV files
                </p>
              </div>

              <Button 
                onClick={handleLoadFromPath} 
                disabled={loadSession.isPending || !tripPath.trim()}
                className="w-full"
              >
                {loadSession.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Load Trip Data
                  </>
                )}
              </Button>
            </div>
          ) : (
            // File Upload Mode
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plugin-type">Plugin Type</Label>
                <Select value={pluginType} onValueChange={setPluginType}>
                  <SelectTrigger id="plugin-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pluginTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span>{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">Select Data File</Label>
                <div className="flex gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.json,.parquet,.txt"
                    onChange={handleFileSelect}
                    disabled={loadSession.isPending}
                    className="flex-1"
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <Button 
                onClick={handleUploadFile} 
                disabled={loadSession.isPending || !selectedFile}
                className="w-full"
              >
                {loadSession.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Progress Bar */}
          {(loadSession.isPending || uploadProgress > 0) && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {loadingStatus || "Processing..."}
              </p>
            </div>
          )}

          {/* Success Message */}
          {uploadProgress === 100 && !loadSession.isPending && (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Data loaded successfully!</span>
            </div>
          )}

          {/* Example Paths */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Example paths:</p>
            <div className="space-y-1">
              <code className="text-xs bg-muted px-2 py-1 rounded block">
                data/trips/2025-07-15T12_06_02 (Real Kia Niro EV data)
              </code>
              <code className="text-xs bg-muted px-2 py-1 rounded block">
                /home/user/my-trips/trip-001
              </code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}