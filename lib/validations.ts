import { z } from 'zod';
import { UserRole } from './types';

// User registration schema
export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, 
      "Password must include uppercase, lowercase, number, and special character"),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: "Please select a valid role" })
  })
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