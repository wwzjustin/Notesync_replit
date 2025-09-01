import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertProviderSchema, 
  insertFolderSchema, 
  insertNoteSchema, 
  insertShareLinkSchema,
  type Note
} from "@shared/schema";
import { z } from "zod";

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

  // Provider connections for authenticated users
  app.get('/api/user/provider-connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getProviderConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching provider connections:", error);
      res.status(500).json({ message: "Failed to fetch provider connections" });
    }
  });

  app.post('/api/user/provider-connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connectionData = { ...req.body, userId };
      const connection = await storage.createProviderConnection(connectionData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating provider connection:", error);
      res.status(500).json({ message: "Failed to create provider connection" });
    }
  });
  // Providers
  app.get("/api/providers", async (req, res) => {
    try {
      const providers = await storage.getProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  app.post("/api/providers", async (req, res) => {
    try {
      const provider = insertProviderSchema.parse(req.body);
      const created = await storage.createProvider(provider);
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid provider data" });
    }
  });

  app.delete("/api/providers/:id", async (req, res) => {
    try {
      await storage.deleteProvider(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete provider" });
    }
  });

  // Folders
  app.get("/api/folders", async (req, res) => {
    try {
      const { providerId, parentId } = req.query;
      let folders;
      
      if (parentId !== undefined) {
        folders = await storage.getFoldersByParent(
          parentId === 'null' ? null : parentId as string,
          providerId as string
        );
      } else {
        folders = await storage.getFolders(providerId as string);
      }
      
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post("/api/folders", async (req, res) => {
    try {
      const folder = insertFolderSchema.parse(req.body);
      const created = await storage.createFolder(folder);
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid folder data" });
    }
  });

  app.put("/api/folders/:id", async (req, res) => {
    try {
      const updates = req.body;
      const updated = await storage.updateFolder(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update folder" });
    }
  });

  app.delete("/api/folders/:id", async (req, res) => {
    try {
      await storage.deleteFolder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // Notes
  app.get("/api/notes", async (req, res) => {
    try {
      const { folderId, providerId, search, parentId } = req.query;
      let notes;

      if (search) {
        const filters = {
          providerId: providerId as string,
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
          providerId as string
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

  app.post("/api/notes", async (req, res) => {
    try {
      const note = insertNoteSchema.parse(req.body);
      const created = await storage.createNote(note);
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid note data" });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    try {
      const updates = req.body;
      const updated = await storage.updateNote(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      await storage.deleteNote(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Update note hierarchy (parent-child relationships)
  app.put("/api/notes/:id/hierarchy", async (req, res) => {
    try {
      const { parentId } = req.body;
      
      // Calculate the proper level based on parent hierarchy
      let level = 0;
      if (parentId) {
        const parent = await storage.getNote(parentId);
        if (parent) {
          level = (parent.level || 0) + 1;
        }
      }
      
      const updates: Partial<Note> = { 
        parentId: parentId || null,
        level
      };
      const updated = await storage.updateNote(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update note hierarchy" });
    }
  });

  // Share Links
  app.get("/api/share-links/note/:noteId", async (req, res) => {
    try {
      const shareLinks = await storage.getShareLinksByNote(req.params.noteId);
      res.json(shareLinks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch share links" });
    }
  });

  app.post("/api/share-links", async (req, res) => {
    try {
      const shareLink = insertShareLinkSchema.parse(req.body);
      const created = await storage.createShareLink(shareLink);
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid share link data" });
    }
  });

  app.delete("/api/share-links/:id", async (req, res) => {
    try {
      await storage.deleteShareLink(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete share link" });
    }
  });

  // Public shared note access
  app.get("/shared/:noteId/:token", async (req, res) => {
    try {
      const { noteId, token } = req.params;
      const shareUrl = `${req.protocol}://${req.get('host')}/shared/${noteId}/${token}`;
      const shareLink = await storage.getShareLinkByUrl(shareUrl);
      
      if (!shareLink) {
        return res.status(404).json({ message: "Share link not found" });
      }
      
      if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
        return res.status(410).json({ message: "Share link has expired" });
      }
      
      const note = await storage.getNote(shareLink.noteId!);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Increment access count
      await storage.updateShareLink(shareLink.id, { 
        accessCount: (shareLink.accessCount || 0) + 1 
      });
      
      res.json({
        note: {
          id: note.id,
          title: note.title,
          content: note.content,
          plainContent: note.plainContent,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          wordCount: note.wordCount,
          characterCount: note.characterCount,
        },
        shareLink: {
          permissions: shareLink.permissions,
          expiresAt: shareLink.expiresAt,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to access shared note" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
