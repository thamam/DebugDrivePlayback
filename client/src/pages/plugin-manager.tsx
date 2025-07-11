import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Trash2, Play, Pause } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPluginSchema, type Plugin } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PluginManager() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plugins, isLoading } = useQuery({
    queryKey: ["/api/plugins"],
  });

  const createPluginMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/plugins", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plugins"] });
      setIsWizardOpen(false);
      toast({
        title: "Plugin created successfully",
        description: "Your plugin has been added to the system",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating plugin",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePluginMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/plugins/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plugins"] });
      toast({
        title: "Plugin updated successfully",
      });
    },
  });

  const deletePluginMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/plugins/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plugins"] });
      toast({
        title: "Plugin deleted successfully",
      });
    },
  });

  const togglePluginActive = (plugin: Plugin) => {
    updatePluginMutation.mutate({
      id: plugin.id,
      data: { isActive: !plugin.isActive },
    });
  };

  const deletePlugin = (id: number) => {
    if (confirm("Are you sure you want to delete this plugin?")) {
      deletePluginMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading plugins...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Plugin Manager</h1>
          <p className="text-muted-foreground mt-2">
            Manage data processing plugins for the Debug Player Framework
          </p>
        </div>
        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Plugin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Plugin Creation Wizard</DialogTitle>
            </DialogHeader>
            <PluginWizard
              onSubmit={(data) => createPluginMutation.mutate(data)}
              isLoading={createPluginMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plugins?.map((plugin: Plugin) => (
          <Card key={plugin.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{plugin.name}</CardTitle>
                  <Badge variant={plugin.isActive ? "default" : "secondary"}>
                    {plugin.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePluginActive(plugin)}
                    className="h-8 w-8 p-0"
                  >
                    {plugin.isActive ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePlugin(plugin.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {plugin.description || "No description available"}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Version: {plugin.version}</span>
                  <span>ID: {plugin.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plugins?.length === 0 && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No plugins configured</h3>
              <p className="text-muted-foreground">
                Add your first plugin to start processing vehicle data
              </p>
            </div>
            <Button onClick={() => setIsWizardOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Plugin
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function PluginWizard({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [step, setStep] = useState(1);
  const [pluginType, setPluginType] = useState<string>("");

  const form = useForm({
    resolver: zodResolver(insertPluginSchema),
    defaultValues: {
      name: "",
      description: "",
      version: "1.0.0",
    },
  });

  const pluginTypes = [
    {
      id: "car_pose",
      name: "Car Pose Plugin",
      description: "Provides vehicle position and orientation data",
      dataColumns: ["timestamp", "cp_x", "cp_y", "cp_yaw_deg"],
      signals: ["car_pose(t)", "route", "timestamps", "car_poses"],
    },
    {
      id: "path_view",
      name: "Path View Plugin",
      description: "Provides path trajectory data and collision margin detection",
      dataColumns: ["timestamp", "path_x", "path_y", "path_heading", "vehicle_x", "vehicle_y", "vehicle_heading"],
      signals: ["path_in_world_coordinates(t)", "car_pose_at_path_timestamp(t)", "collision_margin_distance(t)"],
    },
    {
      id: "car_state",
      name: "Car State Plugin",
      description: "Provides vehicle state information (speed, steering, driving mode)",
      dataColumns: ["timestamp", "target_speed", "steer_command", "data_value"],
      signals: ["current_steering", "current_speed", "driving_mode", "target_speed"],
    },
    {
      id: "csv_watchdog",
      name: "CSV Watchdog Plugin",
      description: "Provides real-time CSV file monitoring and streaming data",
      dataColumns: ["timestamp", "data_value"],
      signals: ["file_update", "streaming_data"],
    },
    {
      id: "custom",
      name: "Custom Plugin",
      description: "Create a custom plugin with your own specifications",
      dataColumns: [],
      signals: [],
    },
  ];

  const selectedPluginType = pluginTypes.find(p => p.id === pluginType);

  const handleSubmit = (data: any) => {
    const pluginData = {
      ...data,
      pluginType,
      configuration: selectedPluginType ? {
        dataColumns: selectedPluginType.dataColumns,
        signals: selectedPluginType.signals,
      } : {},
    };
    onSubmit(pluginData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Choose Plugin Type</h3>
            <div className="grid gap-3">
              {pluginTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-colors ${
                    pluginType === type.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setPluginType(type.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <input
                          type="radio"
                          checked={pluginType === type.id}
                          onChange={() => setPluginType(type.id)}
                          className="text-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{type.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {type.description}
                        </p>
                        {type.dataColumns.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium">Data Columns:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {type.dataColumns.map((col) => (
                                <Badge key={col} variant="outline" className="text-xs">
                                  {col}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!pluginType}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Plugin Configuration</h3>
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plugin Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter plugin name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter plugin description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1.0.0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedPluginType && (
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Plugin Type: {selectedPluginType.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedPluginType.description}
                  </p>
                  {selectedPluginType.signals.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2">Available Signals:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedPluginType.signals.map((signal) => (
                          <Badge key={signal} variant="secondary" className="text-xs">
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Plugin"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}