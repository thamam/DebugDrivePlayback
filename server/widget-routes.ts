/**
 * Widget API Routes
 */

import { Express, Request, Response } from "express";
import { z } from "zod";
import { widgetService } from "./widget-service";
import { widgetEngine } from "../client/src/lib/widget-engine";

// Validation schemas
const createWidgetDefinitionSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['visualization', 'analysis', 'data_source', 'export']),
  version: z.string().min(1),
  inputs: z.string(), // JSON string
  outputs: z.string(), // JSON string
  configSchema: z.string(), // JSON string
  implementation: z.string(), // JSON string
  isBuiltIn: z.boolean().optional().default(false)
});

const createWidgetInstanceSchema = z.object({
  definitionId: z.number().optional(),
  templateId: z.string().optional(),
  sessionId: z.number().optional(),
  instanceId: z.string().min(1),
  name: z.string().min(1),
  config: z.string(), // JSON string
  status: z.enum(['active', 'paused', 'error', 'stopped']).optional().default('active'),
  position: z.string().optional(), // JSON string
  size: z.string().optional() // JSON string
});

const updateWidgetInstanceSchema = z.object({
  name: z.string().optional(),
  config: z.string().optional(),
  status: z.enum(['active', 'paused', 'error', 'stopped']).optional(),
  position: z.string().optional(),
  size: z.string().optional()
});

const saveWidgetDataSchema = z.object({
  instanceId: z.number(),
  timestamp: z.number(),
  inputData: z.string().optional(),
  outputData: z.string().optional(),
  error: z.string().optional(),
  processingTime: z.number().optional()
});

export function registerWidgetRoutes(app: Express): void {

  // Widget Definitions Routes
  
  // Get all widget definitions
  app.get('/api/widgets/definitions', async (req: Request, res: Response) => {
    try {
      const definitions = await widgetService.getWidgetDefinitions();
      res.json(definitions);
    } catch (error) {
      console.error('Error getting widget definitions:', error);
      res.status(500).json({
        error: 'Failed to get widget definitions',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create widget definition
  app.post('/api/widgets/definitions', async (req: Request, res: Response) => {
    try {
      const definitionData = createWidgetDefinitionSchema.parse(req.body);
      const definition = await widgetService.createWidgetDefinition(definitionData);
      res.status(201).json(definition);
    } catch (error) {
      console.error('Error creating widget definition:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid widget definition data',
          details: error.errors
        });
      } else {
        res.status(500).json({
          error: 'Failed to create widget definition',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  // Get widget definition by ID
  app.get('/api/widgets/definitions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid definition ID' });
      }

      const definition = await widgetService.getWidgetDefinitionById(id);
      if (!definition) {
        return res.status(404).json({ error: 'Widget definition not found' });
      }

      res.json(definition);
    } catch (error) {
      console.error('Error getting widget definition:', error);
      res.status(500).json({
        error: 'Failed to get widget definition',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update widget definition
  app.put('/api/widgets/definitions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid definition ID' });
      }

      const updates = createWidgetDefinitionSchema.partial().parse(req.body);
      const definition = await widgetService.updateWidgetDefinition(id, updates);
      
      if (!definition) {
        return res.status(404).json({ error: 'Widget definition not found' });
      }

      res.json(definition);
    } catch (error) {
      console.error('Error updating widget definition:', error);
      res.status(500).json({
        error: 'Failed to update widget definition',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete widget definition
  app.delete('/api/widgets/definitions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid definition ID' });
      }

      const success = await widgetService.deleteWidgetDefinition(id);
      if (!success) {
        return res.status(404).json({ error: 'Widget definition not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting widget definition:', error);
      res.status(500).json({
        error: 'Failed to delete widget definition',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Widget Instance Routes

  // Get all widget instances (optionally filtered by session)
  app.get('/api/widgets/instances', async (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId ? parseInt(req.query.sessionId as string) : undefined;
      const includeDefinitions = req.query.includeDefinitions === 'true';

      if (includeDefinitions) {
        const instances = await widgetService.getWidgetInstancesWithDefinitions(sessionId);
        res.json(instances);
      } else {
        const instances = await widgetService.getWidgetInstances(sessionId);
        res.json(instances);
      }
    } catch (error) {
      console.error('Error getting widget instances:', error);
      res.status(500).json({
        error: 'Failed to get widget instances',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create widget instance
  app.post('/api/widgets/instances', async (req: Request, res: Response) => {
    try {
      const instanceData = createWidgetInstanceSchema.parse(req.body);
      
      // If templateId is provided instead of definitionId, look up the definition
      if (instanceData.templateId && !instanceData.definitionId) {
        const definition = await widgetService.getWidgetDefinitionByTemplateId(instanceData.templateId);
        if (!definition) {
          return res.status(400).json({ error: `Widget template '${instanceData.templateId}' not found` });
        }
        instanceData.definitionId = definition.id;
      }

      if (!instanceData.definitionId) {
        return res.status(400).json({ error: 'Either definitionId or templateId must be provided' });
      }

      const instance = await widgetService.createWidgetInstance({
        definitionId: instanceData.definitionId,
        sessionId: instanceData.sessionId,
        instanceId: instanceData.instanceId,
        name: instanceData.name,
        config: instanceData.config,
        status: instanceData.status || 'active',
        position: instanceData.position,
        size: instanceData.size
      });

      // Also register with widget engine if it's available
      try {
        const definition = await widgetService.getWidgetDefinitionById(instanceData.definitionId);
        if (definition) {
          // Parse configuration and register with engine
          const config = JSON.parse(instanceData.config);
          // Note: This would need the widget engine to be available on the server side
          // For now, we'll just store in the database
        }
      } catch (engineError) {
        console.warn('Widget engine registration failed:', engineError);
        // Continue anyway, the instance is saved in the database
      }

      res.status(201).json(instance);
    } catch (error) {
      console.error('Error creating widget instance:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid widget instance data',
          details: error.errors
        });
      } else {
        res.status(500).json({
          error: 'Failed to create widget instance',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  // Get widget instance by ID
  app.get('/api/widgets/instances/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid instance ID' });
      }

      const instance = await widgetService.getWidgetInstanceById(id);
      if (!instance) {
        return res.status(404).json({ error: 'Widget instance not found' });
      }

      res.json(instance);
    } catch (error) {
      console.error('Error getting widget instance:', error);
      res.status(500).json({
        error: 'Failed to get widget instance',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update widget instance
  app.put('/api/widgets/instances/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid instance ID' });
      }

      const updates = updateWidgetInstanceSchema.parse(req.body);
      const instance = await widgetService.updateWidgetInstance(id, updates);
      
      if (!instance) {
        return res.status(404).json({ error: 'Widget instance not found' });
      }

      res.json(instance);
    } catch (error) {
      console.error('Error updating widget instance:', error);
      res.status(500).json({
        error: 'Failed to update widget instance',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete widget instance
  app.delete('/api/widgets/instances/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid instance ID' });
      }

      const success = await widgetService.deleteWidgetInstance(id);
      if (!success) {
        return res.status(404).json({ error: 'Widget instance not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting widget instance:', error);
      res.status(500).json({
        error: 'Failed to delete widget instance',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Widget Data Routes

  // Save widget data
  app.post('/api/widgets/data', async (req: Request, res: Response) => {
    try {
      const dataRecord = saveWidgetDataSchema.parse(req.body);
      await widgetService.saveWidgetData(dataRecord);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving widget data:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid widget data',
          details: error.errors
        });
      } else {
        res.status(500).json({
          error: 'Failed to save widget data',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  // Get widget data
  app.get('/api/widgets/instances/:id/data', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid instance ID' });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const data = await widgetService.getWidgetData(id, limit);
      res.json(data);
    } catch (error) {
      console.error('Error getting widget data:', error);
      res.status(500).json({
        error: 'Failed to get widget data',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Clear widget data
  app.delete('/api/widgets/instances/:id/data', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid instance ID' });
      }

      const success = await widgetService.clearWidgetData(id);
      res.json({ success });
    } catch (error) {
      console.error('Error clearing widget data:', error);
      res.status(500).json({
        error: 'Failed to clear widget data',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Utility Routes

  // Get widget statistics
  app.get('/api/widgets/stats', async (req: Request, res: Response) => {
    try {
      const stats = await widgetService.getWidgetStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting widget stats:', error);
      res.status(500).json({
        error: 'Failed to get widget statistics',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Bulk import widget definitions (for built-in widgets)
  app.post('/api/widgets/definitions/bulk-import', async (req: Request, res: Response) => {
    try {
      const { definitions } = req.body;
      
      if (!Array.isArray(definitions)) {
        return res.status(400).json({ error: 'Definitions must be an array' });
      }

      const validatedDefinitions = definitions.map(def => 
        createWidgetDefinitionSchema.parse(def)
      );

      const created = await widgetService.bulkCreateWidgetDefinitions(validatedDefinitions);
      res.status(201).json({ 
        success: true, 
        count: created.length,
        definitions: created 
      });
    } catch (error) {
      console.error('Error bulk importing widget definitions:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid widget definition data',
          details: error.errors
        });
      } else {
        res.status(500).json({
          error: 'Failed to bulk import widget definitions',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
}