import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

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

// Initialize Firestore
export const db: Firestore = getFirestore(app);

export default app;