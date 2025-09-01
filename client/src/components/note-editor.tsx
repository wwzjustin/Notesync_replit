import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor, type RichTextEditorRef } from "@/components/rich-text-editor";
import { 
  Lock, 
  Unlock, 
  Share, 
  Maximize, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Table, 
  Image, 
  Link,
  Circle
} from "lucide-react";
import { Apple } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { Mail } from "lucide-react";
import { useUpdateNote } from "@/hooks/use-notes";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Note } from "@shared/schema";

interface NoteEditorProps {
  note: Note | null;
  onShare: () => void;
  onNoteUpdate: (note: Note) => void;
}

const providerIcons = {
  'provider-icloud': { icon: Apple, name: 'iCloud' },
  'provider-google': { icon: FaGoogle, name: 'Google' },
  'provider-exchange': { icon: Mail, name: 'Exchange' },
};

export function NoteEditor({ note, onShare, onNoteUpdate }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedFontSize, setSelectedFontSize] = useState('14px');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const editorRef = useRef<RichTextEditorRef>(null);

  const updateNoteMutation = useUpdateNote();
  const { toast } = useToast();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.plainContent || '');
      setIsLocked(note.isLocked);
    }
  }, [note]);

  // Auto-save functionality
  useEffect(() => {
    if (!note || (!title && !content)) return;

    const timeoutId = setTimeout(async () => {
      if (title !== note.title || content !== note.plainContent) {
        setIsAutoSaving(true);
        try {
          const updatedNote = await updateNoteMutation.mutateAsync({
            id: note.id,
            updates: {
              title: title || 'Untitled Note',
              plainContent: content,
              content: content, // In a real app, this would be rich text JSON
            }
          });
          onNoteUpdate(updatedNote);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsAutoSaving(false);
        }
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [title, content, note, updateNoteMutation, onNoteUpdate]);

  const toggleLock = async () => {
    if (!note) return;

    try {
      const updatedNote = await updateNoteMutation.mutateAsync({
        id: note.id,
        updates: { isLocked: !isLocked }
      });
      setIsLocked(!isLocked);
      onNoteUpdate(updatedNote);
      toast({
        title: isLocked ? "Note unlocked" : "Note locked",
        description: isLocked ? "Note is now editable" : "Note is now protected",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle note lock",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getProviderInfo = (providerId: string) => {
    const provider = providerIcons[providerId as keyof typeof providerIcons];
    return provider || { icon: Apple, name: 'Unknown' };
  };

  if (!note) {
    return (
      <div className="flex-1 editor-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-xl font-semibold mb-2">Welcome to NoteSync</h2>
          <p className="text-secondary">Select a note to begin editing</p>
        </div>
      </div>
    );
  }

  const providerInfo = getProviderInfo(note.providerId);
  const ProviderIcon = providerInfo.icon;

  return (
    <div className={cn("flex-1 editor-bg flex flex-col", isFullscreen && "fixed inset-0 z-50")}>
      {/* Editor Header */}
      <div className="h-16 border-b border-separator flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-white text-xl font-semibold" data-testid="text-note-title">
            {note.title}
          </h1>
          <div className="flex items-center space-x-2 text-secondary text-sm">
            <span>{formatDate(note.updatedAt)}</span>
            <Circle className={cn("h-2 w-2", isAutoSaving ? "text-yellow-500" : "text-green-500")} />
            <span>{isAutoSaving ? "Saving..." : "Auto-saved"}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLock}
            className="text-accent-blue hover:text-blue-400"
            data-testid="button-toggle-lock"
          >
            {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="text-accent-blue hover:text-blue-400"
            data-testid="button-share"
          >
            <Share className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-accent-blue hover:text-blue-400"
            data-testid="button-fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Rich Text Toolbar */}
      <div className="h-12 border-b border-separator flex items-center px-6 space-x-4">
        <div className="flex items-center space-x-2">
          <Select value={selectedFont} onValueChange={setSelectedFont}>
            <SelectTrigger className="w-[120px] bg-secondary text-white border-none text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="SF Pro Display">SF Pro Display</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedFontSize} onValueChange={setSelectedFontSize}>
            <SelectTrigger className="w-[80px] bg-secondary text-white border-none text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12px">12px</SelectItem>
              <SelectItem value="14px">14px</SelectItem>
              <SelectItem value="16px">16px</SelectItem>
              <SelectItem value="18px">18px</SelectItem>
              <SelectItem value="20px">20px</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="h-6 w-px bg-separator" />
        
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="toolbar-button p-2 text-white hover:bg-gray-700"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.handleFormat('bold');
              }
            }}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="toolbar-button p-2 text-white hover:bg-gray-700"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.handleFormat('italic');
              }
            }}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="toolbar-button p-2 text-white hover:bg-gray-700"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.handleFormat('underline');
              }
            }}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="h-6 w-px bg-separator" />
        
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="toolbar-button p-2 text-white hover:bg-gray-700"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.handleFormat('insertUnorderedList');
              }
            }}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="toolbar-button p-2 text-white hover:bg-gray-700"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.handleFormat('insertOrderedList');
              }
            }}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="toolbar-button p-2 text-white hover:bg-gray-700"
            onClick={() => {
              const url = prompt('Enter link URL:');
              if (url && editorRef.current) {
                editorRef.current.handleFormat('createLink', url);
              }
            }}
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="h-6 w-px bg-separator" />
        
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="toolbar-button p-2 text-white hover:bg-gray-700">
            <Image className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="toolbar-button p-2 text-white hover:bg-gray-700">
            <Link className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Editor Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div>
          <RichTextEditor
            ref={editorRef}
            title={title}
            content={content}
            onTitleChange={setTitle}
            onContentChange={setContent}
            isLocked={isLocked}
            selectedFont={selectedFont}
            selectedFontSize={selectedFontSize}
          />
        </div>
      </div>
      
      {/* Editor Footer */}
      <div className="h-8 border-t border-separator flex items-center justify-between px-6 text-secondary text-xs">
        <div className="flex items-center space-x-4">
          <span data-testid="text-word-count">{note.wordCount || 0} words</span>
          <span data-testid="text-character-count">{note.characterCount || 0} characters</span>
        </div>
        <div className="flex items-center space-x-2">
          <ProviderIcon className="h-3 w-3 text-accent-blue" />
          <span>{providerInfo.name} • Notes</span>
        </div>
      </div>
    </div>
  );
}
