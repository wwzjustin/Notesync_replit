import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { NoteList } from "@/components/note-list";
import { NoteEditor } from "@/components/note-editor";
import { ShareModal } from "@/components/share-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Grid3X3, Grid2X2, List, Circle, LogOut, User } from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { useAuth } from "@/hooks/useAuth";
import { useFolders } from "@/hooks/use-folders";
import type { Note } from "@shared/schema";

export type ViewMode = 'grid' | 'gallery' | 'list';

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [noteListWidth, setNoteListWidth] = useState(320);

  // Fetch folders and notes
  const { data: folders = [] } = useFolders();
  const { data: notes = [] } = useNotes(selectedFolderId, searchQuery);

  // Auto-select first available folder
  useEffect(() => {
    if (folders.length > 0 && !selectedFolderId) {
      const firstFolder = folders[0];
      setSelectedFolderId(firstFolder.id);
    }
  }, [folders, selectedFolderId]);

  // Auto-select first note when folder changes
  useEffect(() => {
    if (notes.length > 0 && !selectedNote) {
      setSelectedNote(notes[0]);
    }
  }, [notes, selectedNote]);

  // Handle edge case when selected note is deleted
  useEffect(() => {
    if (selectedNote && notes.length > 0) {
      const noteExists = notes.some(note => note.id === selectedNote.id);
      if (!noteExists) {
        setSelectedNote(notes[0] || null);
      }
    } else if (selectedNote && notes.length === 0) {
      setSelectedNote(null);
    }
  }, [notes, selectedNote]);

  // Handle edge case when selected folder is deleted
  useEffect(() => {
    if (selectedFolderId && folders.length > 0) {
      const folderExists = folders.some(folder => folder.id === selectedFolderId);
      if (!folderExists) {
        setSelectedFolderId(folders[0]?.id || null);
        setSelectedNote(null);
      }
    } else if (selectedFolderId && folders.length === 0) {
      setSelectedFolderId(null);
      setSelectedNote(null);
    }
  }, [folders, selectedFolderId]);

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedNote(null); // Clear selected note when changing folders
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
  };

  const handleNewNote = () => {
    // This will be handled by the NoteList component
  };

  const handleToggleShare = () => {
    setShowShareModal(!showShareModal);
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const currentFolder = folders.find(f => f.id === selectedFolderId);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
        selectedFolderId={selectedFolderId}
        onFolderSelect={handleFolderSelect}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-input focus:border-ring"
                data-testid="input-search"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                data-testid="button-view-grid"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'gallery' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('gallery')}
                data-testid="button-view-gallery"
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                data-testid="button-view-list"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span data-testid="text-user-name">
                  {user.firstName || user.email}
                </span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          {/* Note List */}
          <div className="flex-shrink-0 border-r border-border">
            <NoteList
              notes={notes}
              selectedNote={selectedNote}
              onNoteSelect={handleNoteSelect}
              onNewNote={handleNewNote}
              onToggleShare={handleToggleShare}
              viewMode={viewMode}
              width={noteListWidth}
              onWidthChange={setNoteListWidth}
              selectedFolderId={selectedFolderId}
              folderName={currentFolder?.name || ""}
            />
          </div>

          {/* Note Editor */}
          <div className="flex-1 min-w-0">
            {selectedNote ? (
              <NoteEditor
                note={selectedNote}
                onNoteChange={setSelectedNote}
                onToggleShare={handleToggleShare}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Circle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Select a note to start editing</p>
                  <p className="text-sm mt-2">
                    {selectedFolderId ? "Choose a note from the list" : "Create a folder first to start organizing your notes"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && selectedNote && (
        <ShareModal
          note={selectedNote}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}