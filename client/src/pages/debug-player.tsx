import { Layers, Upload, Save, Download, Settings, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDebugPlayer } from '@/hooks/use-debug-player';
import { SidebarLeft } from '@/components/debug-player/sidebar-left';
import { SidebarRight } from '@/components/debug-player/sidebar-right';
import { VisualizationArea } from '@/components/debug-player/visualization-area';
import { TimelineControl } from '@/components/debug-player/timeline-control';

export default function DebugPlayer() {
  const {
    currentTime,
    isPlaying,
    playbackSpeed,
    selectedTab,
    leftSidebarOpen,
    rightSidebarOpen,
    activeSignals,
    bookmarks,
    plugins,
    collisionViolations,
    vehicleData,
    dataSession,
    getCurrentDataPoint,
    formatTime,
    setCurrentTime,
    setPlaybackSpeed,
    setSelectedTab,
    setLeftSidebarOpen,
    setRightSidebarOpen,
    toggleSignal,
    addBookmark,
    jumpToTime,
    togglePlayback,
    resetTime,
    skipToEnd
  } = useDebugPlayer();

  const currentData = getCurrentDataPoint();
  const activeViolations = collisionViolations.filter(v => Math.abs(v.time - currentTime) < 5);

  return (
    <div className="debug-player">
      {/* Top Menu Bar */}
      <div className="dark-panel border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <Layers className="text-primary w-5 h-5" />
            <span className="font-bold text-primary text-lg">Debug Player</span>
          </div>
          <nav className="flex space-x-6 text-sm text-muted-foreground">
            <button className="hover:text-primary transition-colors">File</button>
            <button className="hover:text-primary transition-colors">Edit</button>
            <button className="hover:text-primary transition-colors">View</button>
            <button className="hover:text-primary transition-colors">Tools</button>
            <button className="hover:text-primary transition-colors">Plugins</button>
            <button className="hover:text-primary transition-colors">Help</button>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-muted-foreground">Session:</span>
            <span className="text-primary">{dataSession.name}</span>
          </div>
          <Button variant="ghost" size="sm" className="p-2 dark-hover">
            <Settings size={20} />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="dark-panel border-b px-4 py-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button className="flex items-center space-x-2 text-sm">
              <Upload size={16} />
              <span>Load Dataset</span>
            </Button>
            <Button variant="secondary" className="flex items-center space-x-2 text-sm">
              <Save size={16} />
              <span>Save Session</span>
            </Button>
            <Button variant="secondary" className="flex items-center space-x-2 text-sm">
              <Download size={16} />
              <span>Export Data</span>
            </Button>
          </div>
          
          <div className="h-4 w-px bg-border" />
          
          <div className="flex items-center space-x-2">
            <Button variant="secondary" className="flex items-center space-x-2 text-sm">
              <RefreshCw size={16} />
              <span>Reload Plugins</span>
            </Button>
            <Button variant="secondary" className="flex items-center space-x-2 text-sm">
              <Filter size={16} />
              <span>Filter Signals</span>
            </Button>
          </div>

          <div className="flex-1" />

          {/* Performance Indicators */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[var(--success)] rounded-full" />
              <span className="text-muted-foreground">Performance:</span>
              <span className="text-[var(--success)] font-mono">342ms</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Memory:</span>
              <span className="text-[var(--info)] font-mono">1.2GB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        {leftSidebarOpen && (
          <SidebarLeft
            plugins={plugins.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description || '',
              isActive: p.isActive || false,
              version: p.version
            }))}
            dataSession={dataSession}
            activeSignals={activeSignals}
            bookmarks={bookmarks}
            formatTime={formatTime}
            onToggleSignal={toggleSignal}
            onAddBookmark={addBookmark}
            onJumpToTime={jumpToTime}
          />
        )}

        {/* Central Visualization Area */}
        <VisualizationArea
          selectedTab={selectedTab}
          vehicleData={vehicleData}
          activeSignals={activeSignals}
          currentTime={currentTime}
          currentData={currentData}
          collisionViolations={collisionViolations}
          formatTime={formatTime}
          onTabChange={setSelectedTab}
        />

        {/* Right Sidebar */}
        {rightSidebarOpen && (
          <SidebarRight
            currentTime={currentTime}
            currentData={currentData}
            collisionViolations={collisionViolations}
            formatTime={formatTime}
          />
        )}
      </div>

      {/* Timeline Control */}
      <TimelineControl
        currentTime={currentTime}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        duration={dataSession.duration}
        bookmarks={bookmarks}
        leftSidebarOpen={leftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
        formatTime={formatTime}
        onTimeChange={setCurrentTime}
        onTogglePlayback={togglePlayback}
        onResetTime={resetTime}
        onSkipToEnd={skipToEnd}
        onSpeedChange={setPlaybackSpeed}
        onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
      />

      {/* Status Bar */}
      <div className="status-bar">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[var(--success)] rounded-full" />
            <span>Connected</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Plugins: {plugins.length}/{plugins.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Signals: {dataSession.signalCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Performance: 342ms</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center space-x-2">
            <span>Memory: 1.2GB</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>FPS: 60</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`flex items-center space-x-1 ${activeViolations.length > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
              <div className={`w-2 h-2 rounded-full ${activeViolations.length > 0 ? 'bg-[var(--danger)]' : 'bg-[var(--success)]'}`} />
              <span>{activeViolations.length > 0 ? `${activeViolations.length} Violations` : 'Safe'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
