import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Plus, Lock, Paperclip, Folder, Trash2, MoreHorizontal } from "lucide-react";
import { useCreateNote, useUpdateNoteHierarchy, useDeleteNote } from "@/hooks/use-notes";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Note } from "@shared/schema";
import type { ViewMode } from "@/pages/dashboard";

type NoteWithChildren = Note & { children?: Note[] };

interface ChildNotesProps {
  notes: NoteWithChildren[];
  level: number;
  onNoteSelect?: (note: Note) => void;
  selectedNote?: Note | null;
  viewMode?: ViewMode;
  handleDragStart?: (e: React.DragEvent, noteId: string) => void;
  handleDragOver?: (e: React.DragEvent, targetId: string) => void;
  handleDragLeave?: () => void;
  handleDrop?: (e: React.DragEvent, targetId: string) => void;
  getNoteCardClass?: (note: Note, isChild?: boolean) => string;
  formatDate?: (date: Date) => string;
  deleteNoteMutation?: any;
}

const ChildNotes: React.FC<ChildNotesProps> = ({ 
  notes, 
  level, 
  onNoteSelect,
  selectedNote,
  viewMode = 'list',
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  getNoteCardClass,
  formatDate,
  deleteNoteMutation,
}) => {
  const maxLevel = 3;
  if (level > maxLevel) return null;

  const prefixSymbol = '└─'.repeat(level);

  return (
    <>
      {notes.map((note) => (
        <div key={note.id} className="mb-1">
          <div
            className={getNoteCardClass?.(note, true) || ''}
            draggable
            onDragStart={(e) => handleDragStart?.(e, note.id)}
            onDragOver={(e) => handleDragOver?.(e, note.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop?.(e, note.id)}
            data-testid={`note-${note.id}`}
          >
            <div className="flex-1" onClick={() => onNoteSelect?.(note)}>
              {viewMode === 'list' ? (
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium text-sm line-clamp-1 flex-1">
                      {prefixSymbol} {note.title}
                    </h4>
                    <span className="text-secondary text-xs ml-4 whitespace-nowrap">
                      {formatDate?.(note.updatedAt || note.createdAt || new Date())}
                    </span>
                  </div>
                  <p className="text-secondary text-xs note-preview mt-1 line-clamp-1">
                    {note.plainContent || "No content"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-medium text-sm line-clamp-2 flex-1">
                      {prefixSymbol} {note.title}
                    </h4>
                    <span className="text-secondary text-xs ml-2 whitespace-nowrap">
                      {formatDate?.(note.updatedAt || note.createdAt || new Date())}
                    </span>
                  </div>
                  
                  <p className="text-secondary text-xs note-preview mb-2 line-clamp-3 flex-1">
                    {note.plainContent || "No content"}
                  </p>
                </>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center space-x-1">
                {note.isLocked && (
                  <Lock className="h-3 w-3 text-secondary" data-testid="icon-note-locked" />
                )}
                {note.hasAttachments && (
                  <Paperclip className="h-3 w-3 text-secondary" data-testid="icon-note-attachment" />
                )}
                {deleteNoteMutation && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-white hover:bg-opacity-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-300"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Note</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{note.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteNoteMutation.mutate(note.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
          
          {/* Recursively render children */}
          {note.children && note.children.length > 0 && (
            <ChildNotes 
              notes={note.children} 
              level={level + 1}
              onNoteSelect={onNoteSelect}
              selectedNote={selectedNote}
              viewMode={viewMode}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              getNoteCardClass={getNoteCardClass}
              formatDate={formatDate}
              deleteNoteMutation={deleteNoteMutation}
            />
          )}
        </div>
      ))}
    </>
  );
};

interface NoteListProps {
  width: number;
  onWidthChange: (width: number) => void;
  notes: Note[];
  selectedNote: Note | null;
  onNoteSelect: (note: Note) => void;
  onNewNote: () => void;
  onToggleShare: () => void;
  viewMode: ViewMode;
  selectedFolderId: string | null;
  folderName: string;
}

export function NoteList({
  width,
  onWidthChange,
  notes,
  selectedNote,
  onNoteSelect,
  onNewNote,
  onToggleShare,
  viewMode,
  selectedFolderId,
  folderName,
}: NoteListProps) {
  const [sortBy, setSortBy] = useState('dateModified');
  const [dragOverNote, setDragOverNote] = useState<string | null>(null);
  const createNoteMutation = useCreateNote();
  const updateHierarchyMutation = useUpdateNoteHierarchy();
  const deleteNoteMutation = useDeleteNote();
  const { toast } = useToast();

  const handleResize = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      if (newWidth >= 200 && newWidth <= 500) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const createNewNote = async () => {
    if (!selectedFolderId) {
      toast({
        title: "Error",
        description: "Please select a folder first",
        variant: "destructive",
      });
      return;
    }

    try {
      const newNote = await createNoteMutation.mutateAsync({
        title: "Untitled Note",
        content: "",
        folderId: selectedFolderId,
        parentId: null,
        level: 0,
        isLocked: false,
        hasAttachments: false,
        tags: [],
      });

      onNoteSelect(newNote);
      toast({
        title: "Success",
        description: "New note created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData("text/plain", noteId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverNote(targetId);
  };

  const handleDragLeave = () => {
    setDragOverNote(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedNoteId = e.dataTransfer.getData("text/plain");
    setDragOverNote(null);
    
    if (draggedNoteId !== targetId) {
      updateHierarchyMutation.mutate({
        id: draggedNoteId,
        parentId: targetId === 'root' ? null : targetId,
      });
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  };

  const organizeNotesIntoHierarchy = (notes: Note[]): NoteWithChildren[] => {
    const noteMap = new Map<string, NoteWithChildren>();
    const rootNotes: NoteWithChildren[] = [];

    notes.forEach(note => {
      noteMap.set(note.id, { ...note, children: [] });
    });

    notes.forEach(note => {
      const noteWithChildren = noteMap.get(note.id)!;
      if (note.parentId && noteMap.has(note.parentId)) {
        const parent = noteMap.get(note.parentId)!;
        parent.children!.push(noteWithChildren);
      } else {
        rootNotes.push(noteWithChildren);
      }
    });

    return rootNotes;
  };

  const sortNotes = (notes: NoteWithChildren[]): NoteWithChildren[] => {
    const sorted = [...notes].sort((a, b) => {
      switch (sortBy) {
        case 'dateModified':
          return new Date(b.updatedAt || b.createdAt || 0).getTime() - 
                 new Date(a.updatedAt || a.createdAt || 0).getTime();
        case 'dateCreated':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return sorted.map(note => ({
      ...note,
      children: note.children ? sortNotes(note.children) : []
    }));
  };

  const getNoteCardClass = (note: Note, isChild: boolean = false) => {
    const baseClass = `group flex flex-col p-3 rounded-lg border transition-colors cursor-pointer`;
    const spacing = isChild ? 'ml-4' : '';
    
    if (viewMode === 'list') {
      return cn(
        baseClass,
        spacing,
        selectedNote?.id === note.id
          ? 'bg-accent border-accent-foreground'
          : 'bg-card border-border hover:bg-muted',
        dragOverNote === note.id && 'border-blue-500 bg-blue-50 dark:bg-blue-950'
      );
    } else {
      const heightClass = viewMode === 'gallery' ? 'h-32' : 'h-24';
      return cn(
        baseClass,
        heightClass,
        spacing,
        selectedNote?.id === note.id
          ? 'bg-accent border-accent-foreground'
          : 'bg-card border-border hover:bg-muted',
        dragOverNote === note.id && 'border-blue-500 bg-blue-50 dark:bg-blue-950'
      );
    }
  };

  const hierarchicalNotes = organizeNotesIntoHierarchy(notes);
  const sortedNotes = sortNotes(hierarchicalNotes);

  return (
    <div 
      className="flex flex-col h-full bg-card border-r border-border"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Folder className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">
              {folderName || "Notes"}
            </h2>
            <span className="text-sm text-muted-foreground">
              ({notes.length})
            </span>
          </div>
          <Button 
            onClick={createNewNote}
            size="sm"
            disabled={!selectedFolderId}
            data-testid="button-new-note"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full" data-testid="select-sort-by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dateModified">Date Modified</SelectItem>
            <SelectItem value="dateCreated">Date Created</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sortedNotes.length > 0 ? (
          <div
            onDragOver={(e) => handleDragOver(e, 'root')}
            onDrop={(e) => handleDrop(e, 'root')}
            className="space-y-2"
          >
            <ChildNotes 
              notes={sortedNotes}
              level={0}
              onNoteSelect={onNoteSelect}
              selectedNote={selectedNote}
              viewMode={viewMode}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              getNoteCardClass={getNoteCardClass}
              formatDate={formatDate}
              deleteNoteMutation={deleteNoteMutation}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Folder className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              {selectedFolderId ? "No notes in this folder yet." : "Select a folder to view notes."}
            </p>
            {selectedFolderId && (
              <Button 
                onClick={createNewNote}
                variant="outline"
                className="mt-4"
                data-testid="button-create-first-note"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first note
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="w-1 bg-transparent hover:bg-border cursor-col-resize absolute right-0 top-0 h-full"
        onMouseDown={handleResize}
        style={{ right: '-2px' }}
      />
    </div>
  );
}