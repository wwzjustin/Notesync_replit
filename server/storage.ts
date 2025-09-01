import { 
  type User, type InsertUser, type UpsertUser,
  type Provider, type InsertProvider,
  type Folder, type InsertFolder,
  type Note, type InsertNote,
  type ShareLink, type InsertShareLink,
  type ProviderConnection, type InsertProviderConnection
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, providers, folders, notes, shareLinks, providerConnections } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Provider Connections
  getProviderConnections(userId: string): Promise<ProviderConnection[]>;
  createProviderConnection(connection: InsertProviderConnection): Promise<ProviderConnection>;
  updateProviderConnection(id: string, updates: Partial<ProviderConnection>): Promise<ProviderConnection>;
  deleteProviderConnection(id: string): Promise<void>;

  // Providers
  getProviders(): Promise<Provider[]>;
  getProvider(id: string): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  deleteProvider(id: string): Promise<void>;

  // Folders
  getFolders(providerId?: string): Promise<Folder[]>;
  getFolder(id: string): Promise<Folder | undefined>;
  getFoldersByParent(parentId: string | null, providerId?: string): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: string, updates: Partial<Folder>): Promise<Folder>;
  deleteFolder(id: string): Promise<void>;

  // Notes
  getNotes(folderId?: string, providerId?: string): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  getNotesByParent(parentId: string | null): Promise<Note[]>;
  searchNotes(query: string, filters?: { providerId?: string; folderId?: string; locked?: boolean }): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note>;
  deleteNote(id: string): Promise<void>;

  // Share Links
  getShareLink(id: string): Promise<ShareLink | undefined>;
  getShareLinkByUrl(url: string): Promise<ShareLink | undefined>;
  getShareLinksByNote(noteId: string): Promise<ShareLink[]>;
  createShareLink(shareLink: InsertShareLink): Promise<ShareLink>;
  updateShareLink(id: string, updates: Partial<ShareLink>): Promise<ShareLink>;
  deleteShareLink(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private providers: Map<string, Provider>;
  private folders: Map<string, Folder>;
  private notes: Map<string, Note>;
  private shareLinks: Map<string, ShareLink>;

  constructor() {
    this.providers = new Map();
    this.folders = new Map();
    this.notes = new Map();
    this.shareLinks = new Map();
    
    // Initialize with sample data on startup
    this.initializeSampleData();
  }

  // Helper method to calculate note hierarchy level
  private async calculateNoteLevel(parentId: string | null): Promise<number> {
    if (!parentId) return 0;
    
    const parent = await this.getNote(parentId);
    if (!parent) return 0;
    
    return (parent.level || 0) + 1;
  }

  private async initializeSampleData() {
    try {
      // Check if providers already exist
      const existingProviders = await db.select().from(providers);
      if (existingProviders.length > 0) return;

      // Create sample providers
      const sampleProviders = [
        {
          id: "provider-icloud",
          name: "iCloud",
          type: "icloud",
          userId: null,
          isActive: true,
        },
        {
          id: "provider-google", 
          name: "Google",
          type: "google",
          userId: null,
          isActive: true,
        },
        {
          id: "provider-exchange",
          name: "Exchange", 
          type: "exchange",
          userId: null,
          isActive: true,
        }
      ];

      await db.insert(providers).values(sampleProviders);

      // Populate in-memory provider maps for hybrid storage
      sampleProviders.forEach(provider => {
        this.providers.set(provider.id, {
          ...provider,
          createdAt: new Date()
        });
      });

      // Create sample folders
      const sampleFolders = [
        {
          id: "folder-icloud-all",
          name: "All iCloud",
          providerId: "provider-icloud",
          parentId: null,
          path: "/All iCloud",
          level: 0,
        },
        {
          id: "folder-icloud-notes", 
          name: "Notes",
          providerId: "provider-icloud",
          parentId: null,
          path: "/Notes",
          level: 0,
        },
        {
          id: "folder-icloud-medical",
          name: "Medical", 
          providerId: "provider-icloud",
          parentId: null,
          path: "/Medical",
          level: 0,
        },
        {
          id: "folder-icloud-tech",
          name: "Tech",
          providerId: "provider-icloud", 
          parentId: null,
          path: "/Tech",
          level: 0,
        },
        {
          id: "folder-google-notes",
          name: "Notes",
          providerId: "provider-google",
          parentId: null, 
          path: "/Notes",
          level: 0,
        },
        {
          id: "folder-exchange-notes",
          name: "Notes",
          providerId: "provider-exchange",
          parentId: null,
          path: "/Notes", 
          level: 0,
        },
      ];

      await db.insert(folders).values(sampleFolders);

      // Populate in-memory folder maps for hybrid storage
      sampleFolders.forEach(folder => {
        this.folders.set(folder.id, {
          ...folder,
          noteCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    } catch (error) {
      console.log("Sample data already exists or initialization failed:", error);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Provider Connections
  async getProviderConnections(userId: string): Promise<ProviderConnection[]> {
    return await db.select().from(providerConnections).where(eq(providerConnections.userId, userId));
  }

  async createProviderConnection(connection: InsertProviderConnection): Promise<ProviderConnection> {
    const [newConnection] = await db
      .insert(providerConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async updateProviderConnection(id: string, updates: Partial<ProviderConnection>): Promise<ProviderConnection> {
    const [updated] = await db
      .update(providerConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(providerConnections.id, id))
      .returning();
    return updated;
  }

  async deleteProviderConnection(id: string): Promise<void> {
    await db.delete(providerConnections).where(eq(providerConnections.id, id));
  }

  // Providers
  async getProviders(): Promise<Provider[]> {
    return await db.select().from(providers);
  }

  async getProvider(id: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider || undefined;
  }

  async createProvider(insertProvider: InsertProvider): Promise<Provider> {
    const [provider] = await db
      .insert(providers)
      .values(insertProvider)
      .returning();
    return provider;
  }

  async deleteProvider(id: string): Promise<void> {
    await db.delete(providers).where(eq(providers.id, id));
  }

  // Folders
  async getFolders(providerId?: string): Promise<Folder[]> {
    if (providerId) {
      return await db.select().from(folders).where(eq(folders.providerId, providerId));
    }
    return await db.select().from(folders);
  }

  async getFolder(id: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    return folder || undefined;
  }

  async getFoldersByParent(parentId: string | null, providerId?: string): Promise<Folder[]> {
    let query = db.select().from(folders);
    
    if (parentId === null) {
      query = query.where(sql`${folders.parentId} IS NULL`);
    } else {
      query = query.where(eq(folders.parentId, parentId));
    }
    
    if (providerId) {
      query = query.where(eq(folders.providerId, providerId));
    }
    
    return await query;
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const [folder] = await db
      .insert(folders)
      .values(insertFolder)
      .returning();
    return folder;
  }

  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder> {
    const [folder] = await db
      .update(folders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(folders.id, id))
      .returning();
    return folder;
  }

  async deleteFolder(id: string): Promise<void> {
    await db.delete(folders).where(eq(folders.id, id));
  }

  // Notes
  async getNotes(folderId?: string, providerId?: string): Promise<Note[]> {
    let query = db.select().from(notes);
    
    if (folderId) {
      query = query.where(eq(notes.folderId, folderId));
    }
    
    if (providerId) {
      query = query.where(eq(notes.providerId, providerId));
    }
    
    const result = await query;
    return result.sort((a, b) => (b.updatedAt || new Date(0)).getTime() - (a.updatedAt || new Date(0)).getTime());
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note || undefined;
  }

  async getNotesByParent(parentId: string | null): Promise<Note[]> {
    if (parentId === null) {
      return await db.select().from(notes).where(sql`${notes.parentId} IS NULL`);
    } else {
      return await db.select().from(notes).where(eq(notes.parentId, parentId));
    }
  }

  async searchNotes(query: string, filters?: { providerId?: string; folderId?: string; locked?: boolean }): Promise<Note[]> {
    const lowerQuery = query.toLowerCase();
    let dbQuery = db.select().from(notes);
    
    // Apply text search
    dbQuery = dbQuery.where(
      sql`LOWER(${notes.title}) LIKE ${`%${lowerQuery}%`} OR LOWER(${notes.plainContent}) LIKE ${`%${lowerQuery}%`}`
    );

    if (filters?.providerId) {
      dbQuery = dbQuery.where(eq(notes.providerId, filters.providerId));
    }

    if (filters?.folderId) {
      dbQuery = dbQuery.where(eq(notes.folderId, filters.folderId));
    }

    if (filters?.locked !== undefined) {
      dbQuery = dbQuery.where(eq(notes.isLocked, filters.locked));
    }

    const result = await dbQuery;
    return result.sort((a, b) => (b.updatedAt || new Date(0)).getTime() - (a.updatedAt || new Date(0)).getTime());
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const plainContent = typeof insertNote.content === 'string' ? insertNote.content : JSON.stringify(insertNote.content);
    const wordCount = plainContent ? plainContent.split(/\s+/).length : 0;
    const characterCount = plainContent ? plainContent.length : 0;
    const level = await this.calculateNoteLevel(insertNote.parentId || null);
    
    const [note] = await db
      .insert(notes)
      .values({
        ...insertNote,
        plainContent,
        wordCount,
        characterCount,
        level,
      })
      .returning();

    // Update folder note count
    if (note.folderId) {
      const [folder] = await db.select().from(folders).where(eq(folders.id, note.folderId));
      if (folder) {
        await this.updateFolder(note.folderId, { 
          noteCount: (folder.noteCount || 0) + 1 
        });
      }
    }

    return note;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    let updateData: any = { ...updates, updatedAt: new Date() };

    if (updates.content) {
      const plainContent = typeof updates.content === 'string' ? updates.content : JSON.stringify(updates.content);
      updateData.plainContent = plainContent;
      updateData.wordCount = plainContent ? plainContent.split(/\s+/).length : 0;
      updateData.characterCount = plainContent ? plainContent.length : 0;
    }

    const [note] = await db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, id))
      .returning();
    return note;
  }

  async deleteNote(id: string): Promise<void> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    if (note?.folderId) {
      const [folder] = await db.select().from(folders).where(eq(folders.id, note.folderId));
      if (folder) {
        await this.updateFolder(note.folderId, { 
          noteCount: Math.max(0, (folder.noteCount || 0) - 1) 
        });
      }
    }
    await db.delete(notes).where(eq(notes.id, id));
  }

  // Share Links
  async getShareLink(id: string): Promise<ShareLink | undefined> {
    const [shareLink] = await db.select().from(shareLinks).where(eq(shareLinks.id, id));
    return shareLink || undefined;
  }

  async getShareLinkByUrl(url: string): Promise<ShareLink | undefined> {
    const [shareLink] = await db.select().from(shareLinks).where(eq(shareLinks.url, url));
    return shareLink || undefined;
  }

  async getShareLinksByNote(noteId: string): Promise<ShareLink[]> {
    return await db.select().from(shareLinks).where(eq(shareLinks.noteId, noteId));
  }

  async createShareLink(insertShareLink: InsertShareLink): Promise<ShareLink> {
    const [shareLink] = await db
      .insert(shareLinks)
      .values(insertShareLink)
      .returning();
    return shareLink;
  }

  async updateShareLink(id: string, updates: Partial<ShareLink>): Promise<ShareLink> {
    const [shareLink] = await db
      .update(shareLinks)
      .set(updates)
      .where(eq(shareLinks.id, id))
      .returning();
    return shareLink;
  }

  async deleteShareLink(id: string): Promise<void> {
    await db.delete(shareLinks).where(eq(shareLinks.id, id));
  }
}

export const storage = new DatabaseStorage();
