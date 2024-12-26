// src/utils/storage.ts
import type { IUser, NewUser } from '../models/User';

const USERS_KEY = 'restaurant_management_users';

export const getStoredUsers = (): IUser[] => {
  const storedUsers = localStorage.getItem(USERS_KEY);
  if (!storedUsers) {
    // Initialize with default admin user
    const defaultUsers: IUser[] = [{
      _id: '1',
      username: 'admin',
      password: 'admin',
      role: 'admin',
      name: 'مدیر سیستم',
      active: true,
      createdAt: new Date(),
    }];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(storedUsers);
};

export const addUser = (user: NewUser): IUser => {
  const users = getStoredUsers();
  const newUser: IUser = {
    ...user,
    _id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date(),
  };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
};

export const updateUser = (user: IUser): void => {
  const users = getStoredUsers();
  const index = users.findIndex(u => u._id === user._id);
  if (index !== -1) {
    users[index] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const deleteUser = (id: string): void => {
  const users = getStoredUsers();
  const filteredUsers = users.filter(user => user._id !== id);
  localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));
};