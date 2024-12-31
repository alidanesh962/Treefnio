import { useEffect, useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { COLLECTIONS } from '../services/firebaseService';
import { SnapshotMetadata } from 'firebase/firestore';

type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

interface SyncMetadata {
  hasPendingWrites: boolean;
  isFromCache: boolean;
}

export function useFirebaseSync<T extends { id: string }>(collectionName: CollectionName) {
  const { firebaseService, cachedData, isOnline } = useFirebase();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');

  useEffect(() => {
    // Use cached data if available
    if (cachedData[collectionName]) {
      setData(cachedData[collectionName] as T[]);
      setLoading(false);
    }

    // Set up real-time listener
    const unsubscribe = firebaseService.subscribeToCollection<T>(
      collectionName,
      (newData: T[], metadata?: SyncMetadata) => {
        setData(newData);
        setLoading(false);
        setSyncStatus(metadata?.hasPendingWrites ? 'syncing' : 'synced');
      }
    );

    // Update sync status based on online state
    setSyncStatus(isOnline ? 'synced' : 'offline');

    return () => {
      unsubscribe();
    };
  }, [collectionName, firebaseService, cachedData, isOnline]);

  const addItem = async (item: T) => {
    try {
      setSyncStatus('syncing');
      await firebaseService.setDocument(collectionName, item.id, item);
      setSyncStatus('synced');
    } catch (err) {
      setError(err as Error);
      setSyncStatus(isOnline ? 'synced' : 'offline');
      throw err;
    }
  };

  const updateItem = async (id: string, item: Partial<T>) => {
    try {
      setSyncStatus('syncing');
      await firebaseService.updateDocument(collectionName, id, item);
      setSyncStatus('synced');
    } catch (err) {
      setError(err as Error);
      setSyncStatus(isOnline ? 'synced' : 'offline');
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      setSyncStatus('syncing');
      await firebaseService.deleteDocument(collectionName, id);
      setSyncStatus('synced');
    } catch (err) {
      setError(err as Error);
      setSyncStatus(isOnline ? 'synced' : 'offline');
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    syncStatus,
    isOnline,
    addItem,
    updateItem,
    deleteItem
  };
} 