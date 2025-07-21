/**
 * Enhanced Navigation with improved UX and accessibility
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Settings, 
  Database, 
  Upload, 
  Grid, 
  Bell,
  Search,
  Menu,
  X,
  HelpCircle,
  User,
  Sun,
  Moon,
  Zap,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  isNew?: boolean;
  category?: string;
}

const navigationItems: NavigationItem[] = [
  {
    path: "/",
    label: "Debug Player",
    icon: Home,
    description: "Vehicle data visualization and analysis",
    category: "primary"
  },
  {
    path: "/trip-loader",
    label: "Trip Loader",
    icon: Upload,
    description: "Load and analyze trip data",
    category: "primary"
  },
  {
    path: "/plugins",
    label: "Plugin Manager",
    icon: Settings,
    description: "Manage and configure plugins",
    badge: "2",
    category: "tools"
  },
  {
    path: "/integration-demo",
    label: "Integration Demo",
    icon: Database,
    description: "Test backend integrations",
    category: "tools"
  },
  {
    path: "/widget-manager",
    label: "Widget Manager",
    icon: Grid,
    description: "Create and manage custom widgets",
    isNew: true,
    category: "tools"
  },
];

export default function EnhancedNavigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const { toast } = useToast();

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  useEffect(() => {
    // Apply theme
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    toast({
      description: `Switched to ${!isDarkMode ? 'dark' : 'light'} mode`,
    });
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Implement search functionality
      console.log('Searching for:', query);
      toast({
        description: `Searching for "${query}"...`,
      });
    }
  };

  const primaryItems = navigationItems.filter(item => item.category === 'primary');
  const toolItems = navigationItems.filter(item => item.category === 'tools');

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="hidden sm:inline">Debug Drive</span>
            </Link>

            {/* Primary Navigation - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              {primaryItems.map((item) => (
                <NavItem key={item.path} item={item} currentPath={location} />
              ))}
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search features, widgets, data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                className="pl-10 pr-4"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Tools Dropdown - Desktop */}
            <div className="hidden md:block">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Tools
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-80 p-4">
                        <h3 className="font-semibold mb-3">Development Tools</h3>
                        <div className="grid gap-2">
                          {toolItems.map((item) => (
                            <NavigationMenuLink key={item.path} asChild>
                              <Link
                                href={item.path}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                              >
                                <item.icon className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{item.label}</span>
                                    {item.isNew && (
                                      <Badge variant="secondary" className="text-xs">New</Badge>
                                    )}
                                    {item.badge && (
                                      <Badge variant="outline" className="text-xs">{item.badge}</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {notifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {notifications}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-4">
                  <h3 className="font-semibold mb-3">Notifications</h3>
                  <div className="space-y-2">
                    <div className="p-2 bg-muted rounded">
                      <p className="text-sm font-medium">Widget Update Available</p>
                      <p className="text-xs text-muted-foreground">New version of Time Series Chart available</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-sm font-medium">Data Processing Complete</p>
                      <p className="text-xs text-muted-foreground">Trip analysis finished successfully</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-sm font-medium">System Status</p>
                      <p className="text-xs text-muted-foreground">All services running normally</p>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className="hidden md:flex"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Help */}
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <HelpCircle className="h-4 w-4" />
            </Button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden md:flex">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                className="pl-10"
              />
            </div>

            {/* Mobile Navigation */}
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <MobileNavItem 
                  key={item.path} 
                  item={item} 
                  currentPath={location}
                  onClick={() => setIsMobileMenuOpen(false)} 
                />
              ))}
            </div>

            {/* Mobile Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {isDarkMode ? 'Light' : 'Dark'}
              </Button>
              <Button variant="ghost" size="sm">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </Button>
              <Button variant="ghost" size="sm">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Bar */}
      <div className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Status: Online</span>
              <span>Data: Connected</span>
              <span>Backend: Active</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-green-500" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavItem({ item, currentPath }: { item: NavigationItem; currentPath: string }) {
  const isActive = currentPath === item.path;
  
  return (
    <Link href={item.path}>
      <Button
        variant={isActive ? "default" : "ghost"}
        size="sm"
        className={cn(
          "flex items-center gap-2 transition-colors",
          isActive && "bg-primary text-primary-foreground"
        )}
      >
        <item.icon className="h-4 w-4" />
        <span className="hidden lg:inline">{item.label}</span>
        {item.badge && (
          <Badge variant="secondary" className="text-xs ml-1">
            {item.badge}
          </Badge>
        )}
        {item.isNew && (
          <Badge variant="secondary" className="text-xs ml-1">
            New
          </Badge>
        )}
      </Button>
    </Link>
  );
}

function MobileNavItem({ 
  item, 
  currentPath, 
  onClick 
}: { 
  item: NavigationItem; 
  currentPath: string;
  onClick: () => void;
}) {
  const isActive = currentPath === item.path;
  
  return (
    <Link href={item.path} onClick={onClick}>
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      )}>
        <item.icon className="h-5 w-5" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.label}</span>
            {item.isNew && (
              <Badge variant="secondary" className="text-xs">New</Badge>
            )}
            {item.badge && (
              <Badge variant="outline" className="text-xs">{item.badge}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
      </div>
    </Link>
  );
}