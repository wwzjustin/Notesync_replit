import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Folder, InsertFolder } from "@shared/schema";

export function useFolders(parentId?: string | null) {
  return useQuery({
    queryKey: ['/api/folders', { parentId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (parentId !== undefined) params.set('parentId', parentId || 'null');
      
      const response = await fetch(`/api/folders?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json() as Promise<Folder[]>;
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (folder: InsertFolder) => {
      const response = await apiRequest('POST', '/api/folders', folder);
      return response.json() as Promise<Folder>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Folder> }) => {
      const response = await apiRequest('PUT', `/api/folders/${id}`, updates);
      return response.json() as Promise<Folder>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/folders/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
    },
  });
}