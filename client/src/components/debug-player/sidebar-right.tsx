import { Activity, Play, Download, BarChart3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface SidebarRightProps {
  currentTime: number;
  currentData: any;
  collisionViolations: Array<{ time: number; margin: number; severity: string }>;
  formatTime: (seconds: number) => string;
}

export function SidebarRight({
  currentTime,
  currentData,
  collisionViolations,
  formatTime
}: SidebarRightProps) {
  return (
    <div className="dockable-panel w-64 border-l p-4 space-y-6">
      {/* Current Status */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center">
          <Activity size={16} className="mr-2" />
          Current Status
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time:</span>
            <span className="font-mono">{formatTime(currentTime)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Speed:</span>
            <span className="font-mono text-primary">{currentData?.vehicle_speed?.toFixed(1) || '0.0'} m/s</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Acceleration:</span>
            <span className="font-mono text-[var(--success)]">{currentData?.acceleration?.toFixed(1) || '0.0'} m/s²</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Position:</span>
            <span className="font-mono text-purple-400">
              {currentData?.position_x?.toFixed(1) || '0.0'}, {currentData?.position_y?.toFixed(1) || '0.0'} m
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Margin:</span>
            <span className={`font-mono ${currentData?.collision_margin < 1.5 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
              {currentData?.collision_margin?.toFixed(2) || '0.0'} m
              {currentData?.collision_margin < 1.5 && ' ⚠'}
            </span>
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center">
          <Play size={16} className="mr-2" />
          Playback Control
        </h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Speed:</span>
              <Select defaultValue="1.0">
                <SelectTrigger className="flex-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1.0">1.0x</SelectItem>
                  <SelectItem value="2.0">2.0x</SelectItem>
                  <SelectItem value="5.0">5.0x</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Loop:</span>
              <Checkbox />
            </div>
          </div>
        </div>
      </div>

      {/* Active Violations */}
      {collisionViolations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-[var(--danger)] flex items-center">
            <AlertTriangle size={16} className="mr-2" />
            Active Violations
          </h3>
          <div className="space-y-1">
            {collisionViolations.slice(-3).map((violation, idx) => (
              <div key={idx} className="p-2 bg-red-900 bg-opacity-30 border border-red-700 rounded text-xs">
                <div className="text-[var(--danger)] font-semibold">
                  {violation.severity === 'critical' ? 'CRITICAL' : 'WARNING'}
                </div>
                <div>Time: {formatTime(violation.time)}</div>
                <div>Margin: {violation.margin.toFixed(2)}m</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center">
          <Download size={16} className="mr-2" />
          Export Options
        </h3>
        <div className="space-y-2">
          <Button variant="secondary" size="sm" className="w-full text-sm">
            Export Current View
          </Button>
          <Button variant="secondary" size="sm" className="w-full text-sm">
            Export Selected Range
          </Button>
          <Button variant="secondary" size="sm" className="w-full text-sm">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Analysis Tools */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center">
          <BarChart3 size={16} className="mr-2" />
          Analysis Tools
        </h3>
        <div className="space-y-2">
          <Button variant="secondary" size="sm" className="w-full text-sm">
            Statistical Summary
          </Button>
          <Button variant="secondary" size="sm" className="w-full text-sm">
            Correlation Analysis
          </Button>
          <Button variant="secondary" size="sm" className="w-full text-sm">
            Anomaly Detection
          </Button>
        </div>
      </div>
    </div>
  );
}
