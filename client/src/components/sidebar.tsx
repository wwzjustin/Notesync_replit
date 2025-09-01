import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { Plus, Folder, ChevronDown, ChevronRight, Trash2, MoreHorizontal } from "lucide-react";
import { useFolders, useDeleteFolder, useCreateFolder } from "@/hooks/use-folders";
import { cn } from "@/lib/utils";

interface SidebarProps {
  width: number;
  onWidthChange: (width: number) => void;
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string) => void;
}

export function Sidebar({
  width,
  onWidthChange,
  selectedFolderId,
  onFolderSelect,
}: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const { data: folders = [] } = useFolders();
  const deleteFolderMutation = useDeleteFolder();
  const createFolderMutation = useCreateFolder();

  const createNewFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolderMutation.mutateAsync({
        name: newFolderName.trim(),
        path: newFolderName.trim(),
        level: 0,
      });
      setNewFolderName("");
      setIsCreatingFolder(false);
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      createNewFolder();
    } else if (e.key === 'Escape') {
      setIsCreatingFolder(false);
      setNewFolderName("");
    }
  };

  const toggleFolderExpansion = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Get root folders (no parent)
  const rootFolders = folders.filter(f => !f.parentId);

  return (
    <div
      className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-separator"
      style={{ width: `${width}px` }}
    >
      <div className="p-4 border-b border-separator">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Folders</h2>
          <Button
            onClick={() => setIsCreatingFolder(true)}
            className="h-auto p-1 text-accent-blue hover:text-blue-400"
            data-testid="button-new-folder"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {isCreatingFolder && (
            <div className="mb-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={() => newFolderName.trim() ? createNewFolder() : setIsCreatingFolder(false)}
                placeholder="Folder name"
                className="w-full px-2 py-1 text-sm bg-white bg-opacity-10 text-white placeholder-gray-400 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                data-testid="input-new-folder-name"
              />
            </div>
          )}

          {rootFolders.map((folder) => (
            <div key={folder.id} className="mb-1">
              <div
                className={cn(
                  "flex items-center justify-between p-2 rounded cursor-pointer text-sm group",
                  selectedFolderId === folder.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-white hover:bg-opacity-10"
                )}
                onClick={() => onFolderSelect(folder.id)}
                data-testid={`folder-${folder.id}`}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{folder.name}</span>
                  {folder.noteCount && folder.noteCount > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {folder.noteCount}
                    </span>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-white hover:bg-opacity-10"
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`folder-menu-${folder.id}`}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem 
                          onSelect={(e) => e.preventDefault()}
                          className="text-red-600 focus:text-red-600"
                          data-testid={`folder-delete-${folder.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{folder.name}"? This will also delete all notes in this folder. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteFolderMutation.mutate(folder.id)}
                            className="bg-red-600 hover:bg-red-700"
                            data-testid={`confirm-delete-folder-${folder.id}`}
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
          ))}
          
          {rootFolders.length === 0 && !isCreatingFolder && (
            <div className="text-center text-muted-foreground text-sm p-4">
              No folders yet. Click the + button to create your first folder.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}