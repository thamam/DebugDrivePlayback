import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DebugPlayer from "@/pages/debug-player";
import PluginManager from "@/pages/plugin-manager";
import TripLoader from "@/pages/trip-loader";
import IntegrationDemo from "@/pages/integration-demo";
import WidgetManager from "@/pages/widget-manager";
import Navigation from "@/components/navigation";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={DebugPlayer} />
          <Route path="/plugins" component={PluginManager} />
          <Route path="/trip-loader" component={TripLoader} />
          <Route path="/integration-demo" component={IntegrationDemo} />
          <Route path="/widget-manager" component={WidgetManager} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
