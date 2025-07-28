import type { Express } from "express";
import { createServer, type Server } from "http";
// import { storage } from "./storage"; // Temporarily disabled to avoid database connection
// import { insertUserSchema, insertDataSessionSchema, insertVehicleDataSchema, insertBookmarkSchema, insertPluginSchema } from "@shared/schema";
import { pythonBackend, PY_BACKEND } from "./python-integration";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Docker
  app.get("/api/health", async (req, res) => {
    try {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "debug-player-backend",
        version: "1.0.0"
      });
    } catch (error: any) {
      res.status(500).json({
        status: "unhealthy",
        error: error.message
      });
    }
  });

  // Database-dependent routes - temporarily disabled to avoid connection issues
  /*
  app.post("/api/auth/register", async (req, res) => {
    try {
      const user = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(user.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }
      
      const newUser = await storage.createUser(user);
      res.json(newUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  */

  // Data session routes - simplified for testing
  app.get("/api/sessions", async (req, res) => {
    try {
      // Return empty sessions for testing (no database)
      res.json([]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sessions", (req, res) => {
    try {
      // Simple session creation without any database or schema dependencies
      const mockSession = {
        id: Date.now(),
        name: req.body.name || "Test Session",
        filePath: req.body.filePath || "/test",
        filename: req.body.filename || "test",
        fileSize: req.body.fileSize || 1000,
        duration: req.body.duration || 300,
        frequency: req.body.frequency || 10,
        signalCount: req.body.signalCount || 100,
        userId: req.body.userId || 1,
        createdAt: new Date().toISOString()
      };
      
      console.log('Creating mock session:', mockSession);
      res.json(mockSession);
    } catch (error: any) {
      console.error('Session creation error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Return mock session for testing
      const mockSession = {
        id: id,
        name: "Mock Session",
        filePath: "/home/thh3/data/trips/2025-07-15T12_06_02",
        duration: 300,
        signalCount: 100
      };
      res.json(mockSession);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Temporarily disable database-dependent routes to avoid connection issues
  /*
  app.get("/api/users/:userId/sessions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessions = await storage.getUserDataSessions(userId);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  */ // ... other database routes disabled for testing

  // Python backend integration routes
  app.post("/api/python/load-data", async (req, res) => {
    try {
      const { filePath, pluginType = "vehicle_data" } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ message: "File path is required" });
      }
      
      // Convert relative paths to be correct for Python backend working directory
      let pythonBackendPath = filePath;
      if (!path.isAbsolute(filePath)) {
        // Python backend runs from python_backend/ directory, so add ../ prefix
        pythonBackendPath = path.join('..', filePath);
      }
      
      console.log(`Loading data: original path="${filePath}", python backend path="${pythonBackendPath}"`);
      
      // Load trip data using the Python backend integration
      const result = await pythonBackend.loadTripData(pythonBackendPath, pluginType);
      
      // Return the actual result - no demo mode fallbacks!
      if (!result.success) {
        return res.status(400).json({ 
          message: result.error
        });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `Backend integration error: ${error.message}` });
    }
  });

  // Trajectory data endpoint - loads real CSV trajectory data
  app.get("/api/trajectory/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      
      // For now, use the development dataset path
      const tripDataPath = path.join(process.cwd(), 'data/trips/2025-07-15T12_06_02');
      
      // Load real trajectory data using Python backend
      const trajectoryData = await pythonBackend.loadTrajectoryData(tripDataPath);
      
      res.json(trajectoryData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all vehicle data for visualization
  app.get("/api/vehicle-data/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      
      // Get data from Python backend for all time points
      const response = await fetch(`${PY_BACKEND}/data-range`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_time: 0,
          end_time: 10000, // Large time to get all data
          signals: ["speed", "steering", "brake", "throttle", "car_pose_car_pose_front_axle_x_meters", "car_pose_car_pose_front_axle_y_meters"]
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Python backend error: ${response.statusText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/python/plugins", async (req, res) => {
    try {
      const isHealthy = await pythonBackend.checkHealth();
      
      if (!isHealthy) {
        return res.status(503).json({ 
          message: "Python backend is not running or not healthy. Please start the Python backend first." 
        });
      }
      
      const response = await fetch(`${PY_BACKEND}/plugins`);
      if (!response.ok) {
        return res.status(response.status).json({ 
          message: `Python backend error: ${response.statusText}` 
        });
      }
      
      const result = await response.json();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `Backend integration error: ${error.message}` });
    }
  });

  app.get("/api/python/signals", async (req, res) => {
    try {
      const isHealthy = await pythonBackend.checkHealth();
      
      if (!isHealthy) {
        return res.status(503).json({ 
          message: "Python backend is not running or not healthy. Please start the Python backend first." 
        });
      }
      
      const response = await fetch(`${PY_BACKEND}/signals`);
      if (!response.ok) {
        return res.status(response.status).json({ 
          message: `Python backend error: ${response.statusText}` 
        });
      }
      
      const result = await response.json();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `Backend integration error: ${error.message}` });
    }
  });

  app.post("/api/python/upload-data", async (req, res) => {
    try {
      const isHealthy = await pythonBackend.checkHealth();
      
      if (!isHealthy) {
        return res.status(503).json({ 
          message: "Python backend is not running or not healthy. Please start the Python backend first." 
        });
      }
      
      const response = await fetch(`${PY_BACKEND}/upload-data`, {
        method: "POST",
        body: req.body,
      });
      
      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json(error);
      }
      
      const result = await response.json();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `Backend integration error: ${error.message}` });
    }
  });

  app.post("/api/python/data/timestamp", async (req, res) => {
    try {
      const { timestamp, signals } = req.body;
      
      const response = await fetch(`${PY_BACKEND}/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timestamp,
          signals,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json(error);
      }
      
      const result = await response.json();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `Python backend error: ${error.message}` });
    }
  });

  app.post("/api/python/data/range", async (req, res) => {
    try {
      const { start_time, end_time, signals } = req.body;
      
      const response = await fetch(`${PY_BACKEND}/data-range`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_time,
          end_time,
          signals,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json(error);
      }
      
      const result = await response.json();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `Python backend error: ${error.message}` });
    }
  });

  // Add improved Python backend health endpoint with better error handling  
  app.get("/api/python/health-status", async (req, res) => {
    try {
      const response = await fetch(`${PY_BACKEND}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      res.json({
        status: "healthy",
        backend_type: data.backend_type || "python",
        plugins_loaded: data.plugins_loaded || [],
        message: "Python backend connected successfully"
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy", 
        backend_type: "python",
        error: error instanceof Error ? error.message : "Connection failed",
        message: "Python backend is not running or not healthy"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
