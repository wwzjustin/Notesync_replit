// Local storage utilities for client-side persistence
export interface LocalNote {
  id: string;
  title: string;
  content: string;
  folderId: string;
  providerId: string;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalFolder {
  id: string;
  name: string;
  providerId: string;
  parentId: string | null;
  noteCount: number;
}

const NOTES_KEY = 'notesync-notes';
const FOLDERS_KEY = 'notesync-folders';
const LAST_SYNC_KEY = 'notesync-last-sync';

export class LocalStorage {
  static getNotes(): LocalNote[] {
    try {
      const notes = localStorage.getItem(NOTES_KEY);
      return notes ? JSON.parse(notes) : [];
    } catch {
      return [];
    }
  }

  static saveNotes(notes: LocalNote[]): void {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Failed to save notes to localStorage:', error);
    }
  }

  static getFolders(): LocalFolder[] {
    try {
      const folders = localStorage.getItem(FOLDERS_KEY);
      return folders ? JSON.parse(folders) : [];
    } catch {
      return [];
    }
  }

  static saveFolders(folders: LocalFolder[]): void {
    try {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    } catch (error) {
      console.error('Failed to save folders to localStorage:', error);
    }
  }

  static getLastSync(): Date | null {
    try {
      const lastSync = localStorage.getItem(LAST_SYNC_KEY);
      return lastSync ? new Date(lastSync) : null;
    } catch {
      return null;
    }
  }

  static clear(): void {
    localStorage.removeItem(NOTES_KEY);
    localStorage.removeItem(FOLDERS_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
  }
}
