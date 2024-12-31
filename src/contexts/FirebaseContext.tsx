import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { firebaseService } from '../services/firebaseService';
import { collection, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { COLLECTIONS } from '../services/firebaseService';

interface FirebaseContextType {
  db: typeof db;
  firebaseService: typeof firebaseService;
  cachedData: {
    [key: string]: any[];
  };
  isOnline: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [cachedData, setCachedData] = useState<{ [key: string]: any[] }>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set up listeners for main collections
  useEffect(() => {
    const unsubscribers = Object.values(COLLECTIONS).map(collectionName => {
      return onSnapshot(
        collection(db, collectionName),
        {
          includeMetadataChanges: true
        },
        (snapshot: QuerySnapshot<DocumentData>) => {
          setCachedData(prev => ({
            ...prev,
            [collectionName]: snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          }));
        },
        (error) => {
          console.error(`Error syncing ${collectionName}:`, error);
        }
      );
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const value = {
    db,
    firebaseService,
    cachedData,
    isOnline
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export default FirebaseContext; 