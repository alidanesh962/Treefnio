import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Menu, X, Users, ChevronLeft, History, Database
} from 'lucide-react';
import DarkModeToggle from '../components/layout/DarkModeToggle';
import BackButton from '../components/layout/BackButton';
import LogoutConfirmDialog from '../components/common/LogoutConfirmDialog';
import AccessControlSection from '../components/settings/AccessControlSection';
import UserActivitySection from '../components/settings/UserActivitySection';
import BasicInfoSection from '../components/settings/BasicInfoSection';
import { getStoredUsers, saveUsers } from '../utils/storage';
import { getCurrentUser, clearCurrentUser } from '../utils/auth';
import { User, CurrentUser } from '../types';
import { useSocket } from '../utils/socketContext';

export default function Settings() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(getCurrentUser());
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('access-control');
  const [users, setUsers] = useState<User[]>(getStoredUsers());
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUsers(getStoredUsers());

    // Listen for settings updates from other clients
    if (socket) {
      socket.on('settingsUpdate', (data: { type: string; data: any }) => {
        switch (data.type) {
          case 'users':
            setUsers(data.data);
            saveUsers(data.data);
            break;
          // Add other settings types here as needed
          default:
            break;
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('settingsUpdate');
      }
    };
  }, [currentUser, navigate, socket]);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    clearCurrentUser();
    setShowLogoutDialog(false);
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const emitSettingsUpdate = (type: string, data: any) => {
    if (socket) {
      socket.emit('settingsUpdate', { type, data });
    }
  };

  const handleAddUser = (newUser: Omit<User, 'id'>) => {
    const maxId = Math.max(...users.map(user => user.id), 0);
    const user: User = {
      ...newUser,
      id: maxId + 1
    };
    const updatedUsers = [...users, user];
    saveUsers(updatedUsers);
    setUsers(updatedUsers);
    emitSettingsUpdate('users', updatedUsers);
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updatedUsers = users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    );
    saveUsers(updatedUsers);
    setUsers(updatedUsers);
    emitSettingsUpdate('users', updatedUsers);
  };

  const handleDeleteUser = (id: number) => {
    // Prevent deleting the last admin user
    const userToDelete = users.find(user => user.id === id);
    const remainingAdmins = users.filter(user => 
      user.id !== id && user.role === 'admin'
    ).length;

    if (userToDelete?.role === 'admin' && remainingAdmins === 0) {
      alert('نمی‌توان آخرین کاربر مدیر را حذف کرد');
      return;
    }

    // Prevent self-deletion
    if (userToDelete?.username === currentUser?.username) {
      alert('نمی‌توانید حساب کاربری خود را حذف کنید');
      return;
    }

    const updatedUsers = users.filter(user => user.id !== id);
    saveUsers(updatedUsers);
    setUsers(updatedUsers);
    emitSettingsUpdate('users', updatedUsers);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 transform ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-64'
        } bg-white dark:bg-gray-800 w-64 transition-transform duration-200 ease-in-out
        border-l border-gray-200 dark:border-gray-700 z-30`}
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">تنظیمات</h2>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        
        <nav className="mt-4">
          <button
            onClick={() => setActiveMenu('access-control')}
            className={`flex items-center w-full px-4 py-2 text-right
                      ${activeMenu === 'access-control' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <Users className="h-5 w-5 ml-2" />
            کاربران و دسترسی‌ها
            <ChevronLeft className="h-4 w-4 mr-auto" />
          </button>

          <button
            onClick={() => setActiveMenu('basic-info')}
            className={`flex items-center w-full px-4 py-2 text-right
                      ${activeMenu === 'basic-info' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <Database className="h-5 w-5 ml-2" />
            اطلاعات پایه
            <ChevronLeft className="h-4 w-4 mr-auto" />
          </button>

          <button
            onClick={() => setActiveMenu('user-activity')}
            className={`flex items-center w-full px-4 py-2 text-right
                      ${activeMenu === 'user-activity' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <History className="h-5 w-5 ml-2" />
            فعالیت کاربران
            <ChevronLeft className="h-4 w-4 mr-auto" />
          </button>
        </nav>
      </div>
      {/* Main Content Area */}
      <div className={`flex-1 ${isSidebarOpen ? 'mr-64' : 'mr-0'} transition-all duration-200`}>
        {/* Top Navigation Bar */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-4">
                <span className="text-gray-600 dark:text-gray-300">
                  {currentUser.username}
                </span>
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg
                           bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  خروج
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="p-8">
          {activeMenu === 'access-control' && (
            <AccessControlSection
              users={users}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onAddUser={handleAddUser}
            />
          )}

          {activeMenu === 'basic-info' && (
            <BasicInfoSection />
          )}

          {activeMenu === 'user-activity' && (
            <UserActivitySection users={users} />
          )}
        </main>
      </div>

      {/* Fixed Position Elements */}
      <DarkModeToggle />
      <BackButton />

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        username={currentUser.username}
      />
    </div>
  );
}