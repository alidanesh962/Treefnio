// src/utils/storage.ts
import { User } from '../types';

const USERS_KEY = 'restaurant_management_users';

export type { User };  // Re-export the User type

export const getStoredUsers = (): User[] => {
  const storedUsers = localStorage.getItem(USERS_KEY);
  if (!storedUsers) {
    // Initialize with default admin user
    const defaultUsers: User[] = [
      { id: 1, username: 'Admin', password: 'AdminPassword', role: 'admin' }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(storedUsers);
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};