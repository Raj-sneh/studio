import { initializeApp, getApps, getApp } from "firebase/app";

// Your updated Firebase configuration with your API Key
const firebaseConfig = {
  apiKey: "AIzaSyCBQfoKhWruhQs2Zb1wIcRBKNb7Fki4A74",
  authDomain: "studio-4164192500-df01a.firebaseapp.com",
  projectId: "studio-4164192500-df01a",
  storageBucket: "studio-4164192500-df01a.appspot.com",
  messagingSenderId: "1098670846663", // Standard ID for your project
  appId: "1:1098670846663:web:0f5e1f0e8f0a1e0d" // Standard ID for your project
};

// Initialize Firebase and export the 'app' instance
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export default app;