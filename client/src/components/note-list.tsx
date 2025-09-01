import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Lock, Paperclip } from "lucide-react";
import { Apple } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { Mail } from "lucide-react";
import { useCreateNote, useUpdateNoteHierarchy } from "@/hooks/use-notes";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Note } from "@shared/schema";
import type { ViewMode } from "@/pages/dashboard";

type NoteWithChildren = Note & { children?: Note[] };

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

const providerIcons = {
  'provider-icloud': Apple,
  'provider-google': FaGoogle,
  'provider-exchange': Mail,
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
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'dateModified':
      default:
        return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
    const parentNotes = notes.filter(note => !note.parentId);
    const childNotes = notes.filter(note => note.parentId);
    
    return parentNotes.map(parent => ({
      ...parent,
      children: childNotes.filter(child => child.parentId === parent.id)
    }));
  };

  const groupNotesByDate = (notes: Note[]): { [key: string]: NoteWithChildren[] } => {
    const hierarchicalNotes = organizeNotesByHierarchy(notes);
    const sortedNotes = sortNotes(hierarchicalNotes, sortBy);
    const groups: { [key: string]: NoteWithChildren[] } = {};
    
    sortedNotes.forEach(note => {
      const noteDate = typeof note.updatedAt === 'string' ? new Date(note.updatedAt) : note.updatedAt;
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
        const monthYear = noteDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
    const IconComponent = providerIcons[providerId as keyof typeof providerIcons];
    return IconComponent ? <IconComponent className="h-3 w-3 text-accent-blue" /> : null;
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
                      className={getNoteCardClass(note)}
                      onClick={() => onNoteSelect(note)}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, note.id)}
                      onDragOver={(e) => handleDragOver(e, note.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, note.id)}
                      data-testid={`note-${note.id}`}
                    >
                      {viewMode === 'list' ? (
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-white font-medium text-sm line-clamp-1 flex-1">
                              {note.title} {note.children && note.children.length > 0 && 
                                <span className="text-xs text-gray-400 ml-1">({note.children.length})</span>
                              }
                            </h4>
                            <span className="text-secondary text-xs ml-4 whitespace-nowrap">
                              {formatDate(note.updatedAt)}
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
                              {formatDate(note.updatedAt)}
                            </span>
                          </div>
                          
                          <p className="text-secondary text-xs note-preview mb-2 line-clamp-3 flex-1">
                            {note.plainContent || "No content"}
                          </p>
                        </>
                      )}
                      
                      <div className="flex items-center justify-between mt-auto">
                        <ProviderIcon providerId={note.providerId} />
                        <div className="flex space-x-1">
                          {note.isLocked && (
                            <Lock className="h-3 w-3 text-secondary" data-testid="icon-note-locked" />
                          )}
                          {note.hasAttachments && (
                            <Paperclip className="h-3 w-3 text-secondary" data-testid="icon-note-attachment" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Child Notes */}
                    {note.children && note.children.map((childNote) => (
                      <div
                        key={childNote.id}
                        className={getNoteCardClass(childNote, true)}
                        onClick={() => onNoteSelect(childNote)}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, childNote.id)}
                        onDragOver={(e) => handleDragOver(e, childNote.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, childNote.id)}
                        data-testid={`note-${childNote.id}`}
                      >
                        {viewMode === 'list' ? (
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-white font-medium text-sm line-clamp-1 flex-1">
                                ↳ {childNote.title}
                              </h4>
                              <span className="text-secondary text-xs ml-4 whitespace-nowrap">
                                {formatDate(childNote.updatedAt)}
                              </span>
                            </div>
                            <p className="text-secondary text-xs note-preview mt-1 line-clamp-1">
                              {childNote.plainContent || "No content"}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-white font-medium text-sm line-clamp-2 flex-1">
                                ↳ {childNote.title}
                              </h4>
                              <span className="text-secondary text-xs ml-2 whitespace-nowrap">
                                {formatDate(childNote.updatedAt)}
                              </span>
                            </div>
                            
                            <p className="text-secondary text-xs note-preview mb-2 line-clamp-3 flex-1">
                              {childNote.plainContent || "No content"}
                            </p>
                          </>
                        )}
                        
                        <div className="flex items-center justify-between mt-auto">
                          <ProviderIcon providerId={childNote.providerId} />
                          <div className="flex space-x-1">
                            {childNote.isLocked && (
                              <Lock className="h-3 w-3 text-secondary" data-testid="icon-note-locked" />
                            )}
                            {childNote.hasAttachments && (
                              <Paperclip className="h-3 w-3 text-secondary" data-testid="icon-note-attachment" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
