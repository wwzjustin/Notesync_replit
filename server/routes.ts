import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertFolderSchema,
  insertNoteSchema,
  insertShareLinkSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Folders
  app.get("/api/folders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { parentId } = req.query;
      let folders;
      
      if (parentId !== undefined) {
        folders = await storage.getFoldersByParent(
          parentId === 'null' ? null : parentId as string,
          userId
        );
      } else {
        folders = await storage.getFolders(userId);
      }
      
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post("/api/folders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderData = { ...req.body, userId };
      const folder = insertFolderSchema.parse(folderData);
      const created = await storage.createFolder(folder);
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid folder data" });
    }
  });

  app.put("/api/folders/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      const updated = await storage.updateFolder(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update folder" });
    }
  });

  app.delete("/api/folders/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteFolder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // Notes
  app.get("/api/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { folderId, search, parentId } = req.query;
      let notes;

      if (search) {
        const filters = {
          userId: userId,
          folderId: folderId as string,
        };
        notes = await storage.searchNotes(search as string, filters);
      } else if (parentId !== undefined) {
        notes = await storage.getNotesByParent(
          parentId === 'null' ? null : parentId as string
        );
      } else {
        notes = await storage.getNotes(
          folderId as string,
          userId
        );
      }

      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });

  app.post("/api/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const noteData = { ...req.body, userId };
      const note = insertNoteSchema.parse(noteData);
      const created = await storage.createNote(note);
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid note data" });
    }
  });

  app.put("/api/notes/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      const updated = await storage.updateNote(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteNote(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  app.put("/api/notes/:id/hierarchy", isAuthenticated, async (req, res) => {
    try {
      const { parentId } = req.body;
      const updated = await storage.updateNote(req.params.id, { parentId });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update note hierarchy" });
    }
  });

  // Share Links
  app.get("/api/share/:url", async (req, res) => {
    try {
      const shareLink = await storage.getShareLinkByUrl(req.params.url);
      if (!shareLink) {
        return res.status(404).json({ message: "Share link not found" });
      }
      
      if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
        return res.status(410).json({ message: "Share link has expired" });
      }
      
      // Increment access count
      await storage.updateShareLink(shareLink.id, {
        accessCount: (shareLink.accessCount || 0) + 1
      });
      
      const note = await storage.getNote(shareLink.noteId!);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json({ note, permissions: shareLink.permissions });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared note" });
    }
  });

  app.post("/api/notes/:id/share", isAuthenticated, async (req, res) => {
    try {
      const noteId = req.params.id;
      const { permissions = "view", expiresAt } = req.body;
      const url = `share-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      
      const shareLink = insertShareLinkSchema.parse({
        noteId,
        url,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      
      const created = await storage.createShareLink(shareLink);
      res.json(created);
    } catch (error) {
      res.status(500).json({ message: "Failed to create share link" });
    }
  });

  app.get("/api/notes/:id/shares", isAuthenticated, async (req, res) => {
    try {
      const shareLinks = await storage.getShareLinksByNote(req.params.id);
      res.json(shareLinks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch share links" });
    }
  });

  app.delete("/api/shares/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteShareLink(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete share link" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}