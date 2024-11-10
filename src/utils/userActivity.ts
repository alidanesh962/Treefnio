// src/utils/userActivity.ts
import moment from 'moment';
import { UserActivity } from '../types';

const USER_ACTIVITY_KEY = 'user_activity_logs';
const MAX_ACTIVITY_LOGS = 1000; // Maximum number of logs to keep

export const logUserActivity = (
  username: string,
  type: 'login' | 'logout',
  details?: string
) => {
  const storedActivity = localStorage.getItem(USER_ACTIVITY_KEY);
  let activities: UserActivity[] = storedActivity ? JSON.parse(storedActivity) : [];

  // Add new activity
  const newActivity: UserActivity = {
    id: Date.now().toString(),
    username,
    type,
    timestamp: Date.now(),
    details
  };

  // Add to beginning of array (most recent first)
  activities.unshift(newActivity);

  // Limit the number of stored logs
  if (activities.length > MAX_ACTIVITY_LOGS) {
    activities = activities.slice(0, MAX_ACTIVITY_LOGS);
  }

  localStorage.setItem(USER_ACTIVITY_KEY, JSON.stringify(activities));
  return newActivity;
};

export const getUserActivities = (username?: string): UserActivity[] => {
  const storedActivity = localStorage.getItem(USER_ACTIVITY_KEY);
  const activities: UserActivity[] = storedActivity ? JSON.parse(storedActivity) : [];

  if (username) {
    return activities.filter(activity => activity.username === username);
  }

  return activities;
};

export const getActivityStats = () => {
  const activities = getUserActivities();
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  return {
    total: activities.length,
    today: activities.filter(a => a.timestamp >= oneDayAgo).length,
    thisWeek: activities.filter(a => a.timestamp >= oneWeekAgo).length,
    logins: activities.filter(a => a.type === 'login').length,
    logouts: activities.filter(a => a.type === 'logout').length,
    uniqueUsers: new Set(activities.map(a => a.username)).size
  };
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
    const headers = ['تاریخ', 'زمان', 'نام کاربری', 'نوع فعالیت', 'جزئیات'];
    const rows = activities.map(activity => {
      const date = new Date(activity.timestamp);
      return [
        moment(date).format('jYYYY/jMM/jDD'),
        date.toLocaleTimeString('fa-IR'),
        activity.username,
        activity.type === 'login' ? 'ورود' : 'خروج',
        activity.details || ''
      ];
    });

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }

  return JSON.stringify(activities, null, 2);
};