// Scanned Document Types for Mobile App

// Document type enum
export type DocumentType =
  | "PATIENT_RECORD"
  | "PRESCRIPTION"
  | "LAB_RESULT"
  | "TASK_NOTE";

// Sync status enum
export type SyncStatus = "PENDING" | "SYNCED" | "FAILED";

// Extracted field from OCR
export interface ExtractedField {
  name: string;
  value: string;
  confidence: number;
  isVerified: boolean;
}

// Scanned document response from API
export interface ScannedDocumentResponse {
  id: string;
  patientId?: string;
  taskId?: string;
  documentType: DocumentType;
  r2ObjectKey?: string;
  extractedData: {
    fields: ExtractedField[];
  };
  rawText?: string;
  confidence: number;
  isVerified: boolean;
  syncStatus: SyncStatus;
  retryCount: number;
  errorLog?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Create scanned document request
export interface CreateScannedDocumentRequest {
  patientId?: string;
  taskId?: string;
  documentType: DocumentType;
  r2ObjectKey?: string;
  extractedData: {
    fields: ExtractedField[];
  };
  rawText?: string;
  confidence: number;
}

// Scanned document list response
export interface ScannedDocumentListResponse {
  success: boolean;
  data: ScannedDocumentResponse[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Pending scans response
export interface PendingScansResponse {
  success: boolean;
  data: ScannedDocumentResponse[];
  count: number;
}

// Presigned URL response
export interface PresignedUrlResponse {
  success: boolean;
  uploadUrl?: string;
  downloadUrl?: string;
  objectKey: string;
  expiresIn: number;
}

// Failed scans response (admin)
export interface FailedScansListResponse {
  success: boolean;
  data: FailedScanInfo[];
  count: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Failed scan info (admin)
export interface FailedScanInfo {
  id: string;
  documentType: DocumentType;
  createdBy: string;
  retryCount: number;
  errorLog?: string;
  createdAt: string;
}

// Medication schedule for prescription tasks
export interface MedicationSchedule {
  medication: string;
  dosage: string;
  frequency: "OD" | "BD" | "TDS" | "QID";
  duration: number; // days
  startDate: Date;
  instructions?: string;
}

// Sync retry configuration
export interface SyncRetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  backoffMultiplier: number;
}

// Default sync retry config
export const DEFAULT_SYNC_RETRY_CONFIG: SyncRetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  backoffMultiplier: 2,
};
