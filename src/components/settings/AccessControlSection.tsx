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
      {/* Your JSX implementation */}
    </div>
  );
};

export default AccessControlSection;