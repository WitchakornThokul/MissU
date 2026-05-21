import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAsjFY0zG7d-Jrh5-h8KwXISho_CqkC7RI",
  authDomain: "miss-888c6.firebaseapp.com",
  projectId: "miss-888c6",
  storageBucket: "miss-888c6.firebasestorage.app",
  messagingSenderId: "323011023827",
  appId: "1:323011023827:web:1f131f67113847c7bf1526",
  measurementId: "G-GELKL3M5Q5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
