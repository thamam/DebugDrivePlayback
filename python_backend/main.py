"""
FastAPI backend server for the Debug Player Framework.
Provides REST API endpoints for vehicle data analysis and visualization.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
import logging
import asyncio
import uvicorn
from pathlib import Path
import tempfile
import os
from contextlib import asynccontextmanager

from core.plot_manager import PlotManager
from plugins.vehicle_data_plugin import VehicleDataPlugin
from plugins.collision_detection_plugin import CollisionDetectionPlugin
from plugins.trip_data_plugin import TripDataPlugin


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global plot manager instance
plot_manager: Optional[PlotManager] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    global plot_manager
    
    # Startup
    logger.info("Starting Debug Player Framework backend")
    plot_manager = PlotManager()
    
    yield
    
    # Shutdown
    logger.info("Shutting down Debug Player Framework backend")
    if plot_manager:
        plot_manager.shutdown()


# Create FastAPI app
app = FastAPI(
    title="Debug Player Framework API",
    description="REST API for vehicle data analysis and visualization",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for request/response
class DataLoadRequest(BaseModel):
    file_path: str = Field(..., description="Path to the data file")
    plugin_type: str = Field(default="vehicle_data", description="Type of plugin to use")


class TimestampRequest(BaseModel):
    timestamp: float = Field(..., description="Timestamp to query")
    signals: Optional[List[str]] = Field(None, description="Optional list of signals to retrieve")


class TimeRangeRequest(BaseModel):
    start_time: float = Field(..., description="Start timestamp")
    end_time: float = Field(..., description="End timestamp")
    signals: Optional[List[str]] = Field(None, description="Optional list of signals to retrieve")


class PluginInfo(BaseModel):
    name: str
    version: str
    description: str
    is_loaded: bool
    signals: List[str]


class SignalData(BaseModel):
    timestamp: float
    value: Union[float, str, bool, Dict[str, Any]]
    units: str
    signal_type: Optional[str] = None


class CollisionEvent(BaseModel):
    timestamp: float
    severity: str
    margin: float
    vehicle_speed: float
    time_to_collision: float
    description: str


# API Routes

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Debug Player Framework API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": asyncio.get_event_loop().time()}


@app.post("/load-data")
async def load_data(request: DataLoadRequest):
    """Load data from a file using the specified plugin."""
    global plot_manager
    
    if not plot_manager:
        raise HTTPException(status_code=500, detail="Plot manager not initialized")
    
    try:
        # Validate file path
        file_path = Path(request.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {request.file_path}")
        
        # Create appropriate plugin based on path type and plugin type
        if request.plugin_type == "vehicle_data":
            # Use TripDataPlugin for directories, VehicleDataPlugin for single files
            if file_path.is_dir():
                plugin = TripDataPlugin(str(file_path))
            else:
                plugin = VehicleDataPlugin(str(file_path))
        elif request.plugin_type == "collision_detection":
            plugin = CollisionDetectionPlugin(str(file_path))
        else:
            raise HTTPException(status_code=400, detail=f"Unknown plugin type: {request.plugin_type}")
        
        # Register plugin
        success = plot_manager.register_plugin(plugin)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to load data")
        
        # Get time range
        time_range = plugin.get_time_range()
        signals = plugin.get_signals()
        
        return {
            "success": True,
            "plugin_name": plugin.name,
            "time_range": time_range,
            "signals": {name: {
                "name": info.name,
                "type": info.signal_type.value,
                "units": info.units,
                "description": info.description
            } for name, info in signals.items()},
            "data_points": len(plugin._data) if hasattr(plugin, '_data') and plugin._data is not None else 0
        }
        
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-data")
async def upload_data(file: UploadFile = File(...), plugin_type: str = "vehicle_data"):
    """Upload and load data from a file."""
    global plot_manager
    
    if not plot_manager:
        raise HTTPException(status_code=500, detail="Plot manager not initialized")
    
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Load data using the temporary file
        request = DataLoadRequest(file_path=tmp_file_path, plugin_type=plugin_type)
        result = await load_data(request)
        
        # Clean up temporary file
        os.unlink(tmp_file_path)
        
        return result
        
    except Exception as e:
        logger.error(f"Error uploading data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/plugins")
async def get_plugins() -> List[PluginInfo]:
    """Get information about all loaded plugins."""
    global plot_manager
    
    if not plot_manager:
        raise HTTPException(status_code=500, detail="Plot manager not initialized")
    
    try:
        plugins_info = plot_manager.get_plugin_info()
        return [PluginInfo(**info) for info in plugins_info]
        
    except Exception as e:
        logger.error(f"Error getting plugins: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/signals")
async def get_signals():
    """Get all available signals."""
    global plot_manager
    
    if not plot_manager:
        raise HTTPException(status_code=500, detail="Plot manager not initialized")
    
    try:
        signals = plot_manager.get_available_signals()
        return {
            name: {
                "name": info.name,
                "type": info.signal_type.value,
                "units": info.units,
                "description": info.description,
                "value_range": info.value_range,
                "sampling_rate": info.sampling_rate
            } for name, info in signals.items()
        }
        
    except Exception as e:
        logger.error(f"Error getting signals: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/data")
async def get_data(request: TimestampRequest):
    """Get data for a specific timestamp."""
    global plot_manager
    
    if not plot_manager:
        raise HTTPException(status_code=500, detail="Plot manager not initialized")
    
    try:
        data = plot_manager.request_data_update(request.timestamp, request.signals)
        return {"timestamp": request.timestamp, "data": data}
        
    except Exception as e:
        logger.error(f"Error getting data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/data-range")
async def get_data_range(request: TimeRangeRequest):
    """Get data for a time range."""
    global plot_manager
    
    if not plot_manager:
        raise HTTPException(status_code=500, detail="Plot manager not initialized")
    
    try:
        # Get data for multiple timestamps in the range
        time_step = 0.1  # 100ms intervals
        timestamps = []
        current_time = request.start_time
        
        while current_time <= request.end_time:
            timestamps.append(current_time)
            current_time += time_step
        
        # Collect data for all timestamps
        data_points = []
        for timestamp in timestamps:
            data = plot_manager.request_data_update(timestamp, request.signals)
            if data:
                data_points.append({
                    "timestamp": timestamp,
                    "data": data
                })
        
        return {
            "start_time": request.start_time,
            "end_time": request.end_time,
            "data_points": data_points
        }
        
    except Exception as e:
        logger.error(f"Error getting data range: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/collision-events")
async def get_collision_events(start_time: float, end_time: float):
    """Get collision events in a time range."""
    global plot_manager
    
    if not plot_manager:
        raise HTTPException(status_code=500, detail="Plot manager not initialized")
    
    try:
        events = []
        
        # Find collision detection plugins
        for plugin_name, plugin in plot_manager.plugins.items():
            if isinstance(plugin, CollisionDetectionPlugin):
                plugin_events = plugin.get_collision_events(start_time, end_time)
                for event in plugin_events:
                    events.append({
                        "timestamp": event.timestamp,
                        "severity": event.severity,
                        "margin": event.margin,
                        "vehicle_speed": event.vehicle_speed,
                        "time_to_collision": event.time_to_collision,
                        "description": event.description
                    })
        
        return {"events": events}
        
    except Exception as e:
        logger.error(f"Error getting collision events: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/performance")
async def get_performance_metrics():
    """Get performance metrics."""
    global plot_manager
    
    if not plot_manager:
        raise HTTPException(status_code=500, detail="Plot manager not initialized")
    
    try:
        metrics = plot_manager.get_performance_metrics()
        return {"metrics": metrics}
        
    except Exception as e:
        logger.error(f"Error getting performance metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/clear-cache")
async def clear_cache():
    """Clear all cached data."""
    global plot_manager
    
    if not plot_manager:
        raise HTTPException(status_code=500, detail="Plot manager not initialized")
    
    try:
        success = plot_manager.clear_cache()
        return {"success": success}
        
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/plugins/{plugin_name}")
async def unload_plugin(plugin_name: str):
    """Unload a specific plugin."""
    global plot_manager
    
    if not plot_manager:
        raise HTTPException(status_code=500, detail="Plot manager not initialized")
    
    try:
        success = plot_manager.unregister_plugin(plugin_name)
        if not success:
            raise HTTPException(status_code=404, detail=f"Plugin not found: {plugin_name}")
        
        return {"success": True, "message": f"Plugin {plugin_name} unloaded"}
        
    except Exception as e:
        logger.error(f"Error unloading plugin: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/status")
async def get_system_status():
    """Get overall system status."""
    global plot_manager
    
    if not plot_manager:
        raise HTTPException(status_code=500, detail="Plot manager not initialized")
    
    try:
        plugins_info = plot_manager.get_plugin_info()
        metrics = plot_manager.get_performance_metrics()
        
        return {
            "status": "running",
            "plugins_loaded": len(plugins_info),
            "signals_available": len(plot_manager.get_available_signals()),
            "performance_metrics": metrics,
            "cache_stats": plot_manager.cache.get_stats()
        }
        
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler."""
    logger.error(f"HTTP error: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler."""
    logger.error(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status_code": 500}
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
