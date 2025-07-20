// Python Backend Connection Handler
// This module manages the connection to the Python FastAPI backend

import { Request, Response } from "express";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

interface PythonBackendHealth {
  status: "healthy" | "unhealthy";
  backend_type: string;
  plugins_loaded?: string[];
  error?: string;
}

export async function checkPythonBackendHealth(): Promise<PythonBackendHealth> {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return {
      status: "healthy",
      backend_type: data.backend_type || "python",
      plugins_loaded: data.plugins_loaded || [],
    };
  } catch (error) {
    console.warn("[python-backend] Health check failed:", error);
    return {
      status: "unhealthy",
      backend_type: "none",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function proxyToPythonBackend(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<any> {
  const url = `${PYTHON_BACKEND_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000), // 30 second timeout for data operations
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python backend error: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[python-backend] Request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Express middleware to handle Python backend requests
export function createPythonBackendRoutes() {
  return {
    // Health check endpoint
    health: async (req: Request, res: Response) => {
      try {
        const health = await checkPythonBackendHealth();
        res.json(health);
      } catch (error) {
        res.status(500).json({
          status: "unhealthy",
          backend_type: "none",
          error: error instanceof Error ? error.message : "Connection failed",
        });
      }
    },

    // Plugin management endpoints
    loadPlugins: async (req: Request, res: Response) => {
      try {
        const result = await proxyToPythonBackend('/plugins/load', 'POST', req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: "Failed to load plugins",
          message: error instanceof Error ? error.message : "Unknown error",
          fallback: true,
        });
      }
    },

    getPluginStatus: async (req: Request, res: Response) => {
      try {
        const result = await proxyToPythonBackend('/plugins/status');
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: "Failed to get plugin status",
          plugins: [], // Empty fallback
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },

    // Trip data loading
    loadTripData: async (req: Request, res: Response) => {
      try {
        const { trip_path } = req.body;
        const result = await proxyToPythonBackend('/trip/load', 'POST', { trip_path });
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: "Failed to load trip data",
          message: error instanceof Error ? error.message : "Python backend unavailable",
          fallback_mode: true,
        });
      }
    },

    // Vehicle data processing
    getVehicleData: async (req: Request, res: Response) => {
      try {
        const { start_time, end_time } = req.query;
        const result = await proxyToPythonBackend(
          `/vehicle/data?start_time=${start_time}&end_time=${end_time}`
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: "Failed to get vehicle data",
          message: error instanceof Error ? error.message : "Python backend unavailable",
          data: [], // Empty fallback
        });
      }
    },

    // Plugin execution
    executePlugin: async (req: Request, res: Response) => {
      try {
        const { plugin_name } = req.params;
        const result = await proxyToPythonBackend(`/plugins/execute/${plugin_name}`, 'POST', req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: `Failed to execute plugin: ${req.params.plugin_name}`,
          message: error instanceof Error ? error.message : "Plugin execution failed",
          success: false,
        });
      }
    },
  };
}

// Startup connection test
export async function testPythonBackendConnection() {
  console.log("[python-backend] Testing connection...");
  const health = await checkPythonBackendHealth();
  
  if (health.status === "healthy") {
    console.log("[python-backend] ✓ Connected successfully");
    console.log(`[python-backend] Backend type: ${health.backend_type}`);
    if (health.plugins_loaded?.length) {
      console.log(`[python-backend] Plugins loaded: ${health.plugins_loaded.join(', ')}`);
    }
  } else {
    console.warn("[python-backend] ⚠ Connection failed:", health.error);
    console.warn("[python-backend] Falling back to demo mode");
  }
  
  return health;
}