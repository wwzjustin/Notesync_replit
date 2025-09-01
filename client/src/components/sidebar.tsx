import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Folder, ChevronDown, ChevronRight } from "lucide-react";
import { Apple } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { Mail } from "lucide-react";
import { useProviders } from "@/hooks/use-folders";
import { useFolders } from "@/hooks/use-folders";
import { cn } from "@/lib/utils";

interface SidebarProps {
  width: number;
  onWidthChange: (width: number) => void;
  selectedFolderId: string | null;
  selectedProviderId: string | null;
  onFolderSelect: (folderId: string, providerId: string) => void;
}

const providerIcons = {
  icloud: Apple,
  google: FaGoogle,
  exchange: Mail,
};

export function Sidebar({
  width,
  onWidthChange,
  selectedFolderId,
  selectedProviderId,
  onFolderSelect,
}: SidebarProps) {
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
    new Set(["provider-icloud", "provider-google", "provider-exchange"])
  );

  const { data: providers = [] } = useProviders();
  const { data: folders = [] } = useFolders();

  const toggleProvider = (providerId: string) => {
    const newExpanded = new Set(expandedProviders);
    if (newExpanded.has(providerId)) {
      newExpanded.delete(providerId);
    } else {
      newExpanded.add(providerId);
    }
    setExpandedProviders(newExpanded);
  };

  const handleResize = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      if (newWidth >= 200 && newWidth <= 400) {
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

  const createNewFolder = () => {
    // TODO: Implement folder creation
    console.log('Creating new folder...');
  };

  return (
    <div className="flex">
      <div 
        className="sidebar-bg border-r border-separator flex flex-col"
        style={{ width: `${width}px` }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-separator">
          <h2 className="text-white font-semibold text-lg">Accounts</h2>
        </div>
        
        {/* Account Sections */}
        <div className="flex-1 overflow-y-auto">
          {providers.map((provider) => {
            const IconComponent = providerIcons[provider.type as keyof typeof providerIcons];
            const providerFolders = folders.filter(f => f.providerId === provider.id);
            const isExpanded = expandedProviders.has(provider.id);
            
            return (
              <div key={provider.id} className="p-2">
                <Collapsible open={isExpanded} onOpenChange={() => toggleProvider(provider.id)}>
                  <div className="flex items-center justify-between mb-2">
                    <CollapsibleTrigger className="flex items-center space-x-2 text-white hover:text-accent-blue transition-colors">
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      <span className="font-medium">{provider.name}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={createNewFolder}
                      className="h-auto p-1 text-accent-blue hover:text-blue-400"
                      data-testid={`button-new-folder-${provider.type}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="ml-4 space-y-1">
                      {providerFolders.map((folder) => (
                        <div
                          key={folder.id}
                          className={cn(
                            "folder-item p-2 rounded cursor-pointer flex items-center justify-between",
                            selectedFolderId === folder.id && selectedProviderId === provider.id
                              ? "bg-accent-blue bg-opacity-20 border border-accent-blue border-opacity-30"
                              : "hover:bg-white hover:bg-opacity-5"
                          )}
                          onClick={() => onFolderSelect(folder.id, provider.id)}
                          data-testid={`folder-${folder.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <div className="flex items-center space-x-2">
                            <Folder className="text-accent-blue h-4 w-4" />
                            <span className="text-white text-sm">{folder.name}</span>
                          </div>
                          <span className="text-secondary text-xs">{folder.noteCount}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
        
        {/* New Folder Button */}
        <div className="p-4 border-t border-separator">
          <Button
            onClick={createNewFolder}
            className="w-full bg-accent-blue text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            data-testid="button-new-folder"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>
      </div>
      
      {/* Resize Handle */}
      <div
        className="resize-handle w-1 cursor-col-resize hover:bg-accent-blue hover:bg-opacity-30 transition-colors"
        onMouseDown={handleResize}
        data-testid="resize-handle-sidebar"
      />
    </div>
  );
}
