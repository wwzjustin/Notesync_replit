import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Lock, Clock } from "lucide-react";

interface SharedNoteData {
  note: {
    id: string;
    title: string;
    content: any;
    plainContent: string;
    createdAt: string;
    updatedAt: string;
    wordCount: number;
    characterCount: number;
  };
  shareLink: {
    permissions: string;
    expiresAt?: string;
  };
}

export default function SharedNote() {
  const { noteId, token } = useParams<{ noteId: string; token: string }>();
  const [data, setData] = useState<SharedNoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedNote = async () => {
      try {
        const response = await fetch(`/shared/${noteId}/${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to load shared note');
          return;
        }

        const noteData = await response.json();
        setData(noteData);
      } catch (err) {
        setError('Failed to load shared note');
      } finally {
        setLoading(false);
      }
    };

    if (noteId && token) {
      fetchSharedNote();
    }
  }, [noteId, token]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading shared note...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-4">Unable to Access Note</h1>
          <p className="text-gray-400">{error || 'Note not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-semibold">{data.note.title}</h1>
            <p className="text-gray-400 text-sm mt-1">
              Last updated: {formatDate(data.note.updatedAt)}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 text-gray-400 text-sm">
            {data.shareLink.permissions === 'view' && (
              <div className="flex items-center space-x-1">
                <Lock className="h-4 w-4" />
                <span>View Only</span>
              </div>
            )}
            
            {data.shareLink.expiresAt && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Expires: {formatDate(data.shareLink.expiresAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <div 
            className="text-white prose prose-invert max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: data.note.content || data.note.plainContent || 'No content available'
            }}
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
            }}
          />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>
            {data.note.wordCount} words • {data.note.characterCount} characters
          </p>
          <p className="mt-2">
            Shared via NoteSync • Created: {formatDate(data.note.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}