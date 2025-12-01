import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSessionSchema, updateFileSessionSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/sessions", async (_req, res) => {
    try {
      const sessions = await storage.getAllFileSessions();
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getFileSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const validationResult = insertFileSessionSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ message: errorMessage });
      }
      
      const session = await storage.createFileSession(validationResult.data);
      res.status(201).json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validationResult = updateFileSessionSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ message: errorMessage });
      }

      const session = await storage.updateFileSession(id, validationResult.data);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFileSession(id);
      if (!success) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
