import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { File, InsertFile } from "@shared/schema";

export function useFiles() {
  return useQuery({
    queryKey: ['/api/files'],
    queryFn: () => apiRequest<File[]>({ endpoint: '/api/files' }),
  });
}

export function useFile(id: number) {
  return useQuery({
    queryKey: ['/api/files', id],
    queryFn: () => apiRequest<File>({ endpoint: `/api/files/${id}` }),
    enabled: !!id,
  });
}

export function useFileUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fileData: Omit<InsertFile, 'userId'>) => {
      return apiRequest<File>({
        endpoint: '/api/files/upload',
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
      return apiRequest<File>({
        endpoint: `/api/files/${id}`,
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
      return apiRequest<{ success: boolean }>({
        endpoint: `/api/files/${id}`,
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
  });
}

export function useAttachedFiles(entityType: string, entityId: number) {
  return useQuery({
    queryKey: ['/api', entityType, entityId, 'files'],
    queryFn: () => apiRequest<File[]>({ endpoint: `/api/${entityType}/${entityId}/files` }),
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
      return apiRequest({
        endpoint: `/api/${entityType}/${entityId}/files/attach`,
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
      return apiRequest<{ success: boolean }>({
        endpoint: `/api/${entityType}/${entityId}/files/${fileId}`,
        method: 'DELETE',
      });
    },
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api', entityType, entityId, 'files'] });
    },
  });
}