import type { FileSession, InsertFileSession } from "@shared/schema";

const API_BASE = "/api";

export const api = {
  sessions: {
    getAll: async (): Promise<FileSession[]> => {
      const response = await fetch(`${API_BASE}/sessions`);
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },

    get: async (id: number): Promise<FileSession> => {
      const response = await fetch(`${API_BASE}/sessions/${id}`);
      if (!response.ok) throw new Error("Failed to fetch session");
      return response.json();
    },

    create: async (data: InsertFileSession): Promise<FileSession> => {
      const response = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create session");
      return response.json();
    },

    update: async (id: number, data: Partial<InsertFileSession>): Promise<FileSession> => {
      const response = await fetch(`${API_BASE}/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update session");
      return response.json();
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${API_BASE}/sessions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete session");
    },
  },
};
