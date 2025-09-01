import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Lock, Paperclip } from "lucide-react";
import { Apple } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { Mail } from "lucide-react";
import { useCreateNote } from "@/hooks/use-notes";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Note } from "@shared/schema";
import type { ViewMode } from "@/pages/dashboard";

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
  const createNoteMutation = useCreateNote();
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

  const groupNotesByDate = (notes: Note[]) => {
    const groups: { [key: string]: Note[] } = {};
    
    notes.forEach(note => {
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
        return 'grid grid-cols-2 gap-2';
      case 'gallery':
        return 'grid grid-cols-1 gap-3';
      case 'list':
      default:
        return 'space-y-2';
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
                <SelectItem value="provider">Provider</SelectItem>
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
                  <div
                    key={note.id}
                    className={cn(
                      "note-item p-3 rounded-lg cursor-pointer",
                      selectedNote?.id === note.id
                        ? "bg-accent-blue bg-opacity-20 border border-accent-blue border-opacity-30"
                        : "hover:bg-gray-700 hover:bg-opacity-30"
                    )}
                    onClick={() => onNoteSelect(note)}
                    data-testid={`note-${note.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium text-sm line-clamp-1 flex-1">
                        {note.title}
                      </h4>
                      <span className="text-secondary text-xs ml-2 whitespace-nowrap">
                        {formatDate(note.updatedAt)}
                      </span>
                    </div>
                    
                    <p className="text-secondary text-xs note-preview mb-2">
                      {note.plainContent || "No content"}
                    </p>
                    
                    <div className="flex items-center justify-between">
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
