import api from "./api";
import {
  CreateScannedDocumentRequest,
  ScannedDocumentResponse,
  ScannedDocumentListResponse,
  PendingScansResponse,
  PresignedUrlResponse,
  FailedScansListResponse,
} from "@/lib/types/scannedDocument";
import { DocumentType, SyncStatus } from "@/lib/types";

// Query parameters interface
export interface QueryParams {
  page?: number;
  limit?: number;
  documentType?: DocumentType;
  syncStatus?: SyncStatus;
}

// Create a new scanned document
export const createScannedDocument = async (
  data: CreateScannedDocumentRequest
): Promise<ScannedDocumentResponse> => {
  const response = await api.post("/scanned-documents", data);
  return response.data;
};

// Get all scans for a patient
export const getPatientScans = async (
  patientId: string,
  params?: QueryParams
): Promise<ScannedDocumentListResponse> => {
  const response = await api.get(`/scanned-documents/patient/${patientId}`, {
    params,
  });
  return response.data;
};

// Get pending scans for current user (auto-sync)
export const getPendingScans = async (): Promise<PendingScansResponse> => {
  const response = await api.get("/scanned-documents/pending");
  return response.data;
};

// Get single scan by ID
export const getScanById = async (
  id: string
): Promise<{ success: boolean; data: ScannedDocumentResponse }> => {
  const response = await api.get(`/scanned-documents/${id}`);
  return response.data;
};

// Update scan verification status
export const updateScanVerification = async (
  id: string,
  isVerified: boolean
): Promise<{ success: boolean; data: ScannedDocumentResponse }> => {
  const response = await api.patch(`/scanned-documents/${id}/verify`, {
    isVerified,
  });
  return response.data;
};

// Update sync status
export const updateSyncStatus = async (
  id: string,
  syncStatus: SyncStatus,
  errorLog?: string
): Promise<{ success: boolean; data: ScannedDocumentResponse }> => {
  const response = await api.patch(`/scanned-documents/${id}/sync-status`, {
    syncStatus,
    errorLog,
  });
  return response.data;
};

// Retry failed scan
export const retryFailedScan = async (
  id: string
): Promise<{ success: boolean; data: ScannedDocumentResponse }> => {
  const response = await api.post(`/scanned-documents/${id}/retry`);
  return response.data;
};

// Delete scan
export const deleteScan = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/scanned-documents/${id}`);
  return response.data;
};

// Generate presigned URL for uploading to R2
export const generateUploadUrl = async (
  patientId?: string,
  contentType?: string
): Promise<PresignedUrlResponse> => {
  const response = await api.post("/scanned-documents/generate-upload-url", {
    patientId,
    contentType,
  });
  return response.data;
};

// Generate presigned URL for downloading from R2
export const generateDownloadUrl = async (
  objectKey: string
): Promise<PresignedUrlResponse> => {
  const response = await api.post("/scanned-documents/generate-download-url", {
    objectKey,
  });
  return response.data;
};

// Admin: Get all failed scans
export const getFailedScans = async (
  params?: QueryParams & { startDate?: string; endDate?: string }
): Promise<FailedScansListResponse> => {
  const response = await api.get("/scanned-documents/admin/failed", {
    params,
  });
  return response.data;
};

// Admin: Resolve failed scan
export const resolveFailedScan = async (
  id: string,
  resetStatus?: boolean
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(
    `/scanned-documents/admin/${id}/resolve`,
    {
      resetStatus,
    }
  );
  return response.data;
};
