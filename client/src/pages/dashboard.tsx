import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { NoteList } from "@/components/note-list";
import { NoteEditor } from "@/components/note-editor";
import { ShareModal } from "@/components/share-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Grid3X3, Grid2X2, List, Circle } from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import type { Note } from "@shared/schema";

export type ViewMode = 'grid' | 'gallery' | 'list';

export default function Dashboard() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>("folder-icloud-notes");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>("provider-icloud");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [noteListWidth, setNoteListWidth] = useState(320);

  const { data: notes = [] } = useNotes(selectedFolderId, selectedProviderId, searchQuery);

  // Auto-select first note when folder changes
  useEffect(() => {
    if (notes.length > 0 && !selectedNote) {
      setSelectedNote(notes[0]);
    }
  }, [notes, selectedNote]);

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
  };

  const handleFolderSelect = (folderId: string, providerId: string) => {
    setSelectedFolderId(folderId);
    setSelectedProviderId(providerId);
    setSelectedNote(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-testid="input-search"]') as HTMLInputElement;
        searchInput?.focus();
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, []);

  return (
    <div className="h-screen flex flex-col dark">
      {/* Top Toolbar */}
      <div className="h-12 bg-gray-800 border-b border-separator flex items-center px-4 justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </div>
          <span className="text-sm font-medium text-white">NoteSync</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={handleSearch}
              className="bg-secondary text-white px-4 py-1.5 pl-8 rounded-lg text-sm w-64 border-none focus:ring-2 focus:ring-accent"
              data-testid="input-search"
            />
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex bg-secondary rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="px-2 py-1 h-auto"
              data-testid="button-view-grid"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'gallery' ? 'default' : 'ghost'}
              onClick={() => setViewMode('gallery')}
              className="px-2 py-1 h-auto"
              data-testid="button-view-gallery"
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="px-2 py-1 h-auto"
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Three-pane Layout */}
      <div className="flex-1 flex">
        <Sidebar
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          selectedFolderId={selectedFolderId}
          selectedProviderId={selectedProviderId}
          onFolderSelect={handleFolderSelect}
        />
        
        <NoteList
          width={noteListWidth}
          onWidthChange={setNoteListWidth}
          notes={notes}
          selectedNote={selectedNote}
          onNoteSelect={handleNoteSelect}
          viewMode={viewMode}
          selectedFolderId={selectedFolderId}
          selectedProviderId={selectedProviderId}
        />
        
        <NoteEditor
          note={selectedNote}
          onShare={() => setShowShareModal(true)}
          onNoteUpdate={(updatedNote) => setSelectedNote(updatedNote)}
        />
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
