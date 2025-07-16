import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Code, Eye, BarChart3, Map, Settings, ChevronRight, Grid } from "lucide-react";
import { widgetTemplates } from "@/lib/widget-templates";
import { widgetEngine } from "@/lib/widget-engine";

interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'visualization' | 'analysis' | 'data_source' | 'export';
  icon: React.ElementType;
  inputs: string[];
  outputs: string[];
  configSchema: Record<string, any>;
}

// Convert widget templates to the format expected by the wizard
const wizardTemplates: WidgetTemplate[] = widgetTemplates.map(template => ({
  id: template.id,
  name: template.name,
  description: template.inputs.map(i => i.description).join(', '),
  category: template.category,
  icon: template.category === 'visualization' ? (template.type.includes('spatial') ? Map : Eye) : 
         template.category === 'analysis' ? BarChart3 : 
         template.category === 'export' ? Settings : Code,
  inputs: template.inputs.map(i => i.name),
  outputs: template.outputs.map(o => o.name),
  configSchema: template.configSchema
}));

export default function WidgetWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<WidgetTemplate | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<Record<string, any>>({});
  const [widgetName, setWidgetName] = useState('');

  const handleTemplateSelect = (template: WidgetTemplate) => {
    setSelectedTemplate(template);
    setWidgetName(template.name);
    setCurrentStep(2);
  };

  const handleConfigChange = (key: string, value: any) => {
    setWidgetConfig(prev => ({ ...prev, [key]: value }));
  };

  const renderConfigField = (key: string, schema: any) => {
    switch (schema.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={key}
              checked={widgetConfig[key] ?? schema.default}
              onCheckedChange={(checked) => handleConfigChange(key, checked)}
            />
            <Label htmlFor={key} className="text-sm font-medium capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </Label>
          </div>
        );
      case 'select':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </Label>
            <Select value={widgetConfig[key] ?? schema.default} onValueChange={(value) => handleConfigChange(key, value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {schema.options.map((option: string) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'number':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </Label>
            <Input
              type="number"
              value={widgetConfig[key] ?? schema.default}
              onChange={(e) => handleConfigChange(key, parseFloat(e.target.value))}
            />
          </div>
        );
      case 'array':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </Label>
            <Textarea
              placeholder="Enter items separated by commas"
              value={Array.isArray(widgetConfig[key]) ? widgetConfig[key].join(', ') : ''}
              onChange={(e) => handleConfigChange(key, e.target.value.split(',').map(s => s.trim()))}
            />
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </Label>
            <Input
              value={widgetConfig[key] ?? schema.default}
              onChange={(e) => handleConfigChange(key, e.target.value)}
            />
          </div>
        );
    }
  };

  const handleCreateWidget = async () => {
    if (!selectedTemplate) return;
    
    try {
      // Create widget instance using the widget engine
      const instanceId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await widgetEngine.createWidget(
        selectedTemplate.id,
        instanceId,
        widgetName,
        widgetConfig
      );
      
      console.log('Widget created successfully:', {
        instanceId,
        template: selectedTemplate.id,
        name: widgetName,
        config: widgetConfig
      });
      
      // Reset form
      setIsOpen(false);
      setCurrentStep(1);
      setSelectedTemplate(null);
      setWidgetConfig({});
      setWidgetName('');
      
    } catch (error) {
      console.error('Error creating widget:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Widget Wizard</DialogTitle>
          <DialogDescription>
            Create a new data viewer or analyzer widget for your debug player
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep.toString()} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1">Choose Template</TabsTrigger>
            <TabsTrigger value="2" disabled={!selectedTemplate}>Configure</TabsTrigger>
            <TabsTrigger value="3" disabled={!selectedTemplate}>Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="1" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wizardTemplates.map((template) => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <template.icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline" className="ml-auto">
                        {template.category}
                      </Badge>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Inputs:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.inputs.map((input, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {input}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Outputs:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.outputs.map((output, idx) => (
                            <Badge key={idx} variant="default" className="text-xs">
                              {output}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="2" className="space-y-4">
            {selectedTemplate && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Widget Name</Label>
                  <Input
                    value={widgetName}
                    onChange={(e) => setWidgetName(e.target.value)}
                    placeholder="Enter widget name"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configuration</h3>
                  {Object.entries(selectedTemplate.configSchema).map(([key, schema]) => (
                    <div key={key}>
                      {renderConfigField(key, schema)}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(3)}>
                    Preview <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="3" className="space-y-4">
            {selectedTemplate && (
              <div className="space-y-6">
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h3 className="font-semibold mb-2">Widget Preview</h3>
                  <div className="space-y-2">
                    <div><strong>Name:</strong> {widgetName}</div>
                    <div><strong>Template:</strong> {selectedTemplate.name}</div>
                    <div><strong>Category:</strong> {selectedTemplate.category}</div>
                    <div><strong>Configuration:</strong></div>
                    <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(widgetConfig, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button onClick={handleCreateWidget}>
                    Create Widget
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}