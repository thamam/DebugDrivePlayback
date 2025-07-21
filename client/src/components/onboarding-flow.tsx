/**
 * Interactive Onboarding Flow for new users
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Upload,
  BarChart3,
  Settings,
  Zap,
  Target,
  BookOpen,
  PlayCircle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  optional?: boolean;
  action?: () => Promise<void> | void;
  validation?: () => boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Debug Drive',
    description: 'Your advanced vehicle data analysis platform',
    icon: Sparkles,
    content: (
      <div className="text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Let's get you started!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Debug Drive is a powerful platform for analyzing vehicle data, creating custom widgets, 
            and gaining insights from your driving data. This quick tour will help you get the most 
            out of the platform.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center">
              <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Load Data</p>
            </div>
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Visualize</p>
            </div>
            <div className="text-center">
              <Settings className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Customize</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'data-loading',
    title: 'Load Your Data',
    description: 'Import vehicle data files for analysis',
    icon: Upload,
    content: (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Data Sources</h3>
          <p className="text-muted-foreground">
            Debug Drive supports multiple data sources for comprehensive analysis.
          </p>
        </div>
        
        <div className="grid gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">CSV</span>
              </div>
              <div>
                <p className="font-medium">CSV Files</p>
                <p className="text-sm text-muted-foreground">
                  Upload CSV files with vehicle telemetry data
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Real-time Connection</p>
                <p className="text-sm text-muted-foreground">
                  Connect to live vehicle data streams
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <PlayCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Demo Data</p>
                <p className="text-sm text-muted-foreground">
                  Start with sample data to explore features
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> You can start with demo data and switch to your own data later.
          </p>
        </div>
      </div>
    ),
    action: async () => {
      // Simulate loading demo data
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  },
  {
    id: 'dashboard-tour',
    title: 'Dashboard Overview',
    description: 'Explore the main features and layout',
    icon: BarChart3,
    content: (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your Dashboard</h3>
          <p className="text-muted-foreground">
            The dashboard is your central hub for data analysis and visualization.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm font-bold">1</span>
            </div>
            <div>
              <p className="font-medium">Navigation Bar</p>
              <p className="text-sm text-muted-foreground">
                Access all features: Debug Player, Trip Loader, Plugin Manager, and more
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 text-sm font-bold">2</span>
            </div>
            <div>
              <p className="font-medium">Visualization Area</p>
              <p className="text-sm text-muted-foreground">
                Interactive charts and graphs display your vehicle data in real-time
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 text-sm font-bold">3</span>
            </div>
            <div>
              <p className="font-medium">Widget System</p>
              <p className="text-sm text-muted-foreground">
                Create and customize widgets to display exactly the data you need
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-orange-600 text-sm font-bold">4</span>
            </div>
            <div>
              <p className="font-medium">Control Panel</p>
              <p className="text-sm text-muted-foreground">
                Playback controls, filters, and settings for fine-tuning your analysis
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'widgets',
    title: 'Create Your First Widget',
    description: 'Learn to customize your workspace',
    icon: Settings,
    content: (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <Settings className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Widget System</h3>
          <p className="text-muted-foreground">
            Widgets are the building blocks of your dashboard. Create custom visualizations 
            tailored to your specific needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 border-dashed">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium mb-1">Chart Widgets</p>
              <p className="text-sm text-muted-foreground">
                Line charts, bar charts, and scatter plots for data visualization
              </p>
            </div>
          </Card>

          <Card className="p-4 border-dashed">
            <div className="text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium mb-1">Metric Widgets</p>
              <p className="text-sm text-muted-foreground">
                Display key performance indicators and summary statistics
              </p>
            </div>
          </Card>

          <Card className="p-4 border-dashed">
            <div className="text-center">
              <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium mb-1">Analysis Widgets</p>
              <p className="text-sm text-muted-foreground">
                Advanced analytics, machine learning predictions, and insights
              </p>
            </div>
          </Card>

          <Card className="p-4 border-dashed">
            <div className="text-center">
              <PlayCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium mb-1">Control Widgets</p>
              <p className="text-sm text-muted-foreground">
                Interactive controls for data filtering and playback
              </p>
            </div>
          </Card>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Try it:</strong> Visit the Widget Manager to create your first custom widget!
          </p>
        </div>
      </div>
    ),
    optional: true
  },
  {
    id: 'getting-started',
    title: 'Ready to Start',
    description: 'You\'re all set to begin analyzing your data',
    icon: Target,
    content: (
      <div className="text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">You're Ready!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            You now have everything you need to start analyzing your vehicle data. 
            Here are some recommended next steps:
          </p>
          
          <div className="grid gap-3 max-w-sm mx-auto">
            <div className="flex items-center gap-3 text-left p-3 bg-muted rounded-lg">
              <Upload className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm">Load your first data file</span>
            </div>
            <div className="flex items-center gap-3 text-left p-3 bg-muted rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm">Explore the Debug Player</span>
            </div>
            <div className="flex items-center gap-3 text-left p-3 bg-muted rounded-lg">
              <Settings className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm">Create a custom widget</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Need help? Check out our <BookOpen className="h-4 w-4 inline mx-1" /> documentation 
            or contact support.
          </p>
        </div>
      </div>
    )
  }
];

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingFlow({ isOpen, onClose, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const currentStepData = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  const handleNext = async () => {
    if (currentStepData.action) {
      setIsProcessing(true);
      try {
        await currentStepData.action();
        toast({
          description: `${currentStepData.title} completed successfully!`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          description: `Failed to complete ${currentStepData.title}. Please try again.`,
        });
        setIsProcessing(false);
        return;
      }
      setIsProcessing(false);
    }

    // Mark current step as completed
    if (!completedSteps.includes(currentStepData.id)) {
      setCompletedSteps([...completedSteps, currentStepData.id]);
    }

    // Move to next step or complete
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Mark onboarding as completed in localStorage
    localStorage.setItem('onboarding-completed', 'true');
    
    toast({
      description: "Welcome to Debug Drive! You're ready to start analyzing your data.",
    });
    
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding-completed', 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <currentStepData.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-left">{currentStepData.title}</DialogTitle>
                  <DialogDescription className="text-left">
                    {currentStepData.description}
                  </DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Step {currentStep + 1} of {onboardingSteps.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {onboardingSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full text-xs whitespace-nowrap",
                    index === currentStep && "bg-primary text-primary-foreground",
                    index < currentStep && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
                    index > currentStep && "bg-muted text-muted-foreground"
                  )}
                >
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                  <span>{step.title}</span>
                  {step.optional && (
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  )}
                </div>
              ))}
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-auto py-6">
            {currentStepData.content}
          </div>

          {/* Footer */}
          <DialogFooter className="flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isProcessing}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={isProcessing}
                className="min-w-24"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Processing</span>
                  </div>
                ) : currentStep === onboardingSteps.length - 1 ? (
                  'Get Started'
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage onboarding state
 */
export function useOnboarding() {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed') === 'true';
    if (!hasCompletedOnboarding) {
      // Show onboarding after a short delay
      setTimeout(() => setShouldShowOnboarding(true), 1000);
    }
  }, []);

  const startOnboarding = () => setShouldShowOnboarding(true);
  const closeOnboarding = () => setShouldShowOnboarding(false);
  const completeOnboarding = () => {
    localStorage.setItem('onboarding-completed', 'true');
    setShouldShowOnboarding(false);
  };

  return {
    shouldShowOnboarding,
    startOnboarding,
    closeOnboarding,
    completeOnboarding
  };
}