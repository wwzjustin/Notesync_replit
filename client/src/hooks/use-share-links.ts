import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ShareLink, InsertShareLink } from "@shared/schema";

export function useShareLinksByNote(noteId: string) {
  return useQuery({
    queryKey: ['/api/share-links/note', noteId],
    queryFn: async () => {
      const response = await fetch(`/api/share-links/note/${noteId}`);
      if (!response.ok) throw new Error('Failed to fetch share links');
      return response.json() as Promise<ShareLink[]>;
    },
    enabled: !!noteId,
  });
}

export function useCreateShareLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shareLink: InsertShareLink) => {
      const response = await apiRequest('POST', '/api/share-links', shareLink);
      return response.json() as Promise<ShareLink>;
    },
    onSuccess: (newShareLink) => {
      queryClient.invalidateQueries({ queryKey: ['/api/share-links/note', newShareLink.noteId] });
    },
  });
}

export function useDeleteShareLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/share-links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/share-links'] });
    },
  });
}