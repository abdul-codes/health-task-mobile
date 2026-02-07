// User roles
export enum UserRole {
  Admin = "ADMIN",
  Doctor = "DOCTOR",
  Nurse = "NURSE",
  Labtech = "LABTECH",
}

// Task status
export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// Task priority
export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isApproved: boolean;
  approvedBy?: User;
  approvedAt?: string;
  department?: Department;
  profilePicture?: string;
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  createdBy: User;
  assignedTo?: User;
  patient?: Patient | null; // Fixed: Should be patient, not patientId
}

// Patient interface
export interface Patient {
  id: string;
  name: string;
  dob: string;
  roomNumber: string;
  medicalRecord: string;
  createdAt: string;
  createdBy: User;
}

// Notification interface
export interface Notification {
  id: string;
  title: string;
  body: string;
  data: any;
  isRead: boolean;
  createdAt: string;
  userId: string;
}

// Department interface
export interface Department {
  id: string;
  name: string;
  description: string;
}

// Document scanning types
export enum DocumentType {
  PATIENT_RECORD = "PATIENT_RECORD",
  PRESCRIPTION = "PRESCRIPTION",
  LAB_RESULT = "LAB_RESULT",
  TASK_NOTE = "TASK_NOTE",
}

export interface ExtractedField {
  name: string;
  value: string;
  confidence: number;
  isVerified: boolean;
  suggestions?: string[];
}

export interface ScannedDocument {
  id: string;
  imageUri: string;
  extractedText: string;
  confidence: number;
  documentType: DocumentType;
  fields: ExtractedField[];
  createdAt: Date;
  patientId?: string;
  taskId?: string;
  r2ObjectKey?: string;
  isSynced: boolean;
  isVerified: boolean;
}

export interface ScanResult {
  success: boolean;
  document?: ScannedDocument;
  error?: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: OCRBlock[];
}

export interface OCRBlock {
  text: string;
  confidence: number;
  boundingBox: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface ScanPermissionStatus {
  camera: boolean;
  canRequest: boolean;
}
