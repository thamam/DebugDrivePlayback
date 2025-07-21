import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const dataSessions = pgTable("data_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  filePath: text("file_path").notNull(),
  filename: text("filename"),
  fileSize: integer("file_size"),
  duration: real("duration"),
  frequency: real("frequency"),
  signalCount: integer("signal_count"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vehicleData = pgTable("vehicle_data", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => dataSessions.id),
  timestamp: real("timestamp").notNull(),
  vehicleSpeed: real("vehicle_speed"),
  acceleration: real("acceleration"),
  steeringAngle: real("steering_angle"),
  positionX: real("position_x"),
  positionY: real("position_y"),
  collisionMargin: real("collision_margin"),
  plannedPathX: real("planned_path_x"),
  plannedPathY: real("planned_path_y"),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => dataSessions.id),
  timestamp: real("timestamp").notNull(),
  label: text("label").notNull(),
  color: text("color").notNull(),
});

export const plugins = pgTable("plugins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  version: text("version").notNull(),
  type: text("type").notNull(),
  configuration: text("configuration"), // JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

export const widgetDefinitions = pgTable("widget_definitions", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'visualization' | 'analysis' | 'data_source' | 'export'
  version: text("version").notNull(),
  inputs: text("inputs").notNull(), // JSON string
  outputs: text("outputs").notNull(), // JSON string
  configSchema: text("config_schema").notNull(), // JSON string
  implementation: text("implementation").notNull(), // JSON string
  isBuiltIn: boolean("is_built_in").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const widgetInstances = pgTable("widget_instances", {
  id: serial("id").primaryKey(),
  definitionId: integer("definition_id").references(() => widgetDefinitions.id),
  sessionId: integer("session_id").references(() => dataSessions.id),
  instanceId: text("instance_id").notNull().unique(),
  name: text("name").notNull(),
  config: text("config").notNull(), // JSON string
  status: text("status").notNull().default('active'), // 'active' | 'paused' | 'error' | 'stopped'
  position: text("position"), // JSON string for layout position
  size: text("size"), // JSON string for widget size
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const widgetData = pgTable("widget_data", {
  id: serial("id").primaryKey(),
  instanceId: integer("instance_id").references(() => widgetInstances.id),
  timestamp: real("timestamp").notNull(),
  inputData: text("input_data"), // JSON string
  outputData: text("output_data"), // JSON string
  error: text("error"),
  processingTime: real("processing_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDataSessionSchema = createInsertSchema(dataSessions).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleDataSchema = createInsertSchema(vehicleData).omit({
  id: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
});

export const insertPluginSchema = createInsertSchema(plugins).omit({
  id: true,
  createdAt: true,
});

export const insertWidgetDefinitionSchema = createInsertSchema(widgetDefinitions).omit({
  id: true,
  createdAt: true,
});

export const insertWidgetInstanceSchema = createInsertSchema(widgetInstances).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertWidgetDataSchema = createInsertSchema(widgetData).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DataSession = typeof dataSessions.$inferSelect;
export type InsertDataSession = z.infer<typeof insertDataSessionSchema>;
export type VehicleData = typeof vehicleData.$inferSelect;
export type InsertVehicleData = z.infer<typeof insertVehicleDataSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Plugin = typeof plugins.$inferSelect;
export type InsertPlugin = z.infer<typeof insertPluginSchema>;
export type WidgetDefinition = typeof widgetDefinitions.$inferSelect;
export type InsertWidgetDefinition = z.infer<typeof insertWidgetDefinitionSchema>;
export type WidgetInstance = typeof widgetInstances.$inferSelect;
export type InsertWidgetInstance = z.infer<typeof insertWidgetInstanceSchema>;
export type WidgetData = typeof widgetData.$inferSelect;
export type InsertWidgetData = z.infer<typeof insertWidgetDataSchema>;
