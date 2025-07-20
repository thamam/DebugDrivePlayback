import { Layers, Database, Radio, Search, Clock, Bookmark, Plus, Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface SidebarLeftProps {
  plugins: Array<{ id: number; name: string; description: string; isActive: boolean; version: string }>;
  dataSession: {
    name: string;
    filename: string;
    fileSize: number;
    duration: number;
    frequency: number;
    signalCount: number;
  };
  activeSignals: Record<string, boolean>;
  bookmarks: Array<{ id: number; timestamp: number; label: string; color: string }>;
  formatTime: (seconds: number) => string;
  onToggleSignal: (signal: string) => void;
  onAddBookmark: () => void;
  onJumpToTime: (time: number) => void;
}

export function SidebarLeft({
  plugins,
  dataSession,
  activeSignals,
  bookmarks,
  formatTime,
  onToggleSignal,
  onAddBookmark,
  onJumpToTime
}: SidebarLeftProps) {
  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const signalColors = {
    'vehicle_speed': 'bg-blue-400',
    'acceleration': 'bg-green-400',
    'steering_angle': 'bg-yellow-400',
    'position_x': 'bg-purple-400',
    'position_y': 'bg-pink-400',
    'collision_margin': 'bg-orange-400'
  };

  return (
    <div className="dockable-panel w-80 p-4 space-y-6">
      {/* Plugin Management */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
          <div className="flex items-center">
            <Layers size={16} className="mr-2" />
            Plugin System
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            disabled 
            className="p-1 opacity-50 cursor-not-allowed" 
            title="Coming Soon - Add new plugins"
          >
            <Plus size={16} />
          </Button>
        </h3>
        <div className="space-y-2">
          {plugins.map(plugin => (
            <div key={plugin.id} className="flex items-center justify-between p-3 dark-panel rounded-lg border">
              <div className="flex items-center space-x-2">
                <div className="plugin-status" />
                <div>
                  <div className="text-sm font-medium">{plugin.name}</div>
                  <div className="text-xs text-muted-foreground">{plugin.description}</div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled 
                className="p-1 opacity-50 cursor-not-allowed" 
                title="Coming Soon - Plugin configuration"
              >
                <Settings size={16} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Data Source Information */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center">
          <Database size={16} className="mr-2" />
          Data Source
        </h3>
        <div className="p-3 dark-panel rounded-lg border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">File:</span>
            <span className="font-mono">{dataSession.filename}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Size:</span>
            <span className="font-mono text-[var(--info)]">{formatFileSize(dataSession.fileSize)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-mono">{formatTime(dataSession.duration)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frequency:</span>
            <span className="font-mono text-[var(--success)]">{dataSession.frequency} Hz</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Signals:</span>
            <span className="font-mono">{dataSession.signalCount} active</span>
          </div>
        </div>
      </div>

      {/* Signal Selection */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
          <div className="flex items-center">
            <Radio size={16} className="mr-2" />
            Signal Selection
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            disabled 
            className="p-1 opacity-50 cursor-not-allowed" 
            title="Coming Soon - Signal search functionality"
          >
            <Search size={16} />
          </Button>
        </h3>
        <div className="space-y-2">
          {Object.entries(activeSignals).map(([signal, active]) => (
            <div key={signal} className="flex items-center space-x-2 p-2 dark-hover rounded cursor-pointer">
              <Checkbox
                checked={active}
                onCheckedChange={() => onToggleSignal(signal)}
              />
              <div className={`signal-indicator ${signalColors[signal as keyof typeof signalColors] || 'bg-gray-400'}`} />
              <span className="text-sm capitalize">{signal.replace('_', ' ')}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {signal === 'vehicle_speed' ? 'm/s' :
                 signal === 'acceleration' ? 'm/s²' :
                 signal === 'steering_angle' ? 'deg' :
                 signal.includes('position') ? 'm' :
                 signal === 'collision_margin' ? 'm' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Time Range Controls */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center">
          <Clock size={16} className="mr-2" />
          Time Range
        </h3>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Input
              type="number"
              defaultValue="0.0"
              step="0.1"
              className="flex-1 text-sm"
              placeholder="Start (s)"
            />
            <Input
              type="number"
              defaultValue="932.0"
              step="0.1"
              className="flex-1 text-sm"
              placeholder="End (s)"
            />
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="secondary" 
              size="sm" 
              disabled 
              className="text-xs opacity-50 cursor-not-allowed" 
              title="Coming Soon - Time range selection"
            >
              All
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              disabled 
              className="text-xs opacity-50 cursor-not-allowed" 
              title="Coming Soon - Time range selection"
            >
              Last 30s
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              disabled 
              className="text-xs opacity-50 cursor-not-allowed" 
              title="Coming Soon - Time range selection"
            >
              Custom
            </Button>
          </div>
        </div>
      </div>

      {/* Bookmarks */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
          <div className="flex items-center">
            <Bookmark size={16} className="mr-2" />
            Bookmarks
          </div>
          <Button variant="ghost" size="sm" onClick={onAddBookmark} className="p-1 dark-hover">
            <Plus size={16} />
          </Button>
        </h3>
        <div className="space-y-2">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="flex items-center space-x-2 p-2 dark-hover rounded cursor-pointer"
              onClick={() => onJumpToTime(bookmark.timestamp)}
            >
              <div className="w-3 h-3 rounded" style={{ backgroundColor: bookmark.color }} />
              <div className="flex-1">
                <div className="text-sm">{bookmark.label}</div>
                <div className="text-xs text-muted-foreground">{formatTime(bookmark.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
