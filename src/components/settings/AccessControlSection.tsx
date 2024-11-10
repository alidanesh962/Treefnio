// src/components/settings/AccessControlSection.tsx
import React, { useState } from 'react';
import { Edit2, Save, Trash2, X, Plus, UserIcon, Eye, EyeOff } from 'lucide-react';
import type { User } from '../../types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';

interface AccessControlSectionProps {
  users: User[];
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: number) => void;
  onAddUser: (user: Omit<User, 'id'>) => void;
}

interface NewUserForm {
  username: string;
  password: string;
  role: User['role'];
}

interface EditingUserState extends User {
  newPassword: string;
}

export default function AccessControlSection({
  users,
  onUpdateUser,
  onDeleteUser,
  onAddUser
}: AccessControlSectionProps) {
  const [editingUser, setEditingUser] = useState<EditingUserState | null>(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>({
    username: '',
    password: '',
    role: 'user'
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    userId: number | null;
    username: string;
  }>({ isOpen: false, userId: null, username: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateNewUser = () => {
    const newErrors: Record<string, string> = {};

    if (!newUser.username.trim()) {
      newErrors.username = 'نام کاربری الزامی است';
    } else if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      newErrors.username = 'این نام کاربری قبلاً استفاده شده است';
    }

    if (!newUser.password) {
      newErrors.password = 'رمز عبور الزامی است';
    } else if (newUser.password.length < 6) {
      newErrors.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = () => {
    if (validateNewUser()) {
      onAddUser(newUser);
      setNewUser({
        username: '',
        password: '',
        role: 'user'
      });
      setShowNewUserForm(false);
      setErrors({});
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.userId !== null) {
      onDeleteUser(deleteConfirm.userId);
      setDeleteConfirm({ isOpen: false, userId: null, username: '' });
    }
  };

  const handleStartEditing = (user: User) => {
    setEditingUser({
      ...user,
      newPassword: ''
    });
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      const updatedUser: User = {
        id: editingUser.id,
        username: editingUser.username,
        role: editingUser.role,
        password: editingUser.newPassword || editingUser.password
      };
      onUpdateUser(updatedUser);
      setEditingUser(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          مدیریت کاربران
        </h3>
        <button
          onClick={() => setShowNewUserForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg
                   hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          افزودن کاربر جدید
        </button>
      </div>

      {/* New User Form */}
      {showNewUserForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border 
                     border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-800 dark:text-white">
              افزودن کاربر جدید
            </h4>
            <button
              onClick={() => {
                setShowNewUserForm(false);
                setErrors({});
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 
                       dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام کاربری
              </label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.username 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="نام کاربری"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className={`w-full px-3 py-2 pr-10 rounded-lg border ${
                    errors.password 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="رمز عبور"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 
                           dark:text-gray-500 dark:hover:text-gray-400"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نقش کاربر
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as User['role'] })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="user">کاربر عادی</option>
                <option value="admin">مدیر</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 
                         transition-colors w-full"
              >
                افزودن کاربر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {users.map(user => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 border border-gray-200 
                     dark:border-gray-700 rounded-lg"
          >
            {editingUser?.id === user.id ? (
              <div className="flex gap-4 items-center w-full">
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={e =>
                    setEditingUser({ ...editingUser, username: e.target.value })
                  }
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="نام کاربری"
                />
                <div className="relative flex-1">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={editingUser.newPassword}
                    onChange={e =>
                      setEditingUser({ ...editingUser, newPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="رمز عبور جدید (خالی بگذارید تا تغییر نکند)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 
                             dark:text-gray-500 dark:hover:text-gray-400"
                  >
                    {showPasswords ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <select
                  value={editingUser.role}
                  onChange={e =>
                    setEditingUser({ ...editingUser, role: e.target.value as User['role'] })
                  }
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="admin">مدیر</option>
                  <option value="user">کاربر</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateUser}
                    className="p-2 text-green-500 hover:text-green-600"
                  >
                    <Save className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="p-2 text-gray-500 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-8">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-800 dark:text-white">
                      {user.username}
                    </span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {user.role === 'admin' ? 'مدیر' : 'کاربر'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartEditing(user)}
                    className="p-2 text-blue-500 hover:text-blue-600"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({
                      isOpen: true,
                      userId: user.id,
                      username: user.username
                    })}
                    className="p-2 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        itemName={deleteConfirm.username}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, userId: null, username: '' })}
      />
    </div>
  );
}