import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertDataSessionSchema, insertVehicleDataSchema, insertBookmarkSchema, insertPluginSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
