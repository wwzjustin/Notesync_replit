import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  isLocked: boolean;
  selectedFont: string;
  selectedFontSize: string;
}

export function RichTextEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  isLocked,
  selectedFont,
  selectedFontSize,
}: RichTextEditorProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && content !== contentRef.current.innerText) {
      contentRef.current.innerText = content;
    }
  }, [content]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTitleChange(e.target.value);
  };

  const handleContentChange = () => {
    if (contentRef.current) {
      onContentChange(contentRef.current.innerText || '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }

    // Handle basic keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          break;
      }
    }
  };

  return (
    <div 
      className="rich-editor text-white"
      style={{ 
        fontFamily: selectedFont, 
        fontSize: selectedFontSize 
      }}
    >
      {/* Title Input */}
      <input
        ref={titleRef}
        type="text"
        value={title}
        onChange={handleTitleChange}
        disabled={isLocked}
        placeholder="Note title..."
        className={cn(
          "text-2xl font-bold mb-4 bg-transparent border-none outline-none w-full",
          "text-accent-blue placeholder:text-gray-600",
          isLocked && "cursor-not-allowed opacity-60"
        )}
        data-testid="input-note-title"
      />
      
      {/* Content Editor */}
      <div
        ref={contentRef}
        contentEditable={!isLocked}
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        className={cn(
          "min-h-[400px] outline-none text-white leading-relaxed",
          "prose prose-invert max-w-none",
          "[&_a]:text-accent-blue [&_a]:underline",
          "[&_strong]:text-white [&_strong]:font-bold",
          "[&_em]:text-white [&_em]:italic",
          isLocked && "cursor-not-allowed opacity-60"
        )}
        data-testid="editor-content"
        suppressContentEditableWarning={true}
      />
      
      {isLocked && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-75 text-white p-4 rounded-lg pointer-events-none">
          <p className="text-sm">This note is locked. Click the lock icon to unlock it.</p>
        </div>
      )}
    </div>
  );
}
