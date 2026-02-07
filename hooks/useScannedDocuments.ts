import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createScannedDocument,
  getPatientScans,
  getPendingScans,
  getScanById,
  updateScanVerification,
  updateSyncStatus,
  retryFailedScan,
  deleteScan,
  generateUploadUrl,
  generateDownloadUrl,
  QueryParams,
} from "@/lib/api/scannedDocuments";
import {
  CreateScannedDocumentRequest,
  ScannedDocumentResponse,
  DocumentType,
  SyncStatus,
} from "@/lib/types/scannedDocument";
import { Alert } from "react-native";

// Query keys for cache management
export const scanKeys = {
  all: ["scans"] as const,
  lists: () => [...scanKeys.all, "list"] as const,
  list: (filters: QueryParams) => [...scanKeys.lists(), filters] as const,
  details: () => [...scanKeys.all, "detail"] as const,
  detail: (id: string) => [...scanKeys.details(), id] as const,
  pending: () => [...scanKeys.all, "pending"] as const,
  patient: (patientId: string) =>
    [...scanKeys.lists(), "patient", patientId] as const,
};

// Get patient's scanned documents
export const usePatientScans = (patientId: string, params?: QueryParams) => {
  return useQuery({
    queryKey: scanKeys.patient(patientId),
    queryFn: () => getPatientScans(patientId, params),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get pending scans for auto-sync
export const usePendingScans = () => {
  return useQuery({
    queryKey: scanKeys.pending(),
    queryFn: getPendingScans,
    refetchInterval: 30000, // Poll every 30 seconds
    refetchIntervalInBackground: true,
  });
};

// Get single scan by ID
export const useScanById = (id: string) => {
  return useQuery({
    queryKey: scanKeys.detail(id),
    queryFn: () => getScanById(id),
    enabled: !!id,
  });
};

// Create scanned document
export const useCreateScannedDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScannedDocumentRequest) =>
      createScannedDocument(data),
    onSuccess: (data) => {
      // Invalidate pending scans
      queryClient.invalidateQueries({ queryKey: scanKeys.pending() });

      // If patientId exists, invalidate patient scans
      if (data.patientId) {
        queryClient.invalidateQueries({
          queryKey: scanKeys.patient(data.patientId),
        });
      }

      // Optimistically add to pending cache
      queryClient.setQueryData(scanKeys.pending(), (old: any) => {
        if (!old) return { success: true, data: [data], count: 1 };
        return {
          ...old,
          data: [data, ...old.data],
          count: old.count + 1,
        };
      });
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to create scanned document"
      );
    },
  });
};

// Update scan verification
export const useUpdateScanVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      updateScanVerification(id, isVerified),
    onSuccess: (data, variables) => {
      // Update cache optimistically
      queryClient.setQueryData(scanKeys.detail(variables.id), data);

      // Invalidate patient scans if patientId exists
      if (data.data.patientId) {
        queryClient.invalidateQueries({
          queryKey: scanKeys.patient(data.data.patientId),
        });
      }
    },
  });
};

// Update sync status
export const useUpdateSyncStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      syncStatus,
      errorLog,
    }: {
      id: string;
      syncStatus: SyncStatus;
      errorLog?: string;
    }) => updateSyncStatus(id, syncStatus, errorLog),
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(scanKeys.detail(variables.id), data);

      // Invalidate pending scans if status changed from/to PENDING
      queryClient.invalidateQueries({ queryKey: scanKeys.pending() });

      // Invalidate patient scans
      if (data.data.patientId) {
        queryClient.invalidateQueries({
          queryKey: scanKeys.patient(data.data.patientId),
        });
      }
    },
  });
};

// Retry failed scan
export const useRetryFailedScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => retryFailedScan(id),
    onSuccess: (data) => {
      // Invalidate pending scans
      queryClient.invalidateQueries({ queryKey: scanKeys.pending() });

      // Invalidate patient scans
      if (data.data.patientId) {
        queryClient.invalidateQueries({
          queryKey: scanKeys.patient(data.data.patientId),
        });
      }

      Alert.alert("Success", "Scan marked for retry");
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to retry scan"
      );
    },
  });
};

// Delete scan
export const useDeleteScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteScan(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: scanKeys.detail(id) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: scanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scanKeys.pending() });

      Alert.alert("Success", "Scanned document deleted");
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to delete scan"
      );
    },
  });
};

// Generate R2 upload URL
export const useGenerateUploadUrl = () => {
  return useMutation({
    mutationFn: ({
      patientId,
      contentType,
    }: {
      patientId?: string;
      contentType?: string;
    }) => generateUploadUrl(patientId, contentType),
  });
};

// Generate R2 download URL
export const useGenerateDownloadUrl = () => {
  return useMutation({
    mutationFn: (objectKey: string) => generateDownloadUrl(objectKey),
  });
};
