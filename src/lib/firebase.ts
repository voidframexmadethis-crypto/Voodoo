import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// FIX: Force long polling to bypass iframe blocks
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
} as any, firebaseConfig.firestoreDatabaseId);


export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;

