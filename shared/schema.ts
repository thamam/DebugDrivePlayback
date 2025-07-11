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
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  duration: real("duration").notNull(),
  frequency: real("frequency").notNull(),
  signalCount: integer("signal_count").notNull(),
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
