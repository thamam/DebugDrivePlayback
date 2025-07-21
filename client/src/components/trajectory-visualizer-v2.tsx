/**
 * Enhanced Trajectory Visualizer using centralized data service
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react';
import { useSignalData } from '@/hooks/use-data-service';

interface TrajectoryVisualizerProps {
  sessionId: string | null;
  currentTime: number;
  duration: number;
}

export default function TrajectoryVisualizerV2({
  sessionId,
  currentTime,
  duration
}: TrajectoryVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Load trajectory data using data service
  const trajectoryData = useSignalData(
    sessionId,
    ['gps_latitude', 'gps_longitude', 'vehicle_speed', 'steering_wheel_angle'],
    0,
    duration,
    0.1
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !trajectoryData.data || trajectoryData.data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Group data by timestamp
    const dataByTimestamp = new Map<number, Record<string, number>>();
    trajectoryData.data.forEach(point => {
      if (!dataByTimestamp.has(point.timestamp)) {
        dataByTimestamp.set(point.timestamp, {});
      }
      dataByTimestamp.get(point.timestamp)![point.signal] = point.value as number;
    });

    // Convert to trajectory points
    const points: Array<{
      timestamp: number;
      x: number;
      y: number;
      speed: number;
      steering: number;
    }> = [];

    // Find bounds for normalization
    let minLat = Infinity, maxLat = -Infinity;
    let minLon = Infinity, maxLon = -Infinity;

    dataByTimestamp.forEach((data, timestamp) => {
      const lat = data.gps_latitude;
      const lon = data.gps_longitude;
      if (lat !== undefined && lon !== undefined) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
      }
    });

    // Create normalized points
    const latRange = maxLat - minLat || 1;
    const lonRange = maxLon - minLon || 1;
    const scale = Math.min(canvas.width * 0.8, canvas.height * 0.8) / Math.max(latRange, lonRange);

    dataByTimestamp.forEach((data, timestamp) => {
      const lat = data.gps_latitude;
      const lon = data.gps_longitude;
      if (lat !== undefined && lon !== undefined) {
        points.push({
          timestamp,
          x: ((lon - minLon) * scale) + canvas.width * 0.1,
          y: canvas.height - (((lat - minLat) * scale) + canvas.height * 0.1),
          speed: data.vehicle_speed || 0,
          steering: data.steering_wheel_angle || 0
        });
      }
    });

    if (points.length === 0) return;

    // Apply zoom and pan
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2 + pan.x, -canvas.height / 2 + pan.y);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([5, 5]);
    
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);

    // Draw trajectory path
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    
    ctx.stroke();

    // Draw speed gradient along path
    points.forEach((point, index) => {
      if (index > 0) {
        const prevPoint = points[index - 1];
        const gradient = ctx.createLinearGradient(
          prevPoint.x, prevPoint.y,
          point.x, point.y
        );
        
        const speedNorm = Math.min(point.speed / 100, 1);
        const color = `hsl(${120 - speedNorm * 120}, 100%, 50%)`;
        
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
    });

    // Find current position
    const currentPoint = points.find(p => Math.abs(p.timestamp - currentTime) < 0.05);
    
    if (currentPoint) {
      // Draw current position
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw direction indicator
      const angle = (currentPoint.steering || 0) * Math.PI / 180;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(currentPoint.x, currentPoint.y);
      ctx.lineTo(
        currentPoint.x + Math.cos(angle) * 20,
        currentPoint.y + Math.sin(angle) * 20
      );
      ctx.stroke();
      
      // Draw speed indicator
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText(
        `${currentPoint.speed.toFixed(1)} km/h`,
        currentPoint.x + 15,
        currentPoint.y - 15
      );
    }

    // Draw start and end markers
    if (points.length > 0) {
      // Start marker
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText('START', points[0].x + 10, points[0].y - 10);
      
      // End marker
      const lastPoint = points[points.length - 1];
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText('END', lastPoint.x + 10, lastPoint.y - 10);
    }

    ctx.restore();

    // Draw scale
    ctx.fillStyle = '#ccc';
    ctx.font = '12px monospace';
    ctx.fillText(`Scale: ${(100 / scale).toFixed(1)}m`, 10, canvas.height - 10);
    
    // Draw timestamp
    ctx.fillText(`Time: ${currentTime.toFixed(1)}s`, 10, 20);
    
    // Draw data source indicator
    if (trajectoryData.data.length > 0) {
      ctx.fillText('Real GPS Data', canvas.width - 100, 20);
    }

  }, [trajectoryData.data, currentTime, zoom, pan, duration]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(prev * delta, 5)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Trajectory Visualization</CardTitle>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setZoom(prev => Math.min(prev * 1.2, 5))}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setZoom(prev => Math.max(prev * 0.8, 0.5))}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={resetView}
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div className="relative w-full h-[400px] bg-gray-900 rounded">
          {trajectoryData.isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              Loading trajectory data...
            </div>
          ) : trajectoryData.error ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-400">
              Error loading trajectory data
            </div>
          ) : !trajectoryData.data || trajectoryData.data.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              No trajectory data available
            </div>
          ) : null}
          
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
          
          <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
            <Move className="inline h-3 w-3 mr-1" />
            Drag to pan • Scroll to zoom
          </div>
        </div>
      </CardContent>
    </Card>
  );
}