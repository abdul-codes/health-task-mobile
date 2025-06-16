import { z } from 'zod';
import { UserRole } from './types';

// User registration schema
export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().min(1, "Role selection is required")
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Task creation schema
export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  dueDate: z.date(),
  assignedToId: z.string().optional(),
  patientId: z.string().optional()
});

export type TaskFormData = z.infer<typeof taskSchema>;