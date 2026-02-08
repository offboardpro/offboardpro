// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBbj_4mD7GYgmYzYNGQQcWsDAsPZ-TcGFQ",
  authDomain: "offboardpro-e9a56.firebaseapp.com",
  projectId: "offboardpro-e9a56",
  storageBucket: "offboardpro-e9a56.firebasestorage.app",
  messagingSenderId: "758587523107",
  appId: "1:758587523107:web:f75af3d4741fef0b7b3196",
  measurementId: "G-R3Y66KNKMX"
};

// Initialize Firebase (Prevents double-initialization in Next.js)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export the services you'll need for Login/Signup and Data
export const auth = getAuth(app);
export const db = getFirestore(app);