import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyDdjOIVmSMqUMrn2AlTVt1NaLqN0gpKr80",
  authDomain: "teamsync-26342.firebaseapp.com",
  projectId: "teamsync-26342",
  storageBucket: "teamsync-26342.firebasestorage.app",
  messagingSenderId: "20761135844",
  appId: "1:20761135844:web:f48c1c96ecf2bb9c5a7af1",
  measurementId: "G-PHQBRW8RK1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);