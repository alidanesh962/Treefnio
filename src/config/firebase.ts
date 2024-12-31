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

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore with settings for better sync
export const db: Firestore = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence enabled in first tab only');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser doesn\'t support persistence');
  }
});

export default app;