import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertDataSessionSchema, insertVehicleDataSchema, insertBookmarkSchema, insertPluginSchema } from "@shared/schema";
import { pythonBackend } from "./python-integration";
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

  // User routes
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

  // Data session routes
  app.get("/api/sessions", async (req, res) => {
    try {
      // For now, return sessions for user ID 1 (demo user)
      const sessions = await storage.getUserDataSessions(1);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const session = insertDataSessionSchema.parse(req.body);
      const newSession = await storage.createDataSession(session);
      res.json(newSession);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getDataSession(id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/:userId/sessions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessions = await storage.getUserDataSessions(userId);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const session = await storage.updateDataSession(id, updates);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDataSession(id);
      
      if (!success) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json({ message: "Session deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Vehicle data routes
  app.post("/api/vehicle-data", async (req, res) => {
    try {
      const data = insertVehicleDataSchema.parse(req.body);
      const newData = await storage.createVehicleData(data);
      res.json(newData);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/sessions/:sessionId/vehicle-data", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const data = await storage.getVehicleDataBySession(sessionId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/sessions/:sessionId/vehicle-data/range", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const startTime = parseFloat(req.query.startTime as string);
      const endTime = parseFloat(req.query.endTime as string);
      
      const data = await storage.getVehicleDataByTimeRange(sessionId, startTime, endTime);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Bookmark routes
  app.post("/api/bookmarks", async (req, res) => {
    try {
      const bookmark = insertBookmarkSchema.parse(req.body);
      const newBookmark = await storage.createBookmark(bookmark);
      res.json(newBookmark);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/sessions/:sessionId/bookmarks", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const bookmarks = await storage.getBookmarksBySession(sessionId);
      res.json(bookmarks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBookmark(id);
      
      if (!success) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      
      res.json({ message: "Bookmark deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Plugin routes
  app.post("/api/plugins", async (req, res) => {
    try {
      const plugin = insertPluginSchema.parse(req.body);
      // Convert configuration object to JSON string
      if (plugin.configuration && typeof plugin.configuration === 'object') {
        plugin.configuration = JSON.stringify(plugin.configuration);
      }
      const newPlugin = await storage.createPlugin(plugin);
      res.json(newPlugin);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/plugins", async (req, res) => {
    try {
      const plugins = await storage.getPlugins();
      res.json(plugins);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/plugins/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const plugin = await storage.updatePlugin(id, updates);
      res.json(plugin);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/plugins/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePlugin(id);
      
      if (!success) {
        return res.status(404).json({ message: "Plugin not found" });
      }
      
      res.json({ message: "Plugin deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

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

  app.get("/api/python/plugins", async (req, res) => {
    try {
      const isHealthy = await pythonBackend.checkHealth();
      
      if (!isHealthy) {
        return res.status(503).json({ 
          message: "Python backend is not running or not healthy. Please start the Python backend first." 
        });
      }
      
      const response = await fetch("http://localhost:8000/plugins");
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
      
      const response = await fetch("http://localhost:8000/signals");
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
      
      const response = await fetch("http://localhost:8000/upload-data", {
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
      
      const response = await fetch("http://localhost:8000/data/timestamp", {
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
      
      const response = await fetch("http://localhost:8000/data/range", {
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
      const response = await fetch("http://127.0.0.1:8000/health", {
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
