// src/components/settings/AccessControlSection.tsx
import React, { useState } from 'react';
import { Edit2, Save, Trash2, X, Plus, UserIcon, Eye, EyeOff } from 'lucide-react';
import type { IUser, NewUser } from '../../models/User';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';

interface AccessControlSectionProps {
  users: IUser[];
  onUpdateUser: (user: IUser) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onAddUser: (user: NewUser) => Promise<void>;
}

const AccessControlSection: React.FC<AccessControlSectionProps> = ({
  users,
  onUpdateUser,
  onDeleteUser,
  onAddUser,
}) => {
  const [editingUser, setEditingUser] = useState<(IUser & { newPassword: string }) | null>(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    password: '',
    role: 'staff',
    name: '',
    active: true
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    userId: string | null;
    username: string;
  }>({ isOpen: false, userId: null, username: '' });

  const handleStartEditing = (user: IUser) => {
    setEditingUser({ ...user, newPassword: '' });
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      const updatedUser: IUser = {
        ...editingUser,
        password: editingUser.newPassword || editingUser.password
      };
      onUpdateUser(updatedUser);
      setEditingUser(null);
    }
  };

  const handleAddUser = () => {
    onAddUser(newUser);
    setNewUser({
      username: '',
      password: '',
      role: 'staff',
      name: '',
      active: true
    });
    setShowNewUserForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">مدیریت کاربران</h2>
        <button
          onClick={() => setShowNewUserForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg 
                     hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          کاربر جدید
        </button>
      </div>

      {/* New User Form */}
      {showNewUserForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">افزودن کاربر جدید</h3>
            <button
              onClick={() => setShowNewUserForm(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 
                           dark:text-gray-500 dark:hover:text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نقش کاربر
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as IUser['role'] })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="staff">کاربر عادی</option>
                <option value="admin">مدیر</option>
                <option value="manager">مدیر ارشد</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowNewUserForm(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 
                       dark:text-gray-300 dark:hover:text-white"
            >
              انصراف
            </button>
            <button
              onClick={handleAddUser}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg 
                       hover:bg-blue-600 transition-colors"
            >
              ذخیره
            </button>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="grid gap-4 p-4">
          {users.map(user => (
            <div
              key={user._id}
              className="flex items-center justify-between p-4 border border-gray-200 
                       dark:border-gray-700 rounded-lg"
            >
              {editingUser?._id === user._id ? (
                <div className="flex gap-4 items-center w-full">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editingUser.username}
                      onChange={e =>
                        setEditingUser({ ...editingUser, username: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="نام کاربری"
                    />
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={e =>
                        setEditingUser({ ...editingUser, name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="نام و نام خانوادگی"
                    />
                  </div>

                  <div className="relative flex-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={editingUser.newPassword}
                      onChange={e =>
                        setEditingUser({ ...editingUser, newPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white pl-10"
                      placeholder="رمز عبور جدید"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 
                               dark:text-gray-500 dark:hover:text-gray-400"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  <select
                    value={editingUser.role}
                    onChange={e =>
                      setEditingUser({ ...editingUser, role: e.target.value as IUser['role'] })
                    }
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="admin">مدیر</option>
                    <option value="staff">کاربر</option>
                    <option value="manager">مدیر ارشد</option>
                  </select>

                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateUser}
                      className="p-2 text-green-600 hover:text-green-700 
                               dark:text-green-500 dark:hover:text-green-400"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="p-2 text-gray-600 hover:text-gray-700 
                               dark:text-gray-500 dark:hover:text-gray-400"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <UserIcon className="h-10 w-10 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : user.role === 'manager'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {user.role === 'admin' ? 'مدیر' : user.role === 'manager' ? 'مدیر ارشد' : 'کاربر'}
                    </span>

                    <button
                      onClick={() => handleStartEditing(user)}
                      className="p-2 text-blue-600 hover:text-blue-700 
                               dark:text-blue-500 dark:hover:text-blue-400"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({
                        isOpen: true,
                        userId: user._id,
                        username: user.username
                      })}
                      className="p-2 text-red-600 hover:text-red-700 
                               dark:text-red-500 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onConfirm={() => {
          if (deleteConfirm.userId) {
            onDeleteUser(deleteConfirm.userId);
            setDeleteConfirm({ isOpen: false, userId: null, username: '' });
          }
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, userId: null, username: '' })}
        username={deleteConfirm.username}
      />
    </div>
  );
};

export default AccessControlSection;