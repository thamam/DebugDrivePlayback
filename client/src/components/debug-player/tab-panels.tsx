import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Legend, ReferenceLine } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TabPanelsProps {
  selectedTab: string;
  vehicleData: any[];
  activeSignals: Record<string, boolean>;
  currentTime: number;
  currentData: any;
  collisionViolations: Array<{ time: number; margin: number; severity: string }>;
  formatTime: (seconds: number) => string;
}

export function TabPanels({
  selectedTab,
  vehicleData,
  activeSignals,
  currentTime,
  currentData,
  collisionViolations,
  formatTime
}: TabPanelsProps) {
  if (selectedTab === 'temporal') {
    return (
      <div className="flex-1 p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Vehicle Speed Chart */}
          {activeSignals.vehicle_speed && (
            <div className="chart-container">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Vehicle Speed</h4>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="text-primary font-mono">{currentData?.vehicle_speed?.toFixed(1) || '0.0'} m/s</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={vehicleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--dark-border)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="var(--muted-foreground)"
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--dark-panel)', 
                      border: 'none',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'var(--muted-foreground)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vehicle_speed" 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <ReferenceLine x={currentTime} stroke="var(--warning)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Acceleration Chart */}
          {activeSignals.acceleration && (
            <div className="chart-container">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Acceleration</h4>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="text-[var(--success)] font-mono">{currentData?.acceleration?.toFixed(1) || '0.0'} m/s²</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={vehicleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--dark-border)" />
                  <XAxis dataKey="time" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--dark-panel)', 
                      border: 'none',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'var(--muted-foreground)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="acceleration" 
                    stroke="var(--success)" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <ReferenceLine x={currentTime} stroke="var(--warning)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Collision Margin Chart */}
          {activeSignals.collision_margin && (
            <div className="chart-container">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold flex items-center">
                  Collision Margin
                  {collisionViolations.length > 0 && (
                    <AlertTriangle size={16} className="ml-2 text-[var(--danger)]" />
                  )}
                </h4>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-muted-foreground">Current:</span>
                  <span className={`font-mono ${currentData?.collision_margin < 1.5 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                    {currentData?.collision_margin?.toFixed(2) || '0.0'} m
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={vehicleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--dark-border)" />
                  <XAxis dataKey="time" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--dark-panel)', 
                      border: 'none',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'var(--muted-foreground)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="collision_margin" 
                    stroke="var(--warning)" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <ReferenceLine y={1.5} stroke="var(--danger)" strokeWidth={2} strokeDasharray="5 5" />
                  <ReferenceLine x={currentTime} stroke="var(--warning)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedTab === 'spatial') {
    return (
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-4 h-full">
          {/* Vehicle Trajectory */}
          <div className="chart-container">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold">Vehicle Trajectory</h4>
              <div className="flex space-x-2">
                <Button variant="secondary" size="sm" className="text-xs">Reset View</Button>
                <Button variant="secondary" size="sm" className="text-xs">Fit Data</Button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--dark-border)" />
                <XAxis 
                  type="number" 
                  dataKey="position_x" 
                  stroke="var(--muted-foreground)"
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <YAxis 
                  type="number" 
                  dataKey="position_y" 
                  stroke="var(--muted-foreground)"
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--dark-panel)', 
                    border: 'none',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'var(--muted-foreground)' }}
                />
                <Scatter 
                  name="Planned Path" 
                  data={vehicleData.map(d => ({ position_x: d.planned_path_x, position_y: d.planned_path_y }))} 
                  fill="var(--primary)" 
                  fillOpacity={0.3}
                  r={1}
                />
                <Scatter 
                  name="Actual Path" 
                  data={vehicleData.map(d => ({ position_x: d.position_x, position_y: d.position_y }))} 
                  fill="var(--success)" 
                  r={2}
                />
                <Scatter 
                  name="Current Position" 
                  data={[{ position_x: currentData?.position_x, position_y: currentData?.position_y }]} 
                  fill="var(--warning)" 
                  r={8}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Object Detection View */}
          <div className="chart-container">
            <h4 className="text-sm font-semibold mb-3">Object Detection</h4>
            <div className="h-80 bg-[var(--dark-bg)] rounded border border-[var(--dark-border)] flex items-center justify-center">
              <div className="text-muted-foreground text-sm">Object detection visualization</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedTab === 'integrated') {
    return (
      <div className="flex-1 p-4 grid grid-cols-3 gap-4">
        {/* Mini temporal charts */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold mb-2">Speed & Acceleration</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={vehicleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--dark-border)" />
              <XAxis dataKey="time" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--dark-panel)', 
                  border: 'none',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'var(--muted-foreground)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="vehicle_speed" stroke="var(--primary)" name="Speed" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="acceleration" stroke="var(--success)" name="Acceleration" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* KPI Dashboard */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold mb-3">Key Performance Indicators</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[var(--dark-bg)] p-2 rounded">
              <div className="text-muted-foreground">Avg Speed</div>
              <div className="text-lg font-bold text-primary">28.4 m/s</div>
            </div>
            <div className="bg-[var(--dark-bg)] p-2 rounded">
              <div className="text-muted-foreground">Max Acceleration</div>
              <div className="text-lg font-bold text-[var(--success)]">2.1 m/s²</div>
            </div>
            <div className="bg-[var(--dark-bg)] p-2 rounded">
              <div className="text-muted-foreground">Path Deviation</div>
              <div className="text-lg font-bold text-yellow-400">0.8 m</div>
            </div>
            <div className="bg-[var(--dark-bg)] p-2 rounded">
              <div className="text-muted-foreground">Min Collision Margin</div>
              <div className="text-lg font-bold text-[var(--danger)]">0.9 m</div>
            </div>
          </div>
        </div>

        {/* Live Trajectory */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold mb-2">Live Trajectory</h4>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--dark-border)" />
              <XAxis type="number" dataKey="position_x" stroke="var(--muted-foreground)" />
              <YAxis type="number" dataKey="position_y" stroke="var(--muted-foreground)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--dark-panel)', 
                  border: 'none',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'var(--muted-foreground)' }}
              />
              <Scatter 
                name="Vehicle Path" 
                data={vehicleData.slice(0, Math.floor(currentTime * 10)).map(d => ({ position_x: d.position_x, position_y: d.position_y }))} 
                fill="var(--success)" 
                r={1}
              />
              <Scatter 
                name="Current Position" 
                data={[{ position_x: currentData?.position_x, position_y: currentData?.position_y }]} 
                fill="var(--warning)" 
                r={6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (selectedTab === 'collision') {
    return (
      <div className="flex-1 p-4 grid grid-cols-2 gap-4">
        {/* Collision Events List */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold mb-3">Collision Events</h4>
          <div className="space-y-2">
            {collisionViolations.slice(-5).map((violation, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-3 bg-[var(--dark-bg)] rounded border border-red-500 border-opacity-50">
                <div className="w-2 h-2 bg-[var(--danger)] rounded-full" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--danger)]">
                    {violation.severity === 'critical' ? 'Critical Violation' : 'Warning'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(violation.time)} - Margin: {violation.margin.toFixed(1)}m
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-primary">View</Button>
              </div>
            ))}
          </div>
        </div>

        {/* Collision Analysis Charts */}
        <div className="chart-container">
          <h4 className="text-sm font-semibold mb-3">Margin Analysis</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={vehicleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--dark-border)" />
              <XAxis dataKey="time" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--dark-panel)', 
                  border: 'none',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'var(--muted-foreground)' }}
              />
              <Line 
                type="monotone" 
                dataKey="collision_margin" 
                stroke="var(--warning)" 
                strokeWidth={3}
                dot={false}
              />
              <ReferenceLine y={1.5} stroke="var(--danger)" strokeWidth={2} strokeDasharray="5 5" />
              <ReferenceLine y={1.0} stroke="var(--danger)" strokeWidth={2} strokeDasharray="5 5" />
              <ReferenceLine x={currentTime} stroke="var(--warning)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return null;
}
