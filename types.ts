export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ASSISTANT_MANAGER = 'ASSISTANT_MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  ENGINEER = 'ENGINEER',
  ASSISTANT_ENGINEER = 'ASSISTANT_ENGINEER',
  TECHNICIAN = 'TECHNICIAN',
  INTERN = 'INTERN'
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 0,
  [UserRole.MANAGER]: 1,
  [UserRole.ASSISTANT_MANAGER]: 2,
  [UserRole.TEAM_LEAD]: 3,
  [UserRole.ENGINEER]: 4,
  [UserRole.ASSISTANT_ENGINEER]: 5,
  [UserRole.TECHNICIAN]: 6,
  [UserRole.INTERN]: 7
};

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