import { UserActivityDetails } from '../types';
import { COLLECTIONS } from './firebaseService';
import { useFirebaseSync } from '../hooks/useFirebaseSync';

export const useUserActivitySync = () => {
  const {
    data: activities,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem
  } = useFirebaseSync<UserActivityDetails>(COLLECTIONS.USER_ACTIVITIES);

  const logActivity = async (activity: Omit<UserActivityDetails, 'id' | 'timestamp'>) => {
    const newActivity: UserActivityDetails = {
      ...activity,
      id: `activity-${Date.now()}`,
      timestamp: Date.now()
    };
    await addItem(newActivity);
  };

  const updateActivity = async (id: string, activity: Partial<UserActivityDetails>) => {
    await updateItem(id, activity);
  };

  const deleteActivity = async (id: string) => {
    await deleteItem(id);
  };

  return {
    // Data
    activities,
    
    // Loading state
    loading,
    
    // Error state
    error,
    
    // Operations
    logActivity,
    updateActivity,
    deleteActivity
  };
}; 