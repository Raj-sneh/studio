import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

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

if (typeof window !== 'undefined') {
  // Use your new site key from the Google Cloud screenshot
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider('6LdceDgsAAAAAG2u3dQNEXT6p7aUdIy1xgRoJmHE'),
    isTokenAutoRefreshEnabled: true
  });
}

export default app;