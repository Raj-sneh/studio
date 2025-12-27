import { initializeApp } from "firebase/app";

// Your Firebase config (Found in Project Settings > General)
const firebaseConfig = {
  apiKey: "...",
  authDomain: "studio-4164192500-df01a.firebaseapp.com",
  projectId: "studio-4164192500-df01a",
  storageBucket: "studio-4164192500-df01a.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);

export default app;
