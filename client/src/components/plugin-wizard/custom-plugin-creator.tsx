import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Code2, Settings, FileText, Zap, Database, BarChart3, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const customPluginSchema = z.object({
  name: z.string().min(1, "Plugin name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  pluginType: z.enum(["data_source", "visualization", "analysis", "streaming", "hybrid"]),
  version: z.string().default("1.0.0"),
  dataColumns: z.array(z.string()).min(1, "At least one data column is required"),
  visualizationType: z.enum(["line_chart", "scatter_plot", "spatial_2d", "spatial_3d", "gauge", "table"]).optional(),
  processingMode: z.enum(["real_time", "batch", "streaming"]),
  configuration: z.record(z.any()).optional(),
});

type CustomPluginFormData = z.infer<typeof customPluginSchema>;

const pluginTemplates = [
  {
    id: "car_pose",
    name: "Car Pose Analyzer",
    description: "Real-time vehicle position and orientation analysis",
    icon: Car,
    type: "analysis" as const,
    defaultColumns: ["position_x", "position_y", "heading_angle", "velocity"],
    visualization: "spatial_2d" as const,
  },
  {
    id: "signal_monitor",
    name: "Signal Monitor",
    description: "Multi-signal temporal analysis and monitoring",
    icon: BarChart3,
    type: "visualization" as const,
    defaultColumns: ["vehicle_speed", "acceleration", "steering_angle"],
    visualization: "line_chart" as const,
  },
  {
    id: "collision_detector",
    name: "Collision Detector",
    description: "Advanced collision detection and safety analysis",
    icon: Zap,
    type: "analysis" as const,
    defaultColumns: ["collision_margin", "distance_to_obstacle", "relative_velocity"],
    visualization: "gauge" as const,
  },
  {
    id: "data_exporter",
    name: "Data Exporter",
    description: "Export processed data in various formats",
    icon: Database,
    type: "data_source" as const,
    defaultColumns: ["timestamp", "all_signals"],
    visualization: "table" as const,
  },
];

interface CustomPluginCreatorProps {
  onPluginCreate?: (pluginData: CustomPluginFormData) => void;
}

export default function CustomPluginCreator({ onPluginCreate }: CustomPluginCreatorProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { toast } = useToast();
  
  const form = useForm<CustomPluginFormData>({
    resolver: zodResolver(customPluginSchema),
    defaultValues: {
      name: "",
      description: "",
      pluginType: "visualization",
      version: "1.0.0",
      dataColumns: [],
      processingMode: "real_time",
      configuration: {},
    },
  });

  const handleTemplateSelect = (template: typeof pluginTemplates[0]) => {
    setSelectedTemplate(template.id);
    form.setValue("name", template.name);
    form.setValue("description", template.description);
    form.setValue("pluginType", template.type);
    form.setValue("dataColumns", template.defaultColumns);
    form.setValue("visualizationType", template.visualization);
  };

  const handleSubmit = (data: CustomPluginFormData) => {
    // Here you would typically send this to your backend
    console.log("Creating custom plugin:", data);
    
    onPluginCreate?.(data);
    
    toast({
      title: "Custom Plugin Created",
      description: `Plugin "${data.name}" has been created successfully`,
    });
    
    form.reset();
    setSelectedTemplate(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Custom Plugin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Custom Plugin Creator
          </DialogTitle>
          <DialogDescription>
            Create a custom plugin for your specific data analysis needs. Start with a template or build from scratch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Choose a Template</h3>
            <div className="grid grid-cols-2 gap-4">
              {pluginTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Icon className="h-6 w-6 text-primary mt-1" />
                        <div className="flex-1">
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {template.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.visualization}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Custom Plugin Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plugin Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Custom Plugin" {...field} />
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
                        <Input placeholder="1.0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what your plugin does and how it processes vehicle data..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pluginType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plugin Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select plugin type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="data_source">Data Source</SelectItem>
                          <SelectItem value="visualization">Visualization</SelectItem>
                          <SelectItem value="analysis">Analysis</SelectItem>
                          <SelectItem value="streaming">Streaming</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="processingMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Processing Mode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select processing mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="real_time">Real Time</SelectItem>
                          <SelectItem value="batch">Batch Processing</SelectItem>
                          <SelectItem value="streaming">Streaming</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="visualizationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visualization Type (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visualization type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="line_chart">Line Chart</SelectItem>
                        <SelectItem value="scatter_plot">Scatter Plot</SelectItem>
                        <SelectItem value="spatial_2d">Spatial 2D</SelectItem>
                        <SelectItem value="spatial_3d">Spatial 3D</SelectItem>
                        <SelectItem value="gauge">Gauge</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setSelectedTemplate(null);
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plugin
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}