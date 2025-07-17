import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Database, BarChart3, Eye, Play, Code, ArrowRight, ArrowLeft } from "lucide-react";
import { getPluginTemplate, pluginTemplates } from "@/lib/plugin-templates";
import type { PluginConfiguration } from "@/types/plugin-interfaces";

interface PluginWizardProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export default function PluginWizard({ onSubmit, isLoading }: PluginWizardProps) {
  const [currentStep, setCurrentStep] = useState<"type" | "config" | "visualization" | "review">("type");
  const [selectedPluginType, setSelectedPluginType] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    version: "1.0.0",
    pluginType: "",
    configuration: ""
  });
  const [pluginConfig, setPluginConfig] = useState<PluginConfiguration | null>(null);

  const handlePluginTypeChange = (type: string) => {
    setSelectedPluginType(type);
    const template = getPluginTemplate(type);
    if (template) {
      setFormData(prev => ({
        ...prev,
        pluginType: type,
        name: template.name,
        description: template.description,
        configuration: JSON.stringify(template.template, null, 2)
      }));
      setPluginConfig(template.template as PluginConfiguration);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.pluginType) {
      return;
    }

    onSubmit({
      name: formData.name,
      description: formData.description,
      version: formData.version,
      pluginType: formData.pluginType,
      configuration: formData.configuration || null,
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'data_source': return <Database className="h-4 w-4 text-primary" />;
      case 'visualization': return <BarChart3 className="h-4 w-4 text-primary" />;
      case 'analysis': return <Eye className="h-4 w-4 text-primary" />;
      case 'streaming': return <Play className="h-4 w-4 text-primary" />;
      case 'hybrid': return <Code className="h-4 w-4 text-primary" />;
      default: return <Database className="h-4 w-4 text-primary" />;
    }
  };

  const renderPluginTypeStep = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Plugin Type</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select the type of plugin that matches your data processing needs
        </p>
      </div>
      
      <div className="grid gap-3">
        {Object.entries(pluginTemplates).map(([key, template]) => (
          <Card 
            key={key} 
            className={`cursor-pointer transition-all ${
              selectedPluginType === key ? 'ring-2 ring-primary' : 'hover:shadow-md'
            }`}
            onClick={() => handlePluginTypeChange(key)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    {getCategoryIcon(template.category)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {template.category}
                    </Badge>
                  </div>
                </div>
                {selectedPluginType === key && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </div>
              <CardDescription className="text-sm">{template.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end pt-4">
        <Button 
          onClick={() => setCurrentStep("config")} 
          disabled={!selectedPluginType}
          className="flex items-center gap-2"
        >
          Next: Configure Plugin
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderConfigStep = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Plugin Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure the basic plugin settings and data processing parameters
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Plugin Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter plugin name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
            placeholder="1.0.0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what this plugin does"
          rows={3}
        />
      </div>

      {pluginConfig && (
        <div className="space-y-4">
          <h4 className="text-base font-semibold">Interface Configuration</h4>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="data-columns">
              <AccordionTrigger>
                Data Columns ({pluginConfig.dataColumns?.length || 0})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {pluginConfig.dataColumns?.map((column, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                      <Badge variant="outline">{column.dataType}</Badge>
                      <span className="font-medium">{column.name}</span>
                      <span className="text-sm text-muted-foreground flex-1">{column.description}</span>
                      {column.units && <Badge variant="secondary">{column.units}</Badge>}
                      {column.required && <Badge variant="destructive">Required</Badge>}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="signals">
              <AccordionTrigger>
                Signals ({pluginConfig.signals?.length || 0})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {pluginConfig.signals?.map((signal, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">{signal.type}</Badge>
                        <Badge variant="secondary">{signal.mode}</Badge>
                        <span className="font-medium">{signal.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{signal.description}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        Handler: {signal.handlerFunction}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="data-source">
              <AccordionTrigger>Data Source Configuration</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge>{pluginConfig.dataSource?.type}</Badge>
                    <span className="text-sm font-medium">{pluginConfig.dataSource?.filePattern}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Required columns:</strong> {pluginConfig.dataSource?.validation.requiredColumns.join(", ")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Format:</strong> {pluginConfig.dataSource?.format.delimiter}, 
                    Headers: {pluginConfig.dataSource?.format.headers ? "Yes" : "No"}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="processing">
              <AccordionTrigger>Processing Configuration</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant={pluginConfig.processing?.enabled ? "default" : "secondary"}>
                      {pluginConfig.processing?.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <span className="text-sm">
                      {pluginConfig.processing?.pipeline?.length || 0} processing steps
                    </span>
                  </div>
                  {pluginConfig.processing?.pipeline?.map((step, index) => (
                    <div key={index} className="p-2 bg-muted/30 rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{step.type}</Badge>
                        <span className="text-sm font-medium">{step.name}</span>
                        <Badge variant={step.enabled ? "default" : "secondary"}>
                          {step.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep("type")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={() => setCurrentStep("visualization")}
          className="flex items-center gap-2"
        >
          Next: Visualization
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderVisualizationStep = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Visualization Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure how your plugin data will be displayed and visualized
        </p>
      </div>
      
      {pluginConfig?.visualization?.enabled ? (
        <div className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Charts Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pluginConfig.visualization.charts?.map((chart, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                    <Badge variant="outline">{chart.type}</Badge>
                    <span className="font-medium">{chart.title}</span>
                    <div className="flex-1 text-sm text-muted-foreground">
                      {chart.series.length} series
                    </div>
                    {chart.options.realtime && <Badge variant="destructive">Real-time</Badge>}
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Display Elements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pluginConfig.visualization.displays?.map((display, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                    <Badge variant="outline">{display.type}</Badge>
                    <span className="font-medium">{display.title}</span>
                    <Badge variant="secondary">{display.position.panel}</Badge>
                    <Badge variant="outline">{display.position.size}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Interactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pluginConfig.visualization.interactions?.map((interaction, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                    <Badge variant="outline">{interaction.type}</Badge>
                    <span className="font-medium">{interaction.action.type}</span>
                    <span className="text-sm text-muted-foreground">
                      on {interaction.target}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            This plugin type does not include visualization configuration
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep("config")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={() => setCurrentStep("review")}
          className="flex items-center gap-2"
        >
          Next: Review
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Create Plugin</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Review your plugin configuration before creating it
        </p>
      </div>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plugin Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <div className="text-sm">{formData.name}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Version</Label>
                <div className="text-sm">{formData.version}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <Badge>{formData.pluginType}</Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Badge variant="outline">
                  {pluginTemplates[formData.pluginType]?.category}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <div className="text-sm text-muted-foreground">{formData.description}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interface Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{pluginConfig?.dataColumns?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Data Columns</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{pluginConfig?.signals?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Signals</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {pluginConfig?.visualization?.charts?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Charts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.configuration}
              onChange={(e) => setFormData(prev => ({ ...prev, configuration: e.target.value }))}
              rows={8}
              className="font-mono text-xs"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep("visualization")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || !formData.name || !formData.pluginType}
          className="flex items-center gap-2"
        >
          {isLoading ? "Creating..." : "Create Plugin"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <Tabs value={currentStep} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="type">Type</TabsTrigger>
          <TabsTrigger value="config">Configure</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>
        
        <TabsContent value="type" className="mt-4">
          {renderPluginTypeStep()}
        </TabsContent>
        
        <TabsContent value="config" className="mt-4">
          {renderConfigStep()}
        </TabsContent>
        
        <TabsContent value="visualization" className="mt-4">
          {renderVisualizationStep()}
        </TabsContent>
        
        <TabsContent value="review" className="mt-4">
          {renderReviewStep()}
        </TabsContent>
      </Tabs>
    </div>
  );
}