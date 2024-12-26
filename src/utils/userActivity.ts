// src/utils/userActivity.ts
import { UserActivity } from '../types';

const USER_ACTIVITY_KEY = 'user_activity_logs';
const MAX_ACTIVITY_LOGS = 1000; // Maximum number of logs to keep

export interface UserActivityDetails {
  action: 'create' | 'edit' | 'delete';
  module: string;
  itemType: string;
  itemName?: string;
}

export const logUserActivity = (
  username: string,
  fullName: string,
  type: 'create' | 'edit' | 'delete' | 'login' | 'logout',
  module: string,
  details?: string
) => {
  const storedActivity = localStorage.getItem(USER_ACTIVITY_KEY);
  let activities: UserActivity[] = [];
  
  try {
    activities = storedActivity ? JSON.parse(storedActivity) : [];
  } catch (error) {
    console.error('Error parsing stored activities:', error);
  }

  // Add new activity
  const newActivity: UserActivity = {
    id: Date.now().toString(),
    username,
    fullName,
    type,
    module,
    timestamp: Date.now(),
    details
  };

  console.log('Logging new activity:', newActivity);

  // Add to beginning of array (most recent first)
  activities.unshift(newActivity);

  // Limit the number of stored logs
  if (activities.length > MAX_ACTIVITY_LOGS) {
    activities = activities.slice(0, MAX_ACTIVITY_LOGS);
  }

  try {
    localStorage.setItem(USER_ACTIVITY_KEY, JSON.stringify(activities));
    console.log('Updated activities in storage:', activities);
  } catch (error) {
    console.error('Error saving activities to storage:', error);
  }

  return newActivity;
};

export const getUserActivities = (username?: string): UserActivity[] => {
  try {
    const storedActivity = localStorage.getItem(USER_ACTIVITY_KEY);
    const activities: UserActivity[] = storedActivity ? JSON.parse(storedActivity) : [];
    console.log('Retrieved activities from storage:', activities);

    if (username) {
      return activities.filter(activity => activity.username === username);
    }

    return activities;
  } catch (error) {
    console.error('Error retrieving activities:', error);
    return [];
  }
};

export const getUserActivitiesByDate = (username?: string): { [date: string]: UserActivity[] } => {
  const activities = getUserActivities(username);
  const groupedActivities: { [date: string]: UserActivity[] } = {};

  activities.forEach(activity => {
    const date = new Date(activity.timestamp).toISOString().split('T')[0];
    if (!groupedActivities[date]) {
      groupedActivities[date] = [];
    }
    groupedActivities[date].push(activity);
  });

  // Sort dates in descending order
  return Object.entries(groupedActivities)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .reduce((acc, [date, activities]) => {
      acc[date] = activities;
      return acc;
    }, {} as { [date: string]: UserActivity[] });
};

export const clearOldActivities = (daysToKeep = 30) => {
  const storedActivity = localStorage.getItem(USER_ACTIVITY_KEY);
  if (!storedActivity) return;

  const activities: UserActivity[] = JSON.parse(storedActivity);
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  const filteredActivities = activities.filter(activity => 
    activity.timestamp >= cutoffTime
  );

  localStorage.setItem(USER_ACTIVITY_KEY, JSON.stringify(filteredActivities));
  return filteredActivities;
};

export const exportActivities = (format: 'json' | 'csv' = 'json') => {
  const activities = getUserActivities();

  if (format === 'csv') {
    const headers = ['Date', 'Time', 'Username', 'Full Name', 'Activity Type', 'Module', 'Details'];
    const rows = activities.map(activity => {
      const date = new Date(activity.timestamp);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        activity.username,
        activity.fullName,
        activity.type,
        activity.module,
        activity.details || ''
      ];
    });

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }

  return JSON.stringify(activities, null, 2);
};