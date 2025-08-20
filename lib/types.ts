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
