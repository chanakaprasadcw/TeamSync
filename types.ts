export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE'
}

export interface Organization {
  id: string;
  name: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Simulated auth
  role: UserRole;
  organizationId: string;
  managerId?: string; // If employee, who is their manager
  points: number; // For gamification
  avatar: string;
}

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  assignedTo: string; // User ID or 'ALL'
  assignedBy: string; // Manager ID
  points: number;
  status: 'PENDING' | 'COMPLETED';
  createdAt: number;
  completedAt?: number;
}

export interface TimeLog {
  id: string;
  userId: string;
  organizationId: string;
  clockIn: number;
  clockOut?: number;
  locationIn?: { lat: number; lng: number };
  locationOut?: { lat: number; lng: number };
  date: string; // YYYY-MM-DD
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}