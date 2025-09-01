import { 
  type User, type InsertUser, type UpsertUser,
  type Provider, type InsertProvider,
  type Folder, type InsertFolder,
  type Note, type InsertNote,
  type ShareLink, type InsertShareLink,
  type ProviderConnection, type InsertProviderConnection
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, isNull } from "drizzle-orm";
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
  constructor() {
    // Database storage - no initialization needed
  }

  // Helper method to calculate note hierarchy level
  private async calculateNoteLevel(parentId: string | null): Promise<number> {
    if (!parentId) return 0;
    
    const parent = await this.getNote(parentId);
    if (!parent) return 0;
    
    return (parent.level || 0) + 1;
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
    let baseQuery = db.select().from(folders);
    
    if (parentId === null) {
      baseQuery = baseQuery.where(isNull(folders.parentId));
    } else {
      baseQuery = baseQuery.where(eq(folders.parentId, parentId));
    }
    
    if (providerId) {
      baseQuery = baseQuery.where(eq(folders.providerId, providerId));
    }
    
    return await baseQuery;
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
    try {
      // First delete all notes in this folder (including child notes)
      const folderNotes = await this.getNotes(id);
      for (const note of folderNotes) {
        await this.deleteNote(note.id);
      }
      
      // Then recursively delete any child folders
      const childFolders = await db.select().from(folders).where(eq(folders.parentId, id));
      for (const childFolder of childFolders) {
        await this.deleteFolder(childFolder.id);
      }
      
      // Finally, delete the folder itself
      await db.delete(folders).where(eq(folders.id, id));
    } catch (error) {
      console.error(`Error deleting folder ${id}:`, error);
      throw new Error(`Failed to delete folder: ${error}`);
    }
  }

  // Notes
  async getNotes(folderId?: string, providerId?: string): Promise<Note[]> {
    let baseQuery = db.select().from(notes);
    
    if (folderId) {
      baseQuery = baseQuery.where(eq(notes.folderId, folderId));
    }
    
    if (providerId) {
      baseQuery = baseQuery.where(eq(notes.providerId, providerId));
    }
    
    const result = await baseQuery;
    return result.sort((a, b) => (b.updatedAt || new Date(0)).getTime() - (a.updatedAt || new Date(0)).getTime());
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note || undefined;
  }

  async getNotesByParent(parentId: string | null): Promise<Note[]> {
    if (parentId === null) {
      return await db.select().from(notes).where(isNull(notes.parentId));
    } else {
      return await db.select().from(notes).where(eq(notes.parentId, parentId));
    }
  }

  async searchNotes(query: string, filters?: { providerId?: string; folderId?: string; locked?: boolean }): Promise<Note[]> {
    const lowerQuery = query.toLowerCase();
    let baseQuery = db.select().from(notes);
    
    // Apply text search
    baseQuery = baseQuery.where(
      sql`LOWER(${notes.title}) LIKE ${`%${lowerQuery}%`} OR LOWER(${notes.plainContent}) LIKE ${`%${lowerQuery}%`}`
    );

    if (filters?.providerId) {
      baseQuery = baseQuery.where(eq(notes.providerId, filters.providerId));
    }

    if (filters?.folderId) {
      baseQuery = baseQuery.where(eq(notes.folderId, filters.folderId));
    }

    if (filters?.locked !== undefined) {
      baseQuery = baseQuery.where(eq(notes.isLocked, filters.locked));
    }

    const result = await baseQuery;
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
    try {
      const [note] = await db.select().from(notes).where(eq(notes.id, id));
      if (!note) return;
      
      // First, delete any share links associated with this note
      await db.delete(shareLinks).where(eq(shareLinks.noteId, id));
      
      // Then, recursively delete all child notes
      const childNotes = await db.select().from(notes).where(eq(notes.parentId, id));
      for (const child of childNotes) {
        await this.deleteNote(child.id);
      }
      
      // Update folder note count
      if (note.folderId) {
        const [folder] = await db.select().from(folders).where(eq(folders.id, note.folderId));
        if (folder) {
          await this.updateFolder(note.folderId, { 
            noteCount: Math.max(0, (folder.noteCount || 0) - 1) 
          });
        }
      }
      
      // Finally, delete the note itself
      await db.delete(notes).where(eq(notes.id, id));
    } catch (error) {
      console.error(`Error deleting note ${id}:`, error);
      throw new Error(`Failed to delete note: ${error}`);
    }
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
