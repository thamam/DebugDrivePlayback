import { users, dataSessions, vehicleData, bookmarks, plugins, type User, type InsertUser, type DataSession, type InsertDataSession, type VehicleData, type InsertVehicleData, type Bookmark, type InsertBookmark, type Plugin, type InsertPlugin } from "@shared/schema";
import { db } from "./db-local";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Data session management
  createDataSession(session: InsertDataSession): Promise<DataSession>;
  getDataSession(id: number): Promise<DataSession | undefined>;
  getUserDataSessions(userId: number): Promise<DataSession[]>;
  updateDataSession(id: number, updates: Partial<DataSession>): Promise<DataSession>;
  deleteDataSession(id: number): Promise<boolean>;
  
  // Vehicle data management
  createVehicleData(data: InsertVehicleData): Promise<VehicleData>;
  getVehicleDataBySession(sessionId: number): Promise<VehicleData[]>;
  getVehicleDataByTimeRange(sessionId: number, startTime: number, endTime: number): Promise<VehicleData[]>;
  
  // Bookmark management
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  getBookmarksBySession(sessionId: number): Promise<Bookmark[]>;
  deleteBookmark(id: number): Promise<boolean>;
  
  // Plugin management
  createPlugin(plugin: InsertPlugin): Promise<Plugin>;
  getPlugins(): Promise<Plugin[]>;
  updatePlugin(id: number, updates: Partial<Plugin>): Promise<Plugin>;
  deletePlugin(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Data session management
  async createDataSession(session: InsertDataSession): Promise<DataSession> {
    const [dataSession] = await db
      .insert(dataSessions)
      .values(session)
      .returning();
    return dataSession;
  }

  async getDataSession(id: number): Promise<DataSession | undefined> {
    const [session] = await db.select().from(dataSessions).where(eq(dataSessions.id, id));
    return session || undefined;
  }

  async getUserDataSessions(userId: number): Promise<DataSession[]> {
    return await db.select().from(dataSessions).where(eq(dataSessions.userId, userId));
  }

  async updateDataSession(id: number, updates: Partial<DataSession>): Promise<DataSession> {
    const [session] = await db
      .update(dataSessions)
      .set(updates)
      .where(eq(dataSessions.id, id))
      .returning();
    return session;
  }

  async deleteDataSession(id: number): Promise<boolean> {
    const result = await db.delete(dataSessions).where(eq(dataSessions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Vehicle data management
  async createVehicleData(data: InsertVehicleData): Promise<VehicleData> {
    const [vehicleDataRecord] = await db
      .insert(vehicleData)
      .values(data)
      .returning();
    return vehicleDataRecord;
  }

  async getVehicleDataBySession(sessionId: number): Promise<VehicleData[]> {
    return await db.select().from(vehicleData).where(eq(vehicleData.sessionId, sessionId));
  }

  async getVehicleDataByTimeRange(sessionId: number, startTime: number, endTime: number): Promise<VehicleData[]> {
    return await db.select()
      .from(vehicleData)
      .where(and(
        eq(vehicleData.sessionId, sessionId),
        gte(vehicleData.timestamp, startTime),
        lte(vehicleData.timestamp, endTime)
      ));
  }

  // Bookmark management
  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const [bookmarkRecord] = await db
      .insert(bookmarks)
      .values(bookmark)
      .returning();
    return bookmarkRecord;
  }

  async getBookmarksBySession(sessionId: number): Promise<Bookmark[]> {
    return await db.select().from(bookmarks).where(eq(bookmarks.sessionId, sessionId));
  }

  async deleteBookmark(id: number): Promise<boolean> {
    const result = await db.delete(bookmarks).where(eq(bookmarks.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Plugin management
  async createPlugin(plugin: InsertPlugin): Promise<Plugin> {
    const [pluginRecord] = await db
      .insert(plugins)
      .values(plugin)
      .returning();
    return pluginRecord;
  }

  async getPlugins(): Promise<Plugin[]> {
    return await db.select().from(plugins);
  }

  async updatePlugin(id: number, updates: Partial<Plugin>): Promise<Plugin> {
    const [plugin] = await db
      .update(plugins)
      .set(updates)
      .where(eq(plugins.id, id))
      .returning();
    return plugin;
  }

  async deletePlugin(id: number): Promise<boolean> {
    const result = await db.delete(plugins).where(eq(plugins.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
