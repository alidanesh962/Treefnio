// src/utils/userActivity.ts
import { UserActivity } from '../types';
import { COLLECTIONS } from '../services/firebaseService';
import { db } from '../config/firebase';
import { 
  DocumentData, 
  QueryDocumentSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  where,
  getDocs,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';

const MAX_ACTIVITY_LOGS = 1000; // Maximum number of logs to keep

interface UserActivityLog {
  id: string;
  username: string;
  fullName: string;
  type: 'create' | 'edit' | 'delete' | 'login' | 'logout';
  module: string;
  itemType?: string;
  itemName?: string;
  details?: string;
  timestamp: number;
}

export const logUserActivity = async (
  username: string,
  fullName: string,
  type: 'create' | 'edit' | 'delete' | 'login' | 'logout',
  module: string,
  details?: string
) => {
  try {
    const activityRef = collection(db, COLLECTIONS.USER_ACTIVITIES);
    
    // Add new activity to Firebase
    const newActivity: Omit<UserActivityLog, 'id' | 'timestamp'> = {
      username,
      fullName,
      type,
      module,
      details
    };

    await addDoc(activityRef, {
      ...newActivity,
      timestamp: Date.now()
    });

    // Clean up old activities if needed
    const activitiesQuery = query(
      activityRef,
      orderBy('timestamp', 'desc'),
      limit(MAX_ACTIVITY_LOGS + 1)
    );
    const snapshot = await getDocs(activitiesQuery);

    if (snapshot.size > MAX_ACTIVITY_LOGS) {
      const batch = writeBatch(db);
      const oldActivities = Array.from(snapshot.docs).slice(MAX_ACTIVITY_LOGS);
      oldActivities.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
};

export const getUserActivities = async (username?: string): Promise<UserActivity[]> => {
  try {
    const activitiesRef = collection(db, COLLECTIONS.USER_ACTIVITIES);
    let q = query(activitiesRef, orderBy('timestamp', 'desc'));
    
    if (username) {
      q = query(activitiesRef, where('username', '==', username), orderBy('timestamp', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as UserActivity[];
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }
};

export const getUserActivitiesByDate = async (): Promise<{ [date: string]: UserActivity[] }> => {
  try {
    const activities = await getUserActivities();
    const grouped: { [date: string]: UserActivity[] } = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(activity);
    });
    
    return grouped;
  } catch (error) {
    console.error('Error fetching user activities by date:', error);
    return {};
  }
};

export const clearOldActivities = async (daysToKeep = 30) => {
  try {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const activityRef = collection(db, COLLECTIONS.USER_ACTIVITIES);
    const oldActivitiesQuery = query(
      activityRef,
      where('timestamp', '<', cutoffTime)
    );
    const snapshot = await getDocs(oldActivitiesQuery);

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error('Error clearing old activities:', error);
  }
};

export const exportActivities = async (format: 'json' | 'csv'): Promise<string> => {
  const activities = await getUserActivities();
  
  if (format === 'json') {
    return JSON.stringify(activities, null, 2);
  }
  
  // CSV format
  const headers = ['Date', 'User', 'Type', 'Module', 'Details'];
  const rows = activities.map(activity => [
    new Date(activity.timestamp).toLocaleString(),
    activity.username,
    activity.type,
    activity.module,
    activity.details || ''
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};