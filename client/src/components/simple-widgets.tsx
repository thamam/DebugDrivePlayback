/**
 * Simple Widget Components - Replaces complex widget templates
 * Each widget is just a React component, no complex abstractions
 */
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

// Simple Trajectory Visualizer Widget
export function TrajectoryWidget({ data }: { data?: any[] }) {
  const trajectoryData = data?.slice(0, 100) || []; // Limit for performance
  
  return (
    <div className="h-48 w-full">
      <h3 className="text-sm font-medium mb-2">Vehicle Trajectory</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart data={trajectoryData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="position_x" />
          <YAxis dataKey="position_y" />
          <Tooltip />
          <Scatter dataKey="position_y" fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// Simple Speed Analyzer Widget
export function SpeedWidget({ data }: { data?: any[] }) {
  const speedData = data?.slice(0, 100) || [];
  
  return (
    <div className="h-48 w-full">
      <h3 className="text-sm font-medium mb-2">Vehicle Speed</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={speedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="vehicle_speed" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Simple Signal Monitor Widget
export function SignalWidget({ signals }: { signals?: Record<string, boolean> }) {
  const activeSignals = Object.entries(signals || {}).filter(([_, active]) => active);
  
  return (
    <div className="h-48 w-full p-4 border rounded">
      <h3 className="text-sm font-medium mb-2">Active Signals</h3>
      <div className="space-y-2">
        {activeSignals.length === 0 ? (
          <p className="text-gray-500">No active signals</p>
        ) : (
          activeSignals.map(([signal, _]) => (
            <div key={signal} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">{signal}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Simple Data Export Widget
export function ExportWidget({ data }: { data?: any[] }) {
  const exportCSV = () => {
    if (!data || data.length === 0) return;
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.slice(0, 100).map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehicle-data.csv';
    a.click();
  };

  return (
    <div className="h-48 w-full p-4 border rounded">
      <h3 className="text-sm font-medium mb-2">Data Export</h3>
      <button 
        onClick={exportCSV}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={!data || data.length === 0}
      >
        Export CSV
      </button>
      <p className="text-xs text-gray-500 mt-2">
        {data?.length || 0} data points available
      </p>
    </div>
  );
}
