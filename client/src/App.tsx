import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { DataErrorBoundary } from "@/components/data-error-boundary";
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
      <ErrorBoundary>
        <Navigation />
      </ErrorBoundary>
      <main className="flex-1">
        <ErrorBoundary resetOnPropsChange={true}>
          <Switch>
            <Route path="/">
              <DataErrorBoundary>
                <DebugPlayer />
              </DataErrorBoundary>
            </Route>
            <Route path="/plugins">
              <ErrorBoundary>
                <PluginManager />
              </ErrorBoundary>
            </Route>
            <Route path="/trip-loader">
              <DataErrorBoundary>
                <TripLoader />
              </DataErrorBoundary>
            </Route>
            <Route path="/integration-demo">
              <ErrorBoundary>
                <IntegrationDemo />
              </ErrorBoundary>
            </Route>
            <Route path="/widget-manager">
              <ErrorBoundary>
                <WidgetManager />
              </ErrorBoundary>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary showDetails={true}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
