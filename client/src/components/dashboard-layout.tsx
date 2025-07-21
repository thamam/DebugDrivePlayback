/**
 * Dashboard Layout with improved UX and responsive design
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from '@/components/ui/resizable';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  Settings, 
  Maximize2, 
  Minimize2,
  SidebarClose,
  SidebarOpen,
  Filter,
  RefreshCw,
  Download,
  Share,
  Bookmark,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  quickActions?: React.ReactNode;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

interface QuickStat {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
}

const defaultStats: QuickStat[] = [
  {
    label: 'Active Sessions',
    value: 3,
    change: '+2',
    trend: 'up',
    icon: Clock
  },
  {
    label: 'Data Points',
    value: '1.2M',
    change: '+15%',
    trend: 'up',
    icon: TrendingUp
  },
  {
    label: 'Widgets',
    value: 8,
    change: '+3',
    trend: 'up',
    icon: LayoutDashboard
  },
  {
    label: 'Alerts',
    value: 0,
    change: '-2',
    trend: 'down',
    icon: CheckCircle
  }
];

export default function DashboardLayout({
  children,
  sidebar,
  header,
  quickActions,
  title = "Dashboard",
  description,
  isLoading = false
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = () => {
    setLastRefresh(new Date());
    // Trigger data refresh
    window.location.reload();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? <SidebarClose className="h-4 w-4" /> : <SidebarOpen className="h-4 w-4" />}
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                {description && (
                  <p className="text-muted-foreground">{description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Stats Bar */}
              <div className="hidden xl:flex items-center gap-4 mr-4">
                {defaultStats.map((stat) => (
                  <QuickStatCard key={stat.label} stat={stat} />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filters & Settings</SheetTitle>
                      <SheetDescription>
                        Customize your dashboard view
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                      {/* Filter content would go here */}
                      <p className="text-sm text-muted-foreground">
                        Filter options will be available here
                      </p>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>

                <Button variant="ghost" size="sm">
                  <Share className="h-4 w-4" />
                </Button>

                <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Last Refresh Indicator */}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              {isLoading && (
                <RefreshCw className="h-3 w-3 animate-spin" />
              )}
            </div>
            
            {/* Quick Stats Mobile */}
            <div className="xl:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Stats
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom">
                  <SheetHeader>
                    <SheetTitle>Quick Statistics</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    {defaultStats.map((stat) => (
                      <QuickStatCard key={stat.label} stat={stat} />
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Custom Header Content */}
          {header && (
            <div className="mt-4 border-t pt-4">
              {header}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-6">
        <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-200px)]">
          {/* Sidebar Panel */}
          {sidebar && (
            <>
              <ResizablePanel
                defaultSize={20}
                minSize={15}
                maxSize={30}
                className={cn(
                  "transition-all duration-300",
                  !sidebarOpen && "lg:hidden"
                )}
              >
                <div className="h-full pr-6">
                  <Card className="h-full">
                    <CardContent className="p-4">
                      {sidebar}
                    </CardContent>
                  </Card>
                </div>
              </ResizablePanel>
              <ResizableHandle className={cn("mx-2", !sidebarOpen && "lg:hidden")} />
            </>
          )}

          {/* Main Content Panel */}
          <ResizablePanel defaultSize={sidebar ? 80 : 100} minSize={50}>
            <div className="h-full">
              {quickActions && (
                <div className="mb-6">
                  <Card>
                    <CardContent className="p-4">
                      {quickActions}
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div className="space-y-6">
                {children}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Debug Drive Playback - Advanced Vehicle Data Analysis
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Version 2.0.0</span>
              <span>•</span>
              <span>Status: All Systems Operational</span>
              <span>•</span>
              <span>Uptime: 99.9%</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function QuickStatCard({ stat }: { stat: QuickStat }) {
  const IconComponent = stat.icon;
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
      {IconComponent && (
        <IconComponent className="h-4 w-4 text-muted-foreground" />
      )}
      <div className="text-sm">
        <div className="font-medium">{stat.value}</div>
        <div className="text-xs text-muted-foreground">{stat.label}</div>
      </div>
      {stat.change && (
        <Badge 
          variant={stat.trend === 'up' ? 'default' : stat.trend === 'down' ? 'destructive' : 'secondary'}
          className="text-xs"
        >
          {stat.change}
        </Badge>
      )}
    </div>
  );
}

/**
 * Enhanced Widget Grid Layout
 */
export function WidgetGridLayout({ 
  children, 
  columns = 3 
}: { 
  children: React.ReactNode; 
  columns?: number;
}) {
  return (
    <div 
      className="grid gap-6 auto-fit-minmax"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 400px), 1fr))`,
        '--columns': columns
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * Enhanced Card with Actions
 */
export function ActionCard({ 
  title, 
  description, 
  children, 
  actions,
  icon: IconComponent,
  status,
  ...props 
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  status?: 'success' | 'warning' | 'error' | 'info';
} & React.ComponentProps<typeof Card>) {
  const statusColors = {
    success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
    warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
    error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
    info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
  };

  return (
    <Card className={cn(status && statusColors[status])} {...props}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {IconComponent && (
              <IconComponent className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription>{description}</CardDescription>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-1">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * Tabbed Content Layout
 */
export function TabbedLayout({ 
  tabs, 
  defaultValue,
  className 
}: {
  tabs: Array<{ 
    value: string; 
    label: string; 
    content: React.ReactNode; 
    icon?: React.ComponentType<{ className?: string }>;
    badge?: string;
  }>;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <Tabs defaultValue={defaultValue || tabs[0]?.value} className={className}>
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
            {tab.icon && <tab.icon className="h-4 w-4" />}
            <span>{tab.label}</span>
            {tab.badge && (
              <Badge variant="secondary" className="ml-1">
                {tab.badge}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}