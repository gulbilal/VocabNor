import { getApps, initializeApp } from "firebase/app";

// Replace these placeholder values with your Firebase web app configuration.
const firebaseConfig = {
  apiKey: "AIzaSyDCHStnCgmSS40XfAsA2d4kXBpfg0FBwsE",
  authDomain: "vocabnor.firebaseapp.com",
  projectId: "vocabnor",
  storageBucket: "vocabnor.firebasestorage.app",
  messagingSenderId: "1050479950917",
  appId: "1:1050479950917:web:072602e66b2b5def13f72c",
};

export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
