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
import { Apple } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { Mail } from "lucide-react";
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
  deleteNoteMutation
}) => {
  const maxLevel = 5; // Limit nesting to prevent UI issues
  if (level > maxLevel) return null;
  
  const indentClass = `ml-${level * 4}`; // Increase indentation per level
  const prefixSymbol = '↳' + '  '.repeat(level - 1); // Visual hierarchy indicator
  
  return (
    <>
      {notes.map((note) => (
        <div key={note.id}>
          <div
            className={`${getNoteCardClass?.(note, true)} ${indentClass} group`}
            draggable={true}
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
  viewMode: ViewMode;
  selectedFolderId: string | null;
  selectedProviderId: string | null;
}

const getProviderIcon = (providerId: string, providerType?: string) => {
  // Use type if available, otherwise fallback to ID-based mapping
  const type = providerType || providerId.split('-')[1]; // extract type from id
  
  switch (type) {
    case 'icloud':
      return Apple;
    case 'google':
      return FaGoogle;
    case 'exchange':
    case 'outlook':
      return Mail;
    default:
      return Folder; // Default icon
  }
};

export function NoteList({
  width,
  onWidthChange,
  notes,
  selectedNote,
  onNoteSelect,
  viewMode,
  selectedFolderId,
  selectedProviderId,
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
    if (!selectedFolderId || !selectedProviderId) {
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
        providerId: selectedProviderId,
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

  const formatDate = (date: Date | string) => {
    const now = new Date();
    const noteDate = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - noteDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return noteDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return noteDate.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
      });
    }
  };

  const sortNotes = (notes: Note[], sortBy: string): Note[] => {
    const sorted = [...notes];
    
    switch (sortBy) {
      case 'dateCreated':
        return sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'dateModified':
      default:
        return sorted.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    }
  };

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData('text/plain', noteId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, noteId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverNote(noteId);
  };

  const handleDragLeave = () => {
    setDragOverNote(null);
  };

  const handleDrop = async (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    const draggedNoteId = e.dataTransfer.getData('text/plain');
    setDragOverNote(null);
    
    if (draggedNoteId !== targetNoteId) {
      try {
        await updateHierarchyMutation.mutateAsync({
          id: draggedNoteId,
          parentId: targetNoteId,
        });
        toast({
          title: "Success",
          description: "Note hierarchy updated",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update note hierarchy",
          variant: "destructive",
        });
      }
    }
  };

  const organizeNotesByHierarchy = (notes: Note[]): NoteWithChildren[] => {
    // Helper function to recursively build note tree
    const buildNoteTree = (parentId: string | null): NoteWithChildren[] => {
      const children = notes.filter(note => note.parentId === parentId);
      
      return children.map(note => ({
        ...note,
        children: buildNoteTree(note.id)
      }));
    };
    
    // Start with root notes (notes without parents)
    return buildNoteTree(null);
  };

  const groupNotesByDate = (notes: Note[]): { [key: string]: NoteWithChildren[] } => {
    const hierarchicalNotes = organizeNotesByHierarchy(notes);
    const sortedNotes = sortNotes(hierarchicalNotes, sortBy);
    const groups: { [key: string]: NoteWithChildren[] } = {};
    
    sortedNotes.forEach(note => {
      const noteDate = typeof note.updatedAt === 'string' ? new Date(note.updatedAt) : note.updatedAt;
      if (!noteDate) return;
      const now = new Date();
      const diffMs = now.getTime() - noteDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let groupKey = '';
      if (diffDays === 0) {
        groupKey = 'Today';
      } else if (diffDays === 1) {
        groupKey = 'Yesterday';
      } else if (diffDays < 7) {
        groupKey = 'Previous 7 Days';
      } else if (diffDays < 30) {
        groupKey = 'Previous 30 Days';
      } else {
        const monthYear = noteDate?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) || 'Unknown';
        groupKey = monthYear;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(note);
    });

    return groups;
  };

  const getNoteGridClass = () => {
    switch (viewMode) {
      case 'grid':
        return 'grid grid-cols-2 gap-3 auto-rows-max';
      case 'gallery':
        return 'grid grid-cols-1 gap-3';
      case 'list':
      default:
        return 'space-y-2';
    }
  };

  const getNoteCardClass = (note: Note, isChild = false) => {
    const baseClass = "note-item cursor-pointer rounded-lg border transition-all duration-200";
    const selectedClass = selectedNote?.id === note.id
      ? "bg-accent-blue bg-opacity-20 border-accent-blue border-opacity-50"
      : "hover:bg-gray-700 hover:bg-opacity-30 border-gray-600";
    const dragOverClass = dragOverNote === note.id ? "border-accent-blue border-2" : "";
    const childClass = isChild ? "ml-4 border-l-2 border-gray-600 border-opacity-50" : "";
    
    if (viewMode === 'grid') {
      return `${baseClass} ${selectedClass} ${dragOverClass} ${childClass} p-4 min-h-[128px] flex flex-col justify-between`;
    } else if (viewMode === 'gallery') {
      return `${baseClass} ${selectedClass} ${dragOverClass} ${childClass} p-4 min-h-[96px] flex flex-col justify-between`;
    } else {
      return `${baseClass} ${selectedClass} ${dragOverClass} ${childClass} p-3 flex items-center justify-between`;
    }
  };

  const ProviderIcon = ({ providerId }: { providerId: string }) => {
    const IconComponent = getProviderIcon(providerId);
    return <IconComponent className="h-3 w-3 text-accent-blue" />;
  };

  const groupedNotes = groupNotesByDate(notes);

  return (
    <div className="flex">
      <div 
        className="middle-pane-bg border-r border-separator flex flex-col"
        style={{ width: `${width}px` }}
      >
        {/* Middle Pane Header */}
        <div className="p-4 border-b border-separator">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-lg">Notes</h2>
            <Button
              onClick={createNewNote}
              disabled={createNoteMutation.isPending}
              className="bg-accent-blue text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              data-testid="button-new-note"
            >
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          </div>
          
          {/* Sort Options */}
          <div className="flex items-center justify-between text-sm">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] bg-secondary text-white border-none text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dateModified">Date Modified</SelectItem>
                <SelectItem value="dateCreated">Date Created</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-secondary">{notes.length} notes</span>
          </div>
        </div>
        
        {/* Note List */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedNotes).map(([groupName, groupNotes]) => (
            <div key={groupName} className="p-4">
              <h3 className="text-secondary text-xs font-medium mb-3 uppercase tracking-wide">
                {groupName}
              </h3>
              
              <div className={getNoteGridClass()}>
                {groupNotes.map((note) => (
                  <div key={note.id}>
                    {/* Parent Note */}
                    <div
                      className={`${getNoteCardClass(note)} group`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, note.id)}
                      onDragOver={(e) => handleDragOver(e, note.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, note.id)}
                      data-testid={`note-${note.id}`}
                    >
                      <div className="flex-1" onClick={() => onNoteSelect(note)}>
                        {viewMode === 'list' ? (
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-white font-medium text-sm line-clamp-1 flex-1">
                                {note.title} {note.children && note.children.length > 0 && 
                                  <span className="text-xs text-gray-400 ml-1">({note.children.length})</span>
                                }
                              </h4>
                              <span className="text-secondary text-xs ml-4 whitespace-nowrap">
                                {formatDate(note.updatedAt || note.createdAt || new Date())}
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
                                {note.title} {note.children && note.children.length > 0 && 
                                  <span className="text-xs text-gray-400 ml-1">({note.children.length})</span>
                                }
                              </h4>
                              <span className="text-secondary text-xs ml-2 whitespace-nowrap">
                                {formatDate(note.updatedAt || note.createdAt || new Date())}
                              </span>
                            </div>
                            
                            <p className="text-secondary text-xs note-preview mb-2 line-clamp-3 flex-1">
                              {note.plainContent || "No content"}
                            </p>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <ProviderIcon providerId={note.providerId || ''} />
                        <div className="flex items-center space-x-1">
                          {note.isLocked && (
                            <Lock className="h-3 w-3 text-secondary" data-testid="icon-note-locked" />
                          )}
                          {note.hasAttachments && (
                            <Paperclip className="h-3 w-3 text-secondary" data-testid="icon-note-attachment" />
                          )}
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
                        </div>
                      </div>
                    </div>

                    {/* Render child notes recursively */}
                    {note.children && (
                      <ChildNotes 
                        notes={note.children} 
                        level={1}
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
              </div>
            </div>
          ))}
          
          {notes.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-secondary text-sm">No notes found</p>
              <Button
                onClick={createNewNote}
                variant="link"
                className="text-accent-blue mt-2"
                data-testid="button-create-first-note"
              >
                Create your first note
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Resize Handle */}
      <div
        className="resize-handle w-1 cursor-col-resize hover:bg-accent-blue hover:bg-opacity-30 transition-colors"
        onMouseDown={handleResize}
        data-testid="resize-handle-notelist"
      />
    </div>
  );
}
