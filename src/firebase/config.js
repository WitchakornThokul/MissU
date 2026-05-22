import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAsjFY0zG7d-Jrh5-h8KwXISho_CqkC7RI",
  authDomain: "miss-888c6.firebaseapp.com",
  projectId: "miss-888c6",
  storageBucket: "miss-888c6.firebasestorage.app",
  messagingSenderId: "323011023827",
  appId: "1:323011023827:web:1f131f67113847c7bf1526",
  measurementId: "G-GELKL3M5Q5",
  databaseURL: "https://miss-888c6-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);
export default app;
