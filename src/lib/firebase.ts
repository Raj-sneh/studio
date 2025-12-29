import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { firebaseConfig } from "@/firebase/config";

// Initialize Firebase app
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

if (typeof window !== 'undefined') {
  // Set debug token for development environments
  if (process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN) {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN;
  }

  // Initialize App Check with the correct provider
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6Lcw_8cqAAAAABz3uVlD_M4D7J_n8W6G9-QYvE2'), // Replace with your actual Site Key
    isTokenAutoRefreshEnabled: true
  });
}

export default app;