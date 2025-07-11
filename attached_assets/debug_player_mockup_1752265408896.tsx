import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Play, Pause, SkipBack, SkipForward, Square, Settings, Upload, Save, Download, Search, Filter, Eye, EyeOff, Bookmark, Layers, Map, BarChart3, AlertTriangle } from 'lucide-react';

const DebugPlayerMockup = () => {
  // State management
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedTab, setSelectedTab] = useState('temporal');
  const [loadedPlugins, setLoadedPlugins] = useState(['CarPosePlugin', 'PathViewPlugin', 'CollisionPlugin']);
  const [activeSignals, setActiveSignals] = useState({
    'vehicle_speed': true,
    'acceleration': true,
    'steering_angle': false,
    'position_x': true,
    'position_y': true,
    'collision_margin': true
  });
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [collisionViolations, setCollisionViolations] = useState([]);
  const [bookmarks, setBookmarks] = useState([
    { time: 15.3, label: 'Sharp Turn', color: '#ff8c42' },
    { time: 32.7, label: 'Collision Warning', color: '#ff4757' },
    { time: 45.1, label: 'Lane Change', color: '#4a9eff' }
  ]);

  // Mock data generation
  const generateMockData = useCallback(() => {
    const data = [];
    for (let i = 0; i <= 60; i += 0.1) {
      const time = Math.round(i * 10) / 10;
      data.push({
        time: time,
        vehicle_speed: 25 + 10 * Math.sin(time * 0.1) + Math.random() * 2,
        acceleration: Math.sin(time * 0.2) * 2 + Math.random() * 0.5,
        steering_angle: Math.sin(time * 0.15) * 15 + Math.random() * 2,
        position_x: time * 2 + Math.sin(time * 0.1) * 5,
        position_y: Math.sin(time * 0.05) * 10 + Math.random() * 1,
        collision_margin: Math.max(0.5, 3 + Math.sin(time * 0.3) * 2 + Math.random() * 0.5),
        planned_path_x: time * 2,
        planned_path_y: Math.sin(time * 0.05) * 8
      });
    }
    return data;
  }, []);

  const [mockData] = useState(generateMockData());

  // Get current data point
  const getCurrentDataPoint = useCallback(() => {
    return mockData.find(d => Math.abs(d.time - currentTime) < 0.05) || mockData[0];
  }, [mockData, currentTime]);

  // Auto-play functionality
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1 * playbackSpeed;
          return next >= 60 ? 0 : next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Check for collision violations
  useEffect(() => {
    const currentData = getCurrentDataPoint();
    if (currentData && currentData.collision_margin < 1.5) {
      setCollisionViolations(prev => {
        const newViolation = {
          time: currentTime,
          margin: currentData.collision_margin,
          severity: currentData.collision_margin < 1.0 ? 'critical' : 'warning'
        };
        return [...prev.slice(-4), newViolation]; // Keep last 5 violations
      });
    }
  }, [currentTime, getCurrentDataPoint]);

  const toggleSignal = (signal) => {
    setActiveSignals(prev => ({
      ...prev,
      [signal]: !prev[signal]
    }));
  };

  const addBookmark = () => {
    const newBookmark = {
      time: currentTime,
      label: `Bookmark ${bookmarks.length + 1}`,
      color: '#4a9eff'
    };
    setBookmarks(prev => [...prev, newBookmark]);
  };

  const jumpToBookmark = (time) => {
    setCurrentTime(time);
    setIsPlaying(false);
  };

  return (
    <div className="h-screen bg-gray-800 text-gray-200 flex flex-col">
      {/* Top Menu Bar */}
      <div className="bg-gray-900 border-b border-gray-600 px-4 py-2 flex items-center justify-between">
        <div className="flex space-x-6">
          <span className="font-bold text-blue-400">Debug Player</span>
          <div className="flex space-x-4 text-sm">
            <span className="hover:text-blue-400 cursor-pointer">File</span>
            <span className="hover:text-blue-400 cursor-pointer">Edit</span>
            <span className="hover:text-blue-400 cursor-pointer">View</span>
            <span className="hover:text-blue-400 cursor-pointer">Tools</span>
            <span className="hover:text-blue-400 cursor-pointer">Plugins</span>
            <span className="hover:text-blue-400 cursor-pointer">Help</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Session: vehicle_trip_001.json</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-700 border-b border-gray-600 px-4 py-2 flex items-center space-x-4">
        <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">
          <Upload size={16} />
          <span>Load Data</span>
        </button>
        <button className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">
          <Save size={16} />
          <span>Save Session</span>
        </button>
        <button className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">
          <Download size={16} />
          <span>Export</span>
        </button>
        <div className="flex-1"></div>
        <button className="p-1 hover:bg-gray-600 rounded">
          <Settings size={20} />
        </button>
      </div>

      {/* Tab Panel */}
      <div className="bg-gray-700 border-b border-gray-600 px-4">
        <div className="flex space-x-1">
          {['temporal', 'spatial', 'integrated'].map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 text-sm capitalize ${
                selectedTab === tab 
                  ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400' 
                  : 'hover:bg-gray-600'
              }`}
            >
              {tab} Analysis
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        {leftSidebarOpen && (
          <div className="w-80 bg-gray-700 border-r border-gray-600 p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Plugin Management */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center">
                  <Layers size={16} className="mr-2" />
                  Plugins
                </h3>
                <div className="space-y-2">
                  {loadedPlugins.map(plugin => (
                    <div key={plugin} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs">{plugin}</span>
                      </div>
                      <button className="p-1 hover:bg-gray-500 rounded">
                        <Settings size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs">
                  Scan for Plugins
                </button>
              </div>

              {/* Data Source */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Data Source</h3>
                <div className="p-3 bg-gray-600 rounded text-xs">
                  <div>File: autonomous_trip_data.csv</div>
                  <div>Size: 45.2 MB</div>
                  <div>Duration: 60.0 seconds</div>
                  <div>Frequency: 10 Hz</div>
                </div>
              </div>

              {/* Signal Selection */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  Signals
                  <Search size={14} />
                </h3>
                <div className="space-y-2">
                  {Object.entries(activeSignals).map(([signal, active]) => (
                    <div key={signal} className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleSignal(signal)}
                        className={`p-1 rounded ${active ? 'text-blue-400' : 'text-gray-500'}`}
                      >
                        {active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <div className={`w-3 h-3 rounded ${
                        signal === 'vehicle_speed' ? 'bg-blue-400' :
                        signal === 'acceleration' ? 'bg-green-400' :
                        signal === 'steering_angle' ? 'bg-yellow-400' :
                        signal === 'position_x' ? 'bg-purple-400' :
                        signal === 'position_y' ? 'bg-pink-400' :
                        'bg-orange-400'
                      }`}></div>
                      <span className="text-xs capitalize">{signal.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Range Controls */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Time Range</h3>
                <div className="space-y-2">
                  <div className="flex space-x-2 text-xs">
                    <input 
                      type="number" 
                      value="0.0" 
                      className="flex-1 p-1 bg-gray-600 rounded"
                      placeholder="Start"
                    />
                    <input 
                      type="number" 
                      value="60.0" 
                      className="flex-1 p-1 bg-gray-600 rounded"
                      placeholder="End"
                    />
                  </div>
                  <div className="flex space-x-1">
                    <button className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs">All</button>
                    <button className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs">Last 10s</button>
                    <button className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs">Custom</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Visualization Area */}
        <div className="flex-1 flex flex-col">
          {selectedTab === 'temporal' && (
            <div className="flex-1 p-4 space-y-4">
              {/* Temporal Charts */}
              <div className="grid grid-cols-1 gap-4 h-full">
                {/* Vehicle Speed Chart */}
                {activeSignals.vehicle_speed && (
                  <div className="bg-gray-700 rounded p-4">
                    <h4 className="text-sm font-semibold mb-2">Vehicle Speed (m/s)</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={mockData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#a0aec0"
                          domain={['dataMin', 'dataMax']}
                        />
                        <YAxis stroke="#a0aec0" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#2d3748', border: 'none' }}
                          labelStyle={{ color: '#a0aec0' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="vehicle_speed" 
                          stroke="#4a9eff" 
                          strokeWidth={2}
                          dot={false}
                        />
                        {/* Current time indicator */}
                        <Line
                          type="monotone"
                          dataKey={() => null}
                          stroke="#ff8c42"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#ff8c42' }}
                          data={[{ time: currentTime, vehicle_speed: getCurrentDataPoint()?.vehicle_speed }]}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Acceleration Chart */}
                {activeSignals.acceleration && (
                  <div className="bg-gray-700 rounded p-4">
                    <h4 className="text-sm font-semibold mb-2">Acceleration (m/s²)</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={mockData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis dataKey="time" stroke="#a0aec0" />
                        <YAxis stroke="#a0aec0" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#2d3748', border: 'none' }}
                          labelStyle={{ color: '#a0aec0' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="acceleration" 
                          stroke="#48bb78" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Collision Margin Chart */}
                {activeSignals.collision_margin && (
                  <div className="bg-gray-700 rounded p-4">
                    <h4 className="text-sm font-semibold mb-2 flex items-center">
                      Collision Margin (m)
                      {collisionViolations.length > 0 && (
                        <AlertTriangle size={16} className="ml-2 text-red-400" />
                      )}
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={mockData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis dataKey="time" stroke="#a0aec0" />
                        <YAxis stroke="#a0aec0" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#2d3748', border: 'none' }}
                          labelStyle={{ color: '#a0aec0' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="collision_margin" 
                          stroke="#ff8c42" 
                          strokeWidth={2}
                          dot={false}
                        />
                        {/* Safety threshold line */}
                        <Line
                          type="monotone"
                          dataKey={() => 1.5}
                          stroke="#ff4757"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'spatial' && (
            <div className="flex-1 p-4">
              <div className="bg-gray-700 rounded p-4 h-full">
                <h4 className="text-sm font-semibold mb-4 flex items-center justify-between">
                  <span>Vehicle Trajectory</span>
                  <div className="flex space-x-2">
                    <button className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs">Reset View</button>
                    <button className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs">Fit Data</button>
                  </div>
                </h4>
                <ResponsiveContainer width="100%" height="90%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                    <XAxis 
                      type="number" 
                      dataKey="position_x" 
                      stroke="#a0aec0"
                      domain={['dataMin - 5', 'dataMax + 5']}
                      label={{ value: 'X Position (m)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="position_y" 
                      stroke="#a0aec0"
                      domain={['dataMin - 5', 'dataMax + 5']}
                      label={{ value: 'Y Position (m)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#2d3748', border: 'none' }}
                      labelStyle={{ color: '#a0aec0' }}
                    />
                    {/* Planned path */}
                    <Scatter 
                      name="Planned Path" 
                      data={mockData.map(d => ({ position_x: d.planned_path_x, position_y: d.planned_path_y }))} 
                      fill="#4a9eff" 
                      fillOpacity={0.3}
                      r={1}
                    />
                    {/* Actual path */}
                    <Scatter 
                      name="Actual Path" 
                      data={mockData.map(d => ({ position_x: d.position_x, position_y: d.position_y }))} 
                      fill="#48bb78" 
                      r={2}
                    />
                    {/* Current position */}
                    <Scatter 
                      name="Current Position" 
                      data={[{ position_x: getCurrentDataPoint()?.position_x, position_y: getCurrentDataPoint()?.position_y }]} 
                      fill="#ff8c42" 
                      r={8}
                    />
                    {/* Collision violations */}
                    {collisionViolations.map((violation, idx) => {
                      const point = mockData.find(d => Math.abs(d.time - violation.time) < 0.1);
                      return point ? (
                        <Scatter
                          key={idx}
                          name="Collision Violation"
                          data={[{ position_x: point.position_x, position_y: point.position_y }]}
                          fill="#ff4757"
                          shape="cross"
                          r={6}
                        />
                      ) : null;
                    })}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {selectedTab === 'integrated' && (
            <div className="flex-1 p-4 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                {/* Speed and Acceleration */}
                <div className="bg-gray-700 rounded p-4">
                  <h4 className="text-sm font-semibold mb-2">Speed & Acceleration</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={mockData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                      <XAxis dataKey="time" stroke="#a0aec0" />
                      <YAxis stroke="#a0aec0" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#2d3748', border: 'none' }}
                        labelStyle={{ color: '#a0aec0' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="vehicle_speed" stroke="#4a9eff" name="Speed" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="acceleration" stroke="#48bb78" name="Acceleration" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* KPI Dashboard */}
                <div className="bg-gray-700 rounded p-4">
                  <h4 className="text-sm font-semibold mb-3">Key Performance Indicators</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-600 p-2 rounded">
                      <div className="text-gray-400">Avg Speed</div>
                      <div className="text-lg font-bold text-blue-400">28.4 m/s</div>
                    </div>
                    <div className="bg-gray-600 p-2 rounded">
                      <div className="text-gray-400">Max Acceleration</div>
                      <div className="text-lg font-bold text-green-400">2.1 m/s²</div>
                    </div>
                    <div className="bg-gray-600 p-2 rounded">
                      <div className="text-gray-400">Path Deviation</div>
                      <div className="text-lg font-bold text-yellow-400">0.8 m</div>
                    </div>
                    <div className="bg-gray-600 p-2 rounded">
                      <div className="text-gray-400">Min Collision Margin</div>
                      <div className="text-lg font-bold text-red-400">0.9 m</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spatial View */}
              <div className="bg-gray-700 rounded p-4">
                <h4 className="text-sm font-semibold mb-2">Live Trajectory</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                    <XAxis type="number" dataKey="position_x" stroke="#a0aec0" />
                    <YAxis type="number" dataKey="position_y" stroke="#a0aec0" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#2d3748', border: 'none' }}
                      labelStyle={{ color: '#a0aec0' }}
                    />
                    <Scatter 
                      name="Vehicle Path" 
                      data={mockData.slice(0, Math.floor(currentTime * 10)).map(d => ({ position_x: d.position_x, position_y: d.position_y }))} 
                      fill="#48bb78" 
                      r={1}
                    />
                    <Scatter 
                      name="Current Position" 
                      data={[{ position_x: getCurrentDataPoint()?.position_x, position_y: getCurrentDataPoint()?.position_y }]} 
                      fill="#ff8c42" 
                      r={6}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        {rightSidebarOpen && (
          <div className="w-64 bg-gray-700 border-l border-gray-600 p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Properties */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Properties</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-gray-600 rounded">
                    <div className="text-gray-400">Current Time</div>
                    <div className="font-mono">{currentTime.toFixed(1)}s</div>
                  </div>
                  <div className="p-2 bg-gray-600 rounded">
                    <div className="text-gray-400">Speed</div>
                    <div className="font-mono">{getCurrentDataPoint()?.vehicle_speed?.toFixed(1)} m/s</div>
                  </div>
                  <div className="p-2 bg-gray-600 rounded">
                    <div className="text-gray-400">Position</div>
                    <div className="font-mono">({getCurrentDataPoint()?.position_x?.toFixed(1)}, {getCurrentDataPoint()?.position_y?.toFixed(1)})</div>
                  </div>
                  <div className="p-2 bg-gray-600 rounded">
                    <div className="text-gray-400">Collision Margin</div>
                    <div className={`font-mono ${getCurrentDataPoint()?.collision_margin < 1.5 ? 'text-red-400' : 'text-green-400'}`}>
                      {getCurrentDataPoint()?.collision_margin?.toFixed(2)} m
                    </div>
                  </div>
                </div>
              </div>

              {/* Bookmarks */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  Bookmarks
                  <button 
                    onClick={addBookmark}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    <Bookmark size={14} />
                  </button>
                </h3>
                <div className="space-y-1">
                  {bookmarks.map((bookmark, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-600 rounded cursor-pointer hover:bg-gray-500"
                      onClick={() => jumpToBookmark(bookmark.time)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded" style={{ backgroundColor: bookmark.color }}></div>
                        <div>
                          <div className="text-xs">{bookmark.label}</div>
                          <div className="text-xs text-gray-400">{bookmark.time.toFixed(1)}s</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Violations */}
              {collisionViolations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-red-400 flex items-center">
                    <AlertTriangle size={14} className="mr-2" />
                    Active Violations
                  </h3>
                  <div className="space-y-1">
                    {collisionViolations.slice(-3).map((violation, idx) => (
                      <div key={idx} className="p-2 bg-red-900 bg-opacity-30 border border-red-700 rounded text-xs">
                        <div className="text-red-400 font-semibold">
                          {violation.severity === 'critical' ? 'CRITICAL' : 'WARNING'}
                        </div>
                        <div>Time: {violation.time.toFixed(1)}s</div>
                        <div>Margin: {violation.margin.toFixed(2)}m</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Measurement Tools */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Measurement Tools</h3>
                <div className="space-y-2">
                  <button className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-xs">
                    Distance Measurement
                  </button>
                  <button className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-xs">
                    Time Interval
                  </button>
                  <button className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-xs">
                    Custom Calculation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Panel */}
      <div className="bg-gray-700 border-t border-gray-600 p-4">
        <div className="flex items-center space-x-4">
          {/* Playback Controls */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentTime(0)}
              className="p-2 hover:bg-gray-600 rounded"
            >
              <SkipBack size={16} />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 hover:bg-gray-600 rounded"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button 
              onClick={() => setCurrentTime(60)}
              className="p-2 hover:bg-gray-600 rounded"
            >
              <SkipForward size={16} />
            </button>
            <button 
              onClick={() => setIsPlaying(false)}
              className="p-2 hover:bg-gray-600 rounded"
            >
              <Square size={16} />
            </button>
          </div>

          {/* Timeline Slider */}
          <div className="flex-1 mx-4">
            <div className="relative">
              <input
                type="range"
                min="0"
                max="60"
                step="0.1"
                value={currentTime}
                onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              {/* Bookmarks on timeline */}
              {bookmarks.map((bookmark, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 w-1 h-2 rounded"
                  style={{
                    left: `${(bookmark.time / 60) * 100}%`,
                    backgroundColor: bookmark.color
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Time Display */}
          <div className="flex items-center space-x-4 text-sm">
            <span className="font-mono">{currentTime.toFixed(1)}s / 60.0s</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs">Speed:</span>
              <select 
                value={playbackSpeed} 
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="bg-gray-600 rounded px-2 py-1 text-xs"
              >
                <option value={0.1}>0.1x</option>
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={5}>5x</option>
                <option value={10}>10x</option>
              </select>
            </div>
          </div>

          {/* Sidebar Toggles */}
          <div className="flex space-x-1">
            <button 
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className={`p-2 rounded ${leftSidebarOpen ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
            >
              <Filter size={16} />
            </button>
            <button 
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className={`p-2 rounded ${rightSidebarOpen ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
            >
              <BarChart3 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-900 border-t border-gray-600 px-4 py-1 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Plugins: {loadedPlugins.length} loaded</span>
          <span>Signals: {Object.values(activeSignals).filter(Boolean).length} active</span>
          <span>Data: 600 samples loaded</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Memory: 127 MB</span>
          <span>FPS: 60</span>
          <span className={`flex items-center space-x-1 ${collisionViolations.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
            <div className={`w-2 h-2 rounded-full ${collisionViolations.length > 0 ? 'bg-red-400' : 'bg-green-400'}`}></div>
            <span>{collisionViolations.length > 0 ? `${collisionViolations.length} Violations` : 'Safe'}</span>
          </span>
        </div>
      </div>

      {/* Custom CSS for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4a9eff;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4a9eff;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default DebugPlayerMockup;