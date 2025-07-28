import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import WidgetManager from "@/components/widget-wizard/widget-manager";
import WidgetDashboard from "@/components/widget-wizard/widget-dashboard";

export default function WidgetManagerPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="space-y-8">
          <WidgetDashboard />
          <WidgetManager />
        </div>
      </div>
    </div>
  );
}
