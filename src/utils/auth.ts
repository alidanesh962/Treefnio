// src/utils/auth.ts
import { CurrentUser } from '../types';
import { logUserActivity } from './userActivity';
import { getStoredUsers } from './storage';

const CURRENT_USER_KEY = 'current_user';

// Default admin credentials
const DEFAULT_ADMIN = {
  username: 'Admin',
  password: 'Admin'
};

export const validateCredentials = (username: string, password: string): boolean => {
  // First check if it matches default admin credentials
  if (username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) {
    return true;
  }

  // Then check stored users
  const users = getStoredUsers();
  return users.some(user => user.username === username && user.password === password);
};

export const setCurrentUser = (username: string, role: 'admin' | 'user' = 'admin') => {
  const user: CurrentUser = { username, role };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  
  // Log login activity with browser information
  const browserInfo = getBrowserInfo();
  logUserActivity(username, 'login', `مرورگر: ${browserInfo.browser}, سیستم‌عامل: ${browserInfo.os}`);
};

export const getCurrentUser = (): CurrentUser | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (!stored) return null;
  return JSON.parse(stored);
};

export const clearCurrentUser = () => {
  const currentUser = getCurrentUser();
  if (currentUser) {
    const browserInfo = getBrowserInfo();
    logUserActivity(
      currentUser.username,
      'logout',
      `مرورگر: ${browserInfo.browser}, سیستم‌عامل: ${browserInfo.os}`
    );
  }
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Helper function to get browser information
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browser = 'نامشخص';
  let os = 'نامشخص';

  // Detect browser
  if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera')) {
    browser = 'Opera';
  }

  // Detect OS
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    os = 'MacOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS')) {
    os = 'iOS';
  }

  return { browser, os };
};