import { useEffect, useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { COLLECTIONS } from '../services/firebaseService';

type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

export function useFirebaseSync<T extends { id: string }>(collectionName: CollectionName) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { firebaseService } = useFirebase();

  useEffect(() => {
    setLoading(true);
    
    // Set up real-time listener
    const unsubscribe = firebaseService.subscribeToCollection(
      collectionName,
      (newData) => {
        setData(newData as T[]);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [collectionName, firebaseService]);

  const addItem = async (item: T) => {
    try {
      await firebaseService.setDocument(collectionName, item.id, item);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateItem = async (id: string, item: Partial<T>) => {
    try {
      await firebaseService.updateDocument(collectionName, id, item);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await firebaseService.deleteDocument(collectionName, id);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem
  };
} 