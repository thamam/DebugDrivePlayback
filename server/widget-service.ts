/**
 * Widget Service - Database operations for widget persistence
 */

import { db } from "./db";
import { widgetDefinitions, widgetInstances, widgetData, type InsertWidgetDefinition, type InsertWidgetInstance, type InsertWidgetData, type WidgetDefinition, type WidgetInstance } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export class WidgetService {
  
  // Widget Definitions
  async createWidgetDefinition(definition: InsertWidgetDefinition): Promise<WidgetDefinition> {
    const [created] = await db.insert(widgetDefinitions).values(definition).returning();
    return created;
  }

  async getWidgetDefinitions(): Promise<WidgetDefinition[]> {
    return await db.select().from(widgetDefinitions).orderBy(desc(widgetDefinitions.createdAt));
  }

  async getWidgetDefinitionById(id: number): Promise<WidgetDefinition | null> {
    const [definition] = await db.select().from(widgetDefinitions).where(eq(widgetDefinitions.id, id));
    return definition || null;
  }

  async getWidgetDefinitionByTemplateId(templateId: string): Promise<WidgetDefinition | null> {
    const [definition] = await db.select().from(widgetDefinitions).where(eq(widgetDefinitions.templateId, templateId));
    return definition || null;
  }

  async updateWidgetDefinition(id: number, updates: Partial<InsertWidgetDefinition>): Promise<WidgetDefinition | null> {
    const [updated] = await db.update(widgetDefinitions)
      .set(updates)
      .where(eq(widgetDefinitions.id, id))
      .returning();
    return updated || null;
  }

  async deleteWidgetDefinition(id: number): Promise<boolean> {
    const result = await db.delete(widgetDefinitions).where(eq(widgetDefinitions.id, id));
    return result.rowCount > 0;
  }

  // Widget Instances
  async createWidgetInstance(instance: InsertWidgetInstance): Promise<WidgetInstance> {
    const [created] = await db.insert(widgetInstances).values(instance).returning();
    return created;
  }

  async getWidgetInstances(sessionId?: number): Promise<WidgetInstance[]> {
    const query = db.select().from(widgetInstances);
    
    if (sessionId) {
      return await query.where(eq(widgetInstances.sessionId, sessionId)).orderBy(desc(widgetInstances.createdAt));
    }
    
    return await query.orderBy(desc(widgetInstances.createdAt));
  }

  async getWidgetInstanceById(id: number): Promise<WidgetInstance | null> {
    const [instance] = await db.select().from(widgetInstances).where(eq(widgetInstances.id, id));
    return instance || null;
  }

  async getWidgetInstanceByInstanceId(instanceId: string): Promise<WidgetInstance | null> {
    const [instance] = await db.select().from(widgetInstances).where(eq(widgetInstances.instanceId, instanceId));
    return instance || null;
  }

  async updateWidgetInstance(id: number, updates: Partial<InsertWidgetInstance>): Promise<WidgetInstance | null> {
    const updateData = {
      ...updates,
      lastUpdated: new Date()
    };
    
    const [updated] = await db.update(widgetInstances)
      .set(updateData)
      .where(eq(widgetInstances.id, id))
      .returning();
    return updated || null;
  }

  async updateWidgetInstanceByInstanceId(instanceId: string, updates: Partial<InsertWidgetInstance>): Promise<WidgetInstance | null> {
    const updateData = {
      ...updates,
      lastUpdated: new Date()
    };
    
    const [updated] = await db.update(widgetInstances)
      .set(updateData)
      .where(eq(widgetInstances.instanceId, instanceId))
      .returning();
    return updated || null;
  }

  async deleteWidgetInstance(id: number): Promise<boolean> {
    // Delete related data first
    await db.delete(widgetData).where(eq(widgetData.instanceId, id));
    
    // Delete instance
    const result = await db.delete(widgetInstances).where(eq(widgetInstances.id, id));
    return result.rowCount > 0;
  }

  async deleteWidgetInstanceByInstanceId(instanceId: string): Promise<boolean> {
    // Get instance to find ID
    const instance = await this.getWidgetInstanceByInstanceId(instanceId);
    if (!instance) return false;
    
    return await this.deleteWidgetInstance(instance.id);
  }

  // Widget Data
  async saveWidgetData(data: InsertWidgetData): Promise<void> {
    await db.insert(widgetData).values(data);
  }

  async getWidgetData(instanceId: number, limit: number = 100): Promise<any[]> {
    return await db.select()
      .from(widgetData)
      .where(eq(widgetData.instanceId, instanceId))
      .orderBy(desc(widgetData.timestamp))
      .limit(limit);
  }

  async getWidgetDataInRange(
    instanceId: number, 
    startTime: number, 
    endTime: number
  ): Promise<any[]> {
    return await db.select()
      .from(widgetData)
      .where(
        and(
          eq(widgetData.instanceId, instanceId),
          // Note: These comparisons assume timestamp is stored as real (float)
          // You might need to adjust based on your timestamp format
        )
      )
      .orderBy(widgetData.timestamp);
  }

  async clearWidgetData(instanceId: number): Promise<boolean> {
    const result = await db.delete(widgetData).where(eq(widgetData.instanceId, instanceId));
    return result.rowCount > 0;
  }

  // Bulk operations
  async bulkCreateWidgetDefinitions(definitions: InsertWidgetDefinition[]): Promise<WidgetDefinition[]> {
    return await db.insert(widgetDefinitions).values(definitions).returning();
  }

  async getWidgetInstancesWithDefinitions(sessionId?: number): Promise<any[]> {
    const query = db.select({
      instance: widgetInstances,
      definition: widgetDefinitions
    })
    .from(widgetInstances)
    .leftJoin(widgetDefinitions, eq(widgetInstances.definitionId, widgetDefinitions.id));

    if (sessionId) {
      return await query.where(eq(widgetInstances.sessionId, sessionId)).orderBy(desc(widgetInstances.createdAt));
    }

    return await query.orderBy(desc(widgetInstances.createdAt));
  }

  // Utility methods
  async getWidgetStats(): Promise<{
    totalDefinitions: number;
    totalInstances: number;
    activeInstances: number;
    totalDataPoints: number;
  }> {
    const [definitionsCount] = await db.select({ count: "count(*)" }).from(widgetDefinitions);
    const [instancesCount] = await db.select({ count: "count(*)" }).from(widgetInstances);
    const [activeInstancesCount] = await db.select({ count: "count(*)" })
      .from(widgetInstances)
      .where(eq(widgetInstances.status, 'active'));
    const [dataPointsCount] = await db.select({ count: "count(*)" }).from(widgetData);

    return {
      totalDefinitions: parseInt(definitionsCount.count as string),
      totalInstances: parseInt(instancesCount.count as string),
      activeInstances: parseInt(activeInstancesCount.count as string),
      totalDataPoints: parseInt(dataPointsCount.count as string)
    };
  }

  async cleanupOldData(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db.delete(widgetData)
      .where(
        // Assuming createdAt is a timestamp column
        // You might need to adjust this based on your exact schema
      );

    return result.rowCount;
  }
}

// Export singleton instance
export const widgetService = new WidgetService();