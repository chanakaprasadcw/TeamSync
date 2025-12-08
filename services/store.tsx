import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Task, TimeLog, UserRole, Organization } from '../types';
import { auth, db, storage, firebaseConfig } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword,
  deleteUser as firebaseDeleteUser,
  getAuth as getAuthFromApp
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc, 
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface StoreContextType {
  currentUser: User | null;
  users: User[]; 
  tasks: Task[];
  logs: TimeLog[];
  organization: Organization | null;
  
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  registerOrganization: (orgName: string, adminName: string, email: string, password: string) => Promise<string | null>;
  changePassword: (password: string) => void;
  updateUserProfile: (name: string, file?: File) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'points' | 'avatar' | 'organizationId'>) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole, managerId?: string) => void;
  deleteUser: (userId: string) => void;
  createTask: (task: Omit<Task, 'id' | 'organizationId' | 'assignedBy' | 'status' | 'createdAt'>) => void;
  clockIn: (location: { lat: number; lng: number }) => void;
  clockOut: (location: { lat: number; lng: number }) => void;
  completeTask: (taskId: string) => void;
  currentLog: TimeLog | undefined;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// --- Mock Email Service ---
const mockEmailService = async (email: string, name: string, role: string, orgName: string, password: string) => {
  console.log(`%c[EMAIL SERVICE] Connecting to SMTP...`, 'color: grey; font-style: italic;');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`%c[EMAIL SENT] To: ${email}`, 'color: #10b981; font-weight: bold; font-size: 12px;');
  console.log(`
    ----------------------------------------------------
    FROM: no-reply@teamsync.app
    TO: ${email}
    SUBJECT: Invitation to ${orgName}
    ----------------------------------------------------
    Hi ${name},
    
    You have been invited to join ${orgName} as a ${role}.
    
    Login Credentials:
    Email: ${email}
    Password: ${password}
    
    Login here: ${window.location.origin}
    ----------------------------------------------------
  `);
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // 1. Listen for Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch User Profile from Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        // We set up a listener on the user profile to keep permissions in sync
        const unsubProfile = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data() as User;
                // Add ID from doc
                setCurrentUser({ ...userData, id: docSnap.id });
            } else {
                // Profile might be creating...
            }
            setLoadingAuth(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setLoadingAuth(false); // Stop loading even if error
            if (error.code === 'permission-denied') {
              alert("DATABASE PERMISSION ERROR\n\nYour Firestore database is locked. You MUST fix this in Firebase Console:\n\n1. Go to Build > Firestore Database > Rules\n2. Change to:\n   allow read, write: if request.auth != null;\n3. Click Publish");
            }
        });
        return () => unsubProfile();
      } else {
        setCurrentUser(null);
        setOrganization(null);
        setUsers([]);
        setTasks([]);
        setLogs([]);
        setLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen for Organization Data (if logged in)
  useEffect(() => {
    if (!currentUser?.organizationId) return;

    // Helper to handle snapshot errors
    const handleError = (context: string) => (error: any) => {
       console.error(`Error fetching ${context}:`, error);
    };

    // Fetch Organization Details
    const orgRef = doc(db, 'organizations', currentUser.organizationId);
    const unsubOrg = onSnapshot(orgRef, (doc) => {
        if(doc.exists()) {
            setOrganization({ ...doc.data(), id: doc.id } as Organization);
        }
    }, handleError("Organization"));

    // Fetch Users in Org
    const usersQuery = query(collection(db, 'users'), where('organizationId', '==', currentUser.organizationId));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        setUsers(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as User)));
    }, handleError("Users"));

    // Fetch Tasks in Org
    const tasksQuery = query(collection(db, 'tasks'), where('organizationId', '==', currentUser.organizationId));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
        setTasks(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Task)));
    }, handleError("Tasks"));

    // Fetch Logs in Org
    // For performance in real apps, we might limit this. Here we fetch all for the org.
    const logsQuery = query(collection(db, 'logs'), where('organizationId', '==', currentUser.organizationId));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
        setLogs(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as TimeLog)));
    }, handleError("Logs"));

    return () => {
        unsubOrg();
        unsubUsers();
        unsubTasks();
        unsubLogs();
    };
  }, [currentUser?.organizationId]);

  const currentLog = currentUser ? logs.find(l => 
    l.userId === currentUser.id && 
    !l.clockOut && 
    l.date === new Date().toISOString().split('T')[0]
  ) : undefined;

  // --- Actions ---

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return null; // Success
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/operation-not-allowed') {
        return "Email/Password login is not enabled in Firebase Console.";
      }
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        return "Incorrect email or password.";
      }
      return "Login failed. Please try again.";
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const registerOrganization = async (orgName: string, adminName: string, email: string, password: string): Promise<string | null> => {
    try {
        // 1. Create Admin Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        try {
          // 2. Create Organization
          const orgRef = await addDoc(collection(db, 'organizations'), {
              name: orgName,
              createdAt: Date.now()
          });

          // 3. Create User Profile
          await setDoc(doc(db, 'users', uid), {
              id: uid,
              name: adminName,
              email,
              role: UserRole.ADMIN,
              organizationId: orgRef.id,
              points: 0,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=random`
          });
          
          return null; // Success

        } catch (dbError: any) {
          // ROLLBACK: If DB write fails (e.g. permissions), delete the Auth user so they can try again
          // without getting "Email already in use"
          console.error("Database write failed during registration, rolling back auth...", dbError);
          await firebaseDeleteUser(userCredential.user);
          throw dbError;
        }

    } catch (error: any) {
        console.error("Registration failed", error);
        if (error.code === 'auth/operation-not-allowed') {
            return "Email/Password sign-in is disabled in Firebase Console. Please enable it in Authentication > Sign-in method.";
        }
        if (error.code === 'permission-denied') {
            return "Database permission denied. Go to Firebase Console > Firestore > Rules and set 'allow read, write: if request.auth != null;'.";
        }
        if (error.code === 'auth/email-already-in-use') {
            return "This email is already registered. Please login.";
        }
        return error.message || "Registration failed.";
    }
  };

  const changePassword = async (password: string) => {
    if (auth.currentUser) {
        try {
            await updatePassword(auth.currentUser, password);
        } catch (e) {
            console.error("Password update failed", e);
            alert("Please log in again to change your password.");
        }
    }
  };

  const updateUserProfile = async (name: string, file?: File) => {
    if (!currentUser) return;
    
    let avatarUrl = currentUser.avatar;

    // Upload image if provided
    if (file) {
      try {
        const storageRef = ref(storage, `avatars/${currentUser.id}_${Date.now()}`);
        await uploadBytes(storageRef, file, {
          contentType: file.type // Explicitly set content type
        });
        avatarUrl = await getDownloadURL(storageRef);
      } catch (e: any) {
        console.error("Avatar upload failed:", e);
        if (e.code === 'storage/unauthorized') {
          throw new Error("Storage permission denied. Go to Firebase Console > Storage > Rules and allow read/write.");
        } else if (e.code === 'storage/canceled') {
          throw new Error("Upload canceled.");
        } else {
          throw new Error("Failed to upload image: " + e.message);
        }
      }
    }

    try {
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        name,
        avatar: avatarUrl
      });
    } catch (e: any) {
      console.error("Profile update failed:", e);
      throw new Error("Failed to save profile data.");
    }
  };

  const addUser = async (userData: Omit<User, 'id' | 'points' | 'avatar' | 'organizationId'>) => {
    if (!currentUser || !organization) return;

    // Send visual feedback
    await mockEmailService(userData.email, userData.name, userData.role, organization.name, userData.password || '123');

    // CRITICAL: We need to create a new user in Firebase Auth WITHOUT logging out the current Admin.
    // Solution: Initialize a secondary Firebase App instance.
    let secondaryApp;
    try {
        // Initialize secondary app
        secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuthFromApp(secondaryApp);

        // Create the user in Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password || '123');
        const newUid = userCredential.user.uid;

        // Create the User Profile in Firestore (using the PRIMARY Admin connection which has write permissions)
        await setDoc(doc(db, 'users', newUid), {
            id: newUid,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            organizationId: currentUser.organizationId,
            managerId: userData.managerId || null,
            points: 0,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
            createdAt: Date.now()
        });

        // Cleanup: Sign out secondary user and delete app
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);

    } catch (error: any) {
        console.error("Error adding user:", error);
        if (secondaryApp) await deleteApp(secondaryApp);
        
        if (error.code === 'auth/email-already-in-use') {
            alert("Error: This email is already registered in the system.");
        } else {
            alert("Failed to add user. " + error.message);
        }
        throw error;
    }
  };

  const updateUserRole = async (userId: string, role: UserRole, managerId?: string) => {
    const ref = doc(db, 'users', userId);
    await updateDoc(ref, { role, managerId: managerId || null });
  };

  const deleteUser = async (userId: string) => {
    await deleteDoc(doc(db, 'users', userId));
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'organizationId' | 'assignedBy' | 'status' | 'createdAt'>) => {
    if (!currentUser) return;
    await addDoc(collection(db, 'tasks'), {
        ...taskData,
        organizationId: currentUser.organizationId,
        assignedBy: currentUser.id,
        status: 'PENDING',
        createdAt: Date.now()
    });
  };

  const clockIn = async (location: { lat: number; lng: number }) => {
    if (!currentUser) return;
    await addDoc(collection(db, 'logs'), {
        userId: currentUser.id,
        organizationId: currentUser.organizationId,
        clockIn: Date.now(),
        locationIn: location,
        date: new Date().toISOString().split('T')[0]
    });
  };

  const clockOut = async (location: { lat: number; lng: number }) => {
    if (!currentLog) return;
    const ref = doc(db, 'logs', currentLog.id);
    await updateDoc(ref, {
        clockOut: Date.now(),
        locationOut: location
    });
  };

  const completeTask = async (taskId: string) => {
    if (!currentUser) return;
    
    // Optimistic UI updates are handled by Firestore listeners automatically
    const taskRef = doc(db, 'tasks', taskId);
    const taskDoc = tasks.find(t => t.id === taskId);
    
    if (taskDoc && taskDoc.status === 'PENDING') {
        // 1. Mark Task Complete
        await updateDoc(taskRef, {
            status: 'COMPLETED',
            completedAt: Date.now()
        });

        // 2. Award Points to User
        const userRef = doc(db, 'users', currentUser.id);
        // Note: For robust points, we'd use a transaction or Cloud Function, 
        // but simple update is fine for this demo.
        await updateDoc(userRef, {
            points: (currentUser.points || 0) + taskDoc.points
        });
    }
  };

  return (
    <StoreContext.Provider value={{ 
      currentUser, users, tasks, logs, organization,
      login, logout, registerOrganization, changePassword, updateUserProfile,
      addUser, updateUserRole, deleteUser,
      createTask, clockIn, clockOut, completeTask, currentLog 
    }}>
      {!loadingAuth ? children : (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-slate-500 text-sm font-medium animate-pulse">Connecting to Firebase...</p>
        </div>
      )}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};