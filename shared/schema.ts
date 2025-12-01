import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const fileSessions = pgTable("file_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  headers: jsonb("headers").$type<string[]>().notNull(),
  data: jsonb("data").$type<any[][]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFileSessionSchema = createInsertSchema(fileSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFileSessionSchema = insertFileSessionSchema.partial();

export type InsertFileSession = z.infer<typeof insertFileSessionSchema>;
export type FileSession = typeof fileSessions.$inferSelect;
