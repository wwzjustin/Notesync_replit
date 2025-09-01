import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Note, InsertNote } from "@shared/schema";

export function useNotes(folderId?: string | null, providerId?: string | null, search?: string) {
  return useQuery({
    queryKey: ['/api/notes', { folderId, providerId, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (folderId) params.set('folderId', folderId);
      if (providerId) params.set('providerId', providerId);
      if (search) params.set('search', search);
      
      const response = await fetch(`/api/notes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      return response.json() as Promise<Note[]>;
    },
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: ['/api/notes', id],
    queryFn: async () => {
      const response = await fetch(`/api/notes/${id}`);
      if (!response.ok) throw new Error('Failed to fetch note');
      return response.json() as Promise<Note>;
    },
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (note: InsertNote) => {
      const response = await apiRequest('POST', '/api/notes', note);
      return response.json() as Promise<Note>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Note> }) => {
      const response = await apiRequest('PUT', `/api/notes/${id}`, updates);
      return response.json() as Promise<Note>;
    },
    onSuccess: (updatedNote) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.setQueryData(['/api/notes', updatedNote.id], updatedNote);
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
    },
  });
}
