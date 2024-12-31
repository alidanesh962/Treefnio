import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyACxCGtxaDT0pGvcr3fjl9XY62ysMPZ25U",
    authDomain: "reefnio-53391.firebaseapp.com",
    projectId: "reefnio-53391",
    storageBucket: "reefnio-53391.firebasestorage.app",
    messagingSenderId: "941348726093",
    appId: "1:941348726093:web:6c50bf1947cdbdbc110304"
};

console.log('[Firebase] Initializing Firebase app...');
const app: FirebaseApp = initializeApp(firebaseConfig);

console.log('[Firebase] Initializing Firestore with unlimited cache...');
export const db: Firestore = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
console.log('[Firebase] Enabling IndexedDB persistence...');
enableIndexedDbPersistence(db).then(() => {
  console.log('[Firebase] ✅ IndexedDB persistence enabled successfully');
}).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('[Firebase] ⚠️ Multiple tabs open, persistence enabled in first tab only', err);
  } else if (err.code === 'unimplemented') {
    console.error('[Firebase] ❌ Browser doesn\'t support persistence', err);
  } else {
    console.error('[Firebase] ❌ Error enabling persistence:', err);
  }
});

// Log successful initialization
console.log('[Firebase] ✅ Firebase initialized successfully');

export default app;