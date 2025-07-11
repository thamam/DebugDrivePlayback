import { Play, Pause, SkipBack, SkipForward, Square, Filter, BarChart3 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface TimelineControlProps {
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  duration: number;
  bookmarks: Array<{ timestamp: number; color: string; label: string }>;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  formatTime: (seconds: number) => string;
  onTimeChange: (time: number) => void;
  onTogglePlayback: () => void;
  onResetTime: () => void;
  onSkipToEnd: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
}

export function TimelineControl({
  currentTime,
  isPlaying,
  playbackSpeed,
  duration,
  bookmarks,
  leftSidebarOpen,
  rightSidebarOpen,
  formatTime,
  onTimeChange,
  onTogglePlayback,
  onResetTime,
  onSkipToEnd,
  onSpeedChange,
  onToggleLeftSidebar,
  onToggleRightSidebar
}: TimelineControlProps) {
  return (
    <div className="dark-panel border-t p-4">
      <div className="flex items-center space-x-4">
        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetTime}
            className="p-2 dark-hover"
          >
            <SkipBack size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePlayback}
            className="p-2 dark-hover"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkipToEnd}
            className="p-2 dark-hover"
          >
            <SkipForward size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePlayback()}
            className="p-2 dark-hover"
          >
            <Square size={16} />
          </Button>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 mx-4 relative">
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={(e) => onTimeChange(parseFloat(e.target.value))}
            className="timeline-slider"
          />
          {/* Bookmark markers */}
          {bookmarks.map((bookmark, idx) => (
            <div
              key={idx}
              className="bookmark-marker"
              style={{
                left: `${(bookmark.timestamp / duration) * 100}%`,
                backgroundColor: bookmark.color
              }}
            />
          ))}
        </div>

        {/* Time Display */}
        <div className="flex items-center space-x-4 text-sm">
          <span className="font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs">Speed:</span>
            <Select value={playbackSpeed.toString()} onValueChange={(value) => onSpeedChange(parseFloat(value))}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.1">0.1x</SelectItem>
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
                <SelectItem value="5">5x</SelectItem>
                <SelectItem value="10">10x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sidebar Toggles */}
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLeftSidebar}
            className={`p-2 ${leftSidebarOpen ? 'bg-primary text-primary-foreground' : 'dark-hover'}`}
          >
            <Filter size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleRightSidebar}
            className={`p-2 ${rightSidebarOpen ? 'bg-primary text-primary-foreground' : 'dark-hover'}`}
          >
            <BarChart3 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
