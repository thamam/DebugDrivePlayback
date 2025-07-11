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
import PluginWizard from "@/components/plugin-wizard";
import PluginWizardDemo from "@/components/plugin-wizard-demo";

export default function PluginManager() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
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
      setIsDemoMode(false);
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
        <div className="flex items-center gap-2">
          <Dialog open={isDemoMode} onOpenChange={setIsDemoMode}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Demo Wizard
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Plugin Creation Wizard Demo</DialogTitle>
              </DialogHeader>
              <PluginWizardDemo
                onCreatePlugin={(data) => createPluginMutation.mutate(data)}
                isLoading={createPluginMutation.isPending}
              />
            </DialogContent>
          </Dialog>
          
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