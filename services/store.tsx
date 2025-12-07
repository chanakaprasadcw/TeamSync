import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Task, TimeLog, UserRole, Organization } from '../types';

interface StoreContextType {
  currentUser: User | null;
  // Data visible to the current user (scoped to their Org)
  users: User[]; 
  tasks: Task[];
  logs: TimeLog[];
  organization: Organization | null;
  
  // Auth
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  registerOrganization: (orgName: string, adminName: string, email: string, password: string) => void;
  changePassword: (password: string) => void;

  // Admin Actions
  addUser: (user: Omit<User, 'id' | 'points' | 'avatar' | 'organizationId'>) => void;
  updateUserRole: (userId: string, role: UserRole, managerId?: string) => void;
  deleteUser: (userId: string) => void;
  
  // Manager Actions
  createTask: (task: Omit<Task, 'id' | 'organizationId' | 'assignedBy' | 'status' | 'createdAt'>) => void;
  
  // Employee Actions
  clockIn: (location: { lat: number; lng: number }) => void;
  clockOut: (location: { lat: number; lng: number }) => void;
  completeTask: (taskId: string) => void;
  currentLog: TimeLog | undefined;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Initial Demo Data
const DEFAULT_ORG_ID = 'org_1';
const INITIAL_ORG: Organization = { id: DEFAULT_ORG_ID, name: 'Demo Corp', createdAt: Date.now() };

const INITIAL_USERS: User[] = [
  { id: '1', organizationId: DEFAULT_ORG_ID, name: 'Admin User', email: 'admin@team.com', password: '123', role: UserRole.ADMIN, points: 0, avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=random' },
  { id: '2', organizationId: DEFAULT_ORG_ID, name: 'Sarah Manager', email: 'manager@team.com', password: '123', role: UserRole.MANAGER, points: 0, avatar: 'https://ui-avatars.com/api/?name=Sarah+Manager&background=random' },
  { id: '3', organizationId: DEFAULT_ORG_ID, name: 'John Employee', email: 'john@team.com', password: '123', role: UserRole.EMPLOYEE, managerId: '2', points: 120, avatar: 'https://ui-avatars.com/api/?name=John+Employee&background=random' },
  { id: '4', organizationId: DEFAULT_ORG_ID, name: 'Jane Doe', email: 'jane@team.com', password: '123', role: UserRole.EMPLOYEE, managerId: '2', points: 450, avatar: 'https://ui-avatars.com/api/?name=Jane+Doe&background=random' },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', organizationId: DEFAULT_ORG_ID, title: 'Monthly Report', description: 'Compile the sales data for Q3.', assignedTo: '3', assignedBy: '2', points: 50, status: 'PENDING', createdAt: Date.now() },
  { id: 't2', organizationId: DEFAULT_ORG_ID, title: 'Client Meeting', description: 'Meet with Alpha Corp regarding renewal.', assignedTo: '4', assignedBy: '2', points: 100, status: 'COMPLETED', createdAt: Date.now() - 86400000, completedAt: Date.now() },
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper to load from localStorage with fallback
  const loadInfo = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  // State initialization with persistence
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadInfo('ts_currentUser', null));
  const [allOrgs, setAllOrgs] = useState<Organization[]>(() => loadInfo('ts_allOrgs', [INITIAL_ORG]));
  const [allUsers, setAllUsers] = useState<User[]>(() => loadInfo('ts_allUsers', INITIAL_USERS));
  const [allTasks, setAllTasks] = useState<Task[]>(() => loadInfo('ts_allTasks', INITIAL_TASKS));
  const [allLogs, setAllLogs] = useState<TimeLog[]>(() => loadInfo('ts_allLogs', []));

  // Persistence Effects
  useEffect(() => {
    if (currentUser) localStorage.setItem('ts_currentUser', JSON.stringify(currentUser));
    else localStorage.removeItem('ts_currentUser');
  }, [currentUser]);

  useEffect(() => localStorage.setItem('ts_allOrgs', JSON.stringify(allOrgs)), [allOrgs]);
  useEffect(() => localStorage.setItem('ts_allUsers', JSON.stringify(allUsers)), [allUsers]);
  useEffect(() => localStorage.setItem('ts_allTasks', JSON.stringify(allTasks)), [allTasks]);
  useEffect(() => localStorage.setItem('ts_allLogs', JSON.stringify(allLogs)), [allLogs]);

  // Derived State (Scoped to Current User's Org)
  const organization = currentUser ? allOrgs.find(o => o.id === currentUser.organizationId) || null : null;
  const users = currentUser ? allUsers.filter(u => u.organizationId === currentUser.organizationId) : [];
  const tasks = currentUser ? allTasks.filter(t => t.organizationId === currentUser.organizationId) : [];
  const logs = currentUser ? allLogs.filter(l => l.organizationId === currentUser.organizationId) : [];

  const currentLog = currentUser ? logs.find(l => l.userId === currentUser.id && !l.clockOut && l.date === new Date().toISOString().split('T')[0]) : undefined;

  // --- Auth Actions ---

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const registerOrganization = (orgName: string, adminName: string, email: string, password: string) => {
    const newOrgId = Math.random().toString(36).substr(2, 9);
    const newOrg: Organization = {
        id: newOrgId,
        name: orgName,
        createdAt: Date.now()
    };
    
    const newAdmin: User = {
        id: Math.random().toString(36).substr(2, 9),
        organizationId: newOrgId,
        name: adminName,
        email,
        password,
        role: UserRole.ADMIN,
        points: 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=random`
    };

    setAllOrgs([...allOrgs, newOrg]);
    setAllUsers([...allUsers, newAdmin]);
    setCurrentUser(newAdmin);
  };

  const changePassword = (password: string) => {
    if(!currentUser) return;
    const updatedUser = { ...currentUser, password };
    setAllUsers(allUsers.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
  };

  // --- Admin Actions ---

  const addUser = (userData: Omit<User, 'id' | 'points' | 'avatar' | 'organizationId'>) => {
    if (!currentUser) return;
    const newUser: User = {
        ...userData,
        id: Math.random().toString(36).substr(2, 9),
        organizationId: currentUser.organizationId,
        points: 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`
    };
    setAllUsers([...allUsers, newUser]);
  };
  
  const updateUserRole = (userId: string, role: UserRole, managerId?: string) => {
    setAllUsers(allUsers.map(u => u.id === userId ? { ...u, role, managerId } : u));
  };

  const deleteUser = (userId: string) => {
    setAllUsers(allUsers.filter(u => u.id !== userId));
  };

  // --- Manager Actions ---

  const createTask = (taskData: Omit<Task, 'id' | 'organizationId' | 'assignedBy' | 'status' | 'createdAt'>) => {
    if (!currentUser) return;
    const newTask: Task = {
        ...taskData,
        id: Math.random().toString(36).substr(2, 9),
        organizationId: currentUser.organizationId,
        assignedBy: currentUser.id,
        status: 'PENDING',
        createdAt: Date.now()
    };
    setAllTasks([newTask, ...allTasks]);
  };

  // --- Employee Actions ---

  const clockIn = (location: { lat: number; lng: number }) => {
    if (!currentUser) return;
    const newLog: TimeLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      clockIn: Date.now(),
      locationIn: location,
      date: new Date().toISOString().split('T')[0]
    };
    setAllLogs([...allLogs, newLog]);
  };

  const clockOut = (location: { lat: number; lng: number }) => {
    if (!currentUser || !currentLog) return;
    const updatedLog = { ...currentLog, clockOut: Date.now(), locationOut: location };
    setAllLogs(allLogs.map(l => l.id === currentLog.id ? updatedLog : l));
  };

  const completeTask = (taskId: string) => {
    if (!currentUser) return;
    const task = allTasks.find(t => t.id === taskId);
    if (task && task.status === 'PENDING') {
      const updatedTask = { ...task, status: 'COMPLETED' as const, completedAt: Date.now() };
      setAllTasks(allTasks.map(t => t.id === taskId ? updatedTask : t));
      
      // Award points
      const points = task.points;
      setAllUsers(allUsers.map(u => u.id === currentUser.id ? { ...u, points: u.points + points } : u));
      // Update local current user state too
      setCurrentUser({ ...currentUser, points: currentUser.points + points });
    }
  };

  return (
    <StoreContext.Provider value={{ 
      currentUser, users, tasks, logs, organization,
      login, logout, registerOrganization, changePassword,
      addUser, updateUserRole, deleteUser,
      createTask, clockIn, clockOut, completeTask, currentLog 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};