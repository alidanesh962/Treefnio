import React, { createContext, useContext, ReactNode } from 'react';
import { db } from '../config/firebase';
import { firebaseService } from '../services/firebaseService';

interface FirebaseContextType {
  db: typeof db;
  firebaseService: typeof firebaseService;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const value = {
    db,
    firebaseService,
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