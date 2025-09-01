import { 
  type User, type InsertUser,
  type Provider, type InsertProvider,
  type Folder, type InsertFolder,
  type Note, type InsertNote,
  type ShareLink, type InsertShareLink
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
  deleteShareLink(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private providers: Map<string, Provider>;
  private folders: Map<string, Folder>;
  private notes: Map<string, Note>;
  private shareLinks: Map<string, ShareLink>;

  constructor() {
    this.users = new Map();
    this.providers = new Map();
    this.folders = new Map();
    this.notes = new Map();
    this.shareLinks = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample providers
    const icloudProvider: Provider = {
      id: "provider-icloud",
      name: "iCloud",
      type: "icloud",
      userId: null,
      isActive: true,
      createdAt: new Date(),
    };

    const googleProvider: Provider = {
      id: "provider-google",
      name: "Google",
      type: "google",
      userId: null,
      isActive: true,
      createdAt: new Date(),
    };

    const exchangeProvider: Provider = {
      id: "provider-exchange",
      name: "Exchange",
      type: "exchange",
      userId: null,
      isActive: true,
      createdAt: new Date(),
    };

    this.providers.set(icloudProvider.id, icloudProvider);
    this.providers.set(googleProvider.id, googleProvider);
    this.providers.set(exchangeProvider.id, exchangeProvider);

    // Create sample folders
    const folders: Folder[] = [
      {
        id: "folder-icloud-all",
        name: "All iCloud",
        providerId: "provider-icloud",
        parentId: null,
        path: "/All iCloud",
        level: 0,
        noteCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "folder-icloud-notes",
        name: "Notes",
        providerId: "provider-icloud",
        parentId: null,
        path: "/Notes",
        level: 0,
        noteCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "folder-icloud-medical",
        name: "Medical",
        providerId: "provider-icloud",
        parentId: null,
        path: "/Medical",
        level: 0,
        noteCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "folder-icloud-tech",
        name: "Tech",
        providerId: "provider-icloud",
        parentId: null,
        path: "/Tech",
        level: 0,
        noteCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "folder-google-notes",
        name: "Notes",
        providerId: "provider-google",
        parentId: null,
        path: "/Notes",
        level: 0,
        noteCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "folder-exchange-notes",
        name: "Notes",
        providerId: "provider-exchange",
        parentId: null,
        path: "/Notes",
        level: 0,
        noteCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    folders.forEach(folder => this.folders.set(folder.id, folder));
  }

  // Users
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

  // Providers
  async getProviders(): Promise<Provider[]> {
    return Array.from(this.providers.values());
  }

  async getProvider(id: string): Promise<Provider | undefined> {
    return this.providers.get(id);
  }

  async createProvider(insertProvider: InsertProvider): Promise<Provider> {
    const id = randomUUID();
    const provider: Provider = {
      ...insertProvider,
      id,
      createdAt: new Date(),
    };
    this.providers.set(id, provider);
    return provider;
  }

  async deleteProvider(id: string): Promise<void> {
    this.providers.delete(id);
  }

  // Folders
  async getFolders(providerId?: string): Promise<Folder[]> {
    const folders = Array.from(this.folders.values());
    if (providerId) {
      return folders.filter(folder => folder.providerId === providerId);
    }
    return folders;
  }

  async getFolder(id: string): Promise<Folder | undefined> {
    return this.folders.get(id);
  }

  async getFoldersByParent(parentId: string | null, providerId?: string): Promise<Folder[]> {
    const folders = Array.from(this.folders.values()).filter(
      folder => folder.parentId === parentId
    );
    if (providerId) {
      return folders.filter(folder => folder.providerId === providerId);
    }
    return folders;
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const id = randomUUID();
    const folder: Folder = {
      ...insertFolder,
      id,
      noteCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.folders.set(id, folder);
    return folder;
  }

  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder> {
    const folder = this.folders.get(id);
    if (!folder) {
      throw new Error(`Folder with id ${id} not found`);
    }
    const updatedFolder = { ...folder, ...updates, updatedAt: new Date() };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }

  async deleteFolder(id: string): Promise<void> {
    this.folders.delete(id);
  }

  // Notes
  async getNotes(folderId?: string, providerId?: string): Promise<Note[]> {
    const notes = Array.from(this.notes.values());
    let filtered = notes;
    
    if (folderId) {
      filtered = filtered.filter(note => note.folderId === folderId);
    }
    
    if (providerId) {
      filtered = filtered.filter(note => note.providerId === providerId);
    }
    
    return filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async getNotesByParent(parentId: string | null): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      note => note.parentId === parentId
    );
  }

  async searchNotes(query: string, filters?: { providerId?: string; folderId?: string; locked?: boolean }): Promise<Note[]> {
    const notes = Array.from(this.notes.values());
    const lowerQuery = query.toLowerCase();
    
    let filtered = notes.filter(note => 
      note.title.toLowerCase().includes(lowerQuery) ||
      note.plainContent?.toLowerCase().includes(lowerQuery)
    );

    if (filters?.providerId) {
      filtered = filtered.filter(note => note.providerId === filters.providerId);
    }

    if (filters?.folderId) {
      filtered = filtered.filter(note => note.folderId === filters.folderId);
    }

    if (filters?.locked !== undefined) {
      filtered = filtered.filter(note => note.isLocked === filters.locked);
    }

    return filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const plainContent = typeof insertNote.content === 'string' ? insertNote.content : JSON.stringify(insertNote.content);
    const wordCount = plainContent ? plainContent.split(/\s+/).length : 0;
    const characterCount = plainContent ? plainContent.length : 0;
    
    const note: Note = {
      ...insertNote,
      id,
      plainContent,
      wordCount,
      characterCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notes.set(id, note);

    // Update folder note count
    if (note.folderId) {
      const folder = this.folders.get(note.folderId);
      if (folder) {
        await this.updateFolder(note.folderId, { 
          noteCount: (folder.noteCount || 0) + 1 
        });
      }
    }

    return note;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const note = this.notes.get(id);
    if (!note) {
      throw new Error(`Note with id ${id} not found`);
    }

    let plainContent = note.plainContent;
    let wordCount = note.wordCount;
    let characterCount = note.characterCount;

    if (updates.content) {
      plainContent = typeof updates.content === 'string' ? updates.content : JSON.stringify(updates.content);
      wordCount = plainContent ? plainContent.split(/\s+/).length : 0;
      characterCount = plainContent ? plainContent.length : 0;
    }

    const updatedNote = { 
      ...note, 
      ...updates, 
      plainContent,
      wordCount,
      characterCount,
      updatedAt: new Date() 
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<void> {
    const note = this.notes.get(id);
    if (note?.folderId) {
      const folder = this.folders.get(note.folderId);
      if (folder) {
        await this.updateFolder(note.folderId, { 
          noteCount: Math.max(0, (folder.noteCount || 0) - 1) 
        });
      }
    }
    this.notes.delete(id);
  }

  // Share Links
  async getShareLink(id: string): Promise<ShareLink | undefined> {
    return this.shareLinks.get(id);
  }

  async getShareLinkByUrl(url: string): Promise<ShareLink | undefined> {
    return Array.from(this.shareLinks.values()).find(link => link.url === url);
  }

  async getShareLinksByNote(noteId: string): Promise<ShareLink[]> {
    return Array.from(this.shareLinks.values()).filter(link => link.noteId === noteId);
  }

  async createShareLink(insertShareLink: InsertShareLink): Promise<ShareLink> {
    const id = randomUUID();
    const shareLink: ShareLink = {
      ...insertShareLink,
      id,
      accessCount: 0,
      createdAt: new Date(),
    };
    this.shareLinks.set(id, shareLink);
    return shareLink;
  }

  async deleteShareLink(id: string): Promise<void> {
    this.shareLinks.delete(id);
  }
}

export const storage = new MemStorage();
