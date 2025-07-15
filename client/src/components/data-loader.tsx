import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Database, CheckCircle, AlertCircle, Loader2, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DataLoaderProps {
  onLoadComplete: (sessionData: any) => void;
}

export default function DataLoader({ onLoadComplete }: DataLoaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tripPath, setTripPath] = useState<string>("/home/thh3/data/trips/2025-04-07T10_50_18");
  const [pluginType, setPluginType] = useState<string>("vehicle_data");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [loadingMode, setLoadingMode] = useState<"file" | "path">("path");
  const { toast } = useToast();

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

    setIsLoading(true);
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
      
      // Load from path using integrated Python backend
      const response = await fetch('/api/python/load-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: tripPath,
          pluginType: pluginType
        })
      });

      const result = await response.json();
      
      // Handle both success and demo mode responses
      if (!response.ok && !result.isDemoMode) {
        throw new Error(result.error || `Load failed: ${response.statusText}`);
      }
      
      setUploadProgress(100);
      setLoadingStatus("Creating session...");

      // Create data session in frontend database
      const sessionData = {
        name: loadingMode === "file" ? selectedFile?.name || "Unknown" : `Trip ${tripPath.split('/').pop()}`,
        filename: loadingMode === "file" ? selectedFile?.name || "Unknown" : tripPath,
        fileSize: loadingMode === "file" ? selectedFile?.size || 0 : result.file_size || 0,
        duration: result.duration || 300,
        frequency: result.frequency || 10,
        signalCount: result.signal_count || Object.keys(result.signals || {}).length,
        userId: 1 // Default user for now
      };

      const session = await apiRequest('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData)
      });

      clearInterval(progressInterval);
      setLoadingStatus("Complete!");

      toast({
        title: result.isDemoMode ? "Demo data loaded" : "Data loaded successfully",
        description: result.isDemoMode ? 
          `Demo mode active: ${result.error}` : 
          `${loadingMode === "file" ? selectedFile?.name : tripPath} has been processed and loaded`,
      });

      onLoadComplete({
        session,
        pluginType,
        signals: result.signals || [],
        dataInfo: result
      });

    } catch (error: any) {
      console.error('Load error:', error);
      toast({
        title: "Load failed",
        description: error.message || "An error occurred while loading the data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setLoadingStatus("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setLoadingStatus("Uploading file...");

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('plugin_type', pluginType);

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
      
      // Upload to integrated Python backend
      const response = await fetch('/api/python/upload-data', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setUploadProgress(100);
      setLoadingStatus("Creating session...");

      // Create data session in frontend database
      const sessionData = {
        name: selectedFile.name,
        filename: selectedFile.name,
        fileSize: selectedFile.size,
        duration: result.duration || 0,
        frequency: result.frequency || 10,
        signalCount: result.signal_count || 0,
        userId: 1 // Default user for now
      };

      const session = await apiRequest('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData)
      });

      clearInterval(progressInterval);
      setLoadingStatus("Complete!");

      toast({
        title: "Data uploaded successfully",
        description: `${selectedFile.name} has been processed and loaded`,
      });

      onLoadComplete({
        session,
        pluginType,
        signals: result.signals || [],
        dataInfo: result
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading the file",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setLoadingStatus("");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Load Trip Data
          </CardTitle>
          <CardDescription>
            Upload your actual vehicle trip data files for analysis and visualization. 
            The system will process your real data for collision detection and spatial analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Loading Mode Selection */}
          <div className="space-y-2">
            <Label>Loading Mode</Label>
            <div className="flex space-x-2">
              <Button
                variant={loadingMode === "path" ? "default" : "outline"}
                onClick={() => setLoadingMode("path")}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                From Path
              </Button>
              <Button
                variant={loadingMode === "file" ? "default" : "outline"}
                onClick={() => setLoadingMode("file")}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
            </div>
          </div>

          {/* Trip Path Input */}
          {loadingMode === "path" && (
            <div className="space-y-2">
              <Label htmlFor="trip-path">Trip Data Path</Label>
              <Input
                id="trip-path"
                value={tripPath}
                onChange={(e) => setTripPath(e.target.value)}
                placeholder="/home/thh3/data/trips/2025-07-15T12_06_02"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Enter the full path to your local trip data directory (e.g., /home/thh3/data/trips/2025-07-15T12_06_02)
              </p>
            </div>
          )}

          {/* File Selection */}
          {loadingMode === "file" && (
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select Data File</Label>
              <div className="flex flex-col space-y-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.json,.parquet,.txt"
                  onChange={handleFileSelect}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: CSV, JSON, Parquet, TXT (Max 500MB)
                </p>
              </div>
            </div>
          )}

          {/* Plugin Type Selection */}
          <div className="space-y-2">
            <Label>Plugin Type</Label>
            <Select value={pluginType} onValueChange={setPluginType} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select plugin type" />
              </SelectTrigger>
              <SelectContent>
                {pluginTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Info */}
          {(loadingMode === "file" && selectedFile) || (loadingMode === "path" && tripPath) ? (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-3">
                  {loadingMode === "file" ? (
                    <FileText className="h-8 w-8 text-primary" />
                  ) : (
                    <FolderOpen className="h-8 w-8 text-primary" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">
                      {loadingMode === "file" ? selectedFile?.name : tripPath.split('/').pop()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {loadingMode === "file" ? formatFileSize(selectedFile?.size || 0) : "Trip data directory"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">Ready to load</div>
                    <div className="text-xs text-muted-foreground">
                      Plugin: {pluginTypes.find(p => p.value === pluginType)?.label}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Upload Progress */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">{loadingStatus}</span>
                </div>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Load Button */}
          <Button
            onClick={loadingMode === "path" ? handleLoadFromPath : handleUpload}
            disabled={
              (loadingMode === "file" && !selectedFile) || 
              (loadingMode === "path" && !tripPath.trim()) || 
              isLoading
            }
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingStatus}
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                {loadingMode === "path" ? "Load Trip Data" : "Upload Data"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <div>
              <div className="font-medium">Choose your data file</div>
              <div className="text-sm text-muted-foreground">
                Select a CSV, JSON, or Parquet file containing vehicle data
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <div>
              <div className="font-medium">Select plugin type</div>
              <div className="text-sm text-muted-foreground">
                Choose the appropriate plugin for your data format
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">3</span>
            </div>
            <div>
              <div className="font-medium">Load and analyze</div>
              <div className="text-sm text-muted-foreground">
                Upload your data and start analyzing trip information
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}