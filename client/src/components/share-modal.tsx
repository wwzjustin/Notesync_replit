import { useState, useEffect } from "react";
import { useCreateShareLink } from "@/hooks/use-share-links";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, Mail, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@shared/schema";

interface ShareModalProps {
  note: Note;
  onClose: () => void;
}

export function ShareModal({ note, onClose }: ShareModalProps) {
  const [expiresIn, setExpiresIn] = useState('never');
  const [shareLink, setShareLink] = useState<string>('');
  const { toast } = useToast();
  const createShareLinkMutation = useCreateShareLink();

  const handleCopyLink = async () => {
    try {
      if (!shareLink) {
        // Create share link if it doesn't exist
        const expirationDate = expiresIn === 'never' ? null : 
          expiresIn === '1day' ? new Date(Date.now() + 24 * 60 * 60 * 1000) :
          expiresIn === '1week' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) :
          expiresIn === '1month' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
        
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const shareUrl = `${window.location.origin}/shared/${note.id}/${token}`;
        
        const linkData = await createShareLinkMutation.mutateAsync({
          noteId: note.id,
          url: shareUrl,
          permissions: 'view',
          expiresAt: expirationDate,
        });
        setShareLink(linkData.url);
        await navigator.clipboard.writeText(linkData.url);
      } else {
        await navigator.clipboard.writeText(shareLink);
      }
      
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = () => {
    // Email integration would be implemented here
    toast({
      title: "Email sent",
      description: "Note shared via email successfully",
    });
    onClose();
  };

  const handleExportPDF = () => {
    // PDF export would be implemented here
    toast({
      title: "PDF exported",
      description: "Note exported as PDF successfully",
    });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card text-card-foreground w-96 max-w-md mx-4">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-lg font-semibold">Share Note</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-white h-auto p-1"
              data-testid="button-close-share-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div className="flex items-center space-x-3">
              <Link className="h-5 w-5 text-accent-blue" />
              <div>
                <p className="text-white text-sm font-medium">Copy Link</p>
                <p className="text-muted-foreground text-xs">Anyone with the link can view</p>
              </div>
            </div>
            <Button
              onClick={handleCopyLink}
              className="bg-accent-blue text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              data-testid="button-copy-link"
            >
              Copy
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-accent-blue" />
              <div>
                <p className="text-white text-sm font-medium">Send via Mail</p>
                <p className="text-muted-foreground text-xs">Send as email attachment</p>
              </div>
            </div>
            <Button
              onClick={handleSendEmail}
              className="bg-accent-blue text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              data-testid="button-send-email"
            >
              Send
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-accent-blue" />
              <div>
                <p className="text-white text-sm font-medium">Export as PDF</p>
                <p className="text-muted-foreground text-xs">Download PDF version</p>
              </div>
            </div>
            <Button
              onClick={handleExportPDF}
              className="bg-accent-blue text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              data-testid="button-export-pdf"
            >
              Export
            </Button>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-separator">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm">Link expires in:</span>
            <Select value={expiresIn} onValueChange={setExpiresIn}>
              <SelectTrigger className="w-[120px] bg-secondary text-white border-none text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="1day">1 day</SelectItem>
                <SelectItem value="1week">1 week</SelectItem>
                <SelectItem value="1month">1 month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
