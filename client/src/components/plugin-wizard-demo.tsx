import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, MapPin, Clock, Wrench, CheckCircle, Info } from "lucide-react";
import PluginWizard from "./plugin-wizard";

interface PluginWizardDemoProps {
  onCreatePlugin: (data: any) => void;
  isLoading: boolean;
}

export default function PluginWizardDemo({ onCreatePlugin, isLoading }: PluginWizardDemoProps) {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [completedPlugins, setCompletedPlugins] = useState<string[]>([]);

  const handlePluginCreated = (pluginData: any) => {
    onCreatePlugin(pluginData);
    setCompletedPlugins(prev => [...prev, activeDemo || ""]);
    setActiveDemo(null);
  };

  const demoScenarios = [
    {
      id: "spatial",
      title: "Spatial Signals Demo",
      description: "Car pose and path trajectory visualization",
      icon: MapPin,
      details: "Demonstrates spatial signal processing for vehicle position, orientation, and trajectory data",
      useCases: [
        "Vehicle position tracking (X, Y coordinates)",
        "Orientation and heading visualization",
        "Path trajectory plotting",
        "Collision margin spatial analysis"
      ],
      expectedPluginType: "car_pose",
      color: "bg-blue-500"
    },
    {
      id: "temporal",
      title: "Temporal Signals Demo",
      description: "Steering and speed information over time",
      icon: Clock,
      details: "Shows temporal signal processing for time-series vehicle data",
      useCases: [
        "Steering angle over time",
        "Speed profile analysis",
        "Acceleration patterns",
        "Temporal correlation analysis"
      ],
      expectedPluginType: "car_state",
      color: "bg-green-500"
    },
    {
      id: "custom",
      title: "Custom Plugin Demo",
      description: "Custom data processing configuration",
      icon: Wrench,
      details: "Demonstrates creating custom plugins with specific requirements",
      useCases: [
        "Custom data column definitions",
        "Specialized signal processing",
        "Custom visualization layouts",
        "Advanced processing pipelines"
      ],
      expectedPluginType: "custom",
      color: "bg-purple-500"
    }
  ];

  if (activeDemo) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {demoScenarios.find(s => s.id === activeDemo)?.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              Creating plugin for {demoScenarios.find(s => s.id === activeDemo)?.description}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setActiveDemo(null)}
          >
            Cancel Demo
          </Button>
        </div>
        
        <PluginWizard
          onSubmit={handlePluginCreated}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Plugin Creation Wizard Demo</h2>
        <p className="text-muted-foreground">
          Explore three different plugin creation scenarios: spatial signals, temporal signals, and custom plugins
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="spatial">Spatial</TabsTrigger>
          <TabsTrigger value="temporal">Temporal</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoScenarios.map((scenario) => {
              const Icon = scenario.icon;
              const isCompleted = completedPlugins.includes(scenario.id);
              
              return (
                <Card key={scenario.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${scenario.color} bg-opacity-10`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{scenario.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {scenario.description}
                          </CardDescription>
                        </div>
                      </div>
                      {isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {scenario.details}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium">Use Cases:</div>
                      <ul className="text-xs space-y-1">
                        {scenario.useCases.map((useCase, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-1 h-1 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{useCase}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Badge variant="outline" className="text-xs">
                        {scenario.expectedPluginType}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => setActiveDemo(scenario.id)}
                        disabled={isLoading}
                        variant={isCompleted ? "secondary" : "default"}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        {isCompleted ? "Try Again" : "Start Demo"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="spatial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Spatial Signals: Car Pose & Path Trajectory
              </CardTitle>
              <CardDescription>
                This demo shows how to create plugins for spatial vehicle data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Expected Data Structure</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Car Pose Plugin:</div>
                    <ul className="text-muted-foreground mt-1 space-y-1">
                      <li>• timestamp (float)</li>
                      <li>• cp_x (float) - X position</li>
                      <li>• cp_y (float) - Y position</li>
                      <li>• cp_yaw_deg (float) - Heading</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium">Path View Plugin:</div>
                    <ul className="text-muted-foreground mt-1 space-y-1">
                      <li>• timestamp (float)</li>
                      <li>• path_x, path_y (float)</li>
                      <li>• vehicle_x, vehicle_y (float)</li>
                      <li>• collision_margin (float)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-700 dark:text-blue-300">Spatial Processing Features</div>
                    <p className="text-blue-600 dark:text-blue-400 mt-1">
                      Includes 2D/3D visualization, trajectory analysis, collision detection, and coordinate transformations
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={() => setActiveDemo("spatial")} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Spatial Plugin Demo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temporal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Temporal Signals: Steering & Speed Analysis
              </CardTitle>
              <CardDescription>
                This demo shows how to create plugins for time-series vehicle data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Expected Data Structure</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Car State Plugin:</div>
                    <ul className="text-muted-foreground mt-1 space-y-1">
                      <li>• timestamp (float)</li>
                      <li>• target_speed (float)</li>
                      <li>• steer_command (float)</li>
                      <li>• data_value (float)</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium">Signals Available:</div>
                    <ul className="text-muted-foreground mt-1 space-y-1">
                      <li>• current_steering</li>
                      <li>• current_speed</li>
                      <li>• driving_mode</li>
                      <li>• target_speed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-green-700 dark:text-green-300">Temporal Processing Features</div>
                    <p className="text-green-600 dark:text-green-400 mt-1">
                      Includes time-series analysis, trend detection, pattern recognition, and real-time monitoring
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={() => setActiveDemo("temporal")} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Temporal Plugin Demo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Custom Plugin: Advanced Configuration
              </CardTitle>
              <CardDescription>
                This demo shows how to create completely custom plugins with specific requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Custom Plugin Features</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Configuration Options:</div>
                    <ul className="text-muted-foreground mt-1 space-y-1">
                      <li>• Custom data columns</li>
                      <li>• Specialized processing</li>
                      <li>• Custom visualization</li>
                      <li>• Advanced pipelines</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium">Interface Types:</div>
                    <ul className="text-muted-foreground mt-1 space-y-1">
                      <li>• IDataLoader</li>
                      <li>• IDataProcessor</li>
                      <li>• IVisualizationComponent</li>
                      <li>• IDisplayComponent</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-purple-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-purple-700 dark:text-purple-300">Custom Plugin Benefits</div>
                    <p className="text-purple-600 dark:text-purple-400 mt-1">
                      Complete flexibility to define your own data formats, processing logic, and visualization requirements
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={() => setActiveDemo("custom")} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Custom Plugin Demo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {completedPlugins.length > 0 && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Demo Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {completedPlugins.map((pluginId, index) => (
                <Badge key={index} variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  {demoScenarios.find(s => s.id === pluginId)?.title} ✓
                </Badge>
              ))}
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              {completedPlugins.length} of {demoScenarios.length} plugin demos completed
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
