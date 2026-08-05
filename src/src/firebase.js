import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA50m-EhaTWAgvyU34v66y0lIGPQcQJ9L4",
  authDomain: "medverify-6a66b.firebaseapp.com",
  projectId: "medverify-6a66b",
  storageBucket: "medverify-6a66b.appspot.com",
  messagingSenderId: "504146784909",
  appId: "1:504146784909:web:dcfc684831cbc75f4468c4",
  measurementId: "G-1VE6Y3DZ94"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Ensure auth persistence (keep session across restarts)
setPersistence(auth, browserLocalPersistence).catch((e) => {
  // non-fatal: persistence may not be available in some environments
  // keep default behavior if it fails
  // console.warn("Could not set auth persistence", e);
});
export const db = getFirestore(app);
export const storage = getStorage(app);
