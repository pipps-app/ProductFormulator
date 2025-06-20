import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { File, InsertFile } from "@shared/schema";

// Simple API request function for file operations
async function fileApiRequest(endpoint: string, options?: { method?: string; body?: any }) {
  const response = await fetch(endpoint, {
    method: options?.method || 'GET',
    headers: options?.body ? { 'Content-Type': 'application/json' } : {},
    body: options?.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
}

export function useFiles() {
  return useQuery({
    queryKey: ['/api/files'],
    queryFn: () => fileApiRequest('/api/files'),
  });
}

export function useFile(id: number) {
  return useQuery({
    queryKey: ['/api/files', id],
    queryFn: () => fileApiRequest(`/api/files/${id}`),
    enabled: !!id,
  });
}

export function useFileUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fileData: Omit<InsertFile, 'userId'>) => {
      return fileApiRequest('/api/files/upload', {
        method: 'POST',
        body: fileData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
  });
}

export function useFileUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertFile> }) => {
      return fileApiRequest(`/api/files/${id}`, {
        method: 'PUT',
        body: updates,
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/files', id] });
    },
  });
}

export function useFileDelete() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return fileApiRequest(`/api/files/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
  });
}

export function useAttachedFiles(entityType: string, entityId: number) {
  return useQuery({
    queryKey: ['/api', entityType, entityId, 'files'],
    queryFn: () => fileApiRequest(`/api/${entityType}/${entityId}/files`),
    enabled: !!entityType && !!entityId,
  });
}

export function useAttachFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entityType, entityId, fileId }: { 
      entityType: string; 
      entityId: number; 
      fileId: number; 
    }) => {
      return fileApiRequest(`/api/${entityType}/${entityId}/files/attach`, {
        method: 'POST',
        body: { fileId },
      });
    },
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api', entityType, entityId, 'files'] });
    },
  });
}

export function useDetachFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entityType, entityId, fileId }: { 
      entityType: string; 
      entityId: number; 
      fileId: number; 
    }) => {
      return fileApiRequest(`/api/${entityType}/${entityId}/files/${fileId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api', entityType, entityId, 'files'] });
    },
  });
}