import { 
  type User, 
  type InsertUser,
  type FileSession,
  type InsertFileSession,
  users,
  fileSessions
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createFileSession(session: InsertFileSession): Promise<FileSession>;
  getAllFileSessions(): Promise<FileSession[]>;
  getFileSession(id: number): Promise<FileSession | undefined>;
  updateFileSession(id: number, updates: Partial<InsertFileSession>): Promise<FileSession | undefined>;
  deleteFileSession(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<number, FileSession>;
  private nextSessionId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.nextSessionId = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createFileSession(session: InsertFileSession): Promise<FileSession> {
    const id = this.nextSessionId++;
    const now = new Date();
    const fileSession: FileSession = {
      id,
      title: session.title,
      fileName: session.fileName,
      headers: session.headers as string[],
      data: session.data as any[][],
      createdAt: now,
      updatedAt: now
    };
    this.sessions.set(id, fileSession);
    return fileSession;
  }

  async getAllFileSessions(): Promise<FileSession[]> {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getFileSession(id: number): Promise<FileSession | undefined> {
    return this.sessions.get(id);
  }

  async updateFileSession(id: number, updates: Partial<InsertFileSession>): Promise<FileSession | undefined> {
    const existing = this.sessions.get(id);
    if (!existing) return undefined;
    
    const updated: FileSession = {
      id: existing.id,
      title: updates.title ?? existing.title,
      fileName: updates.fileName ?? existing.fileName,
      headers: (updates.headers ?? existing.headers) as string[],
      data: (updates.data ?? existing.data) as any[][],
      createdAt: existing.createdAt,
      updatedAt: new Date()
    };
    this.sessions.set(id, updated);
    return updated;
  }

  async deleteFileSession(id: number): Promise<boolean> {
    return this.sessions.delete(id);
  }
}

export class DBStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createFileSession(session: InsertFileSession): Promise<FileSession> {
    const result = await db.insert(fileSessions).values(session).returning();
    return result[0];
  }

  async getAllFileSessions(): Promise<FileSession[]> {
    return await db.select().from(fileSessions).orderBy(desc(fileSessions.createdAt));
  }

  async getFileSession(id: number): Promise<FileSession | undefined> {
    const result = await db.select().from(fileSessions).where(eq(fileSessions.id, id)).limit(1);
    return result[0];
  }

  async updateFileSession(id: number, updates: Partial<InsertFileSession>): Promise<FileSession | undefined> {
    const result = await db
      .update(fileSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fileSessions.id, id))
      .returning();
    return result[0];
  }

  async deleteFileSession(id: number): Promise<boolean> {
    const result = await db.delete(fileSessions).where(eq(fileSessions.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = process.env.DATABASE_URL ? new DBStorage() : new MemStorage();
