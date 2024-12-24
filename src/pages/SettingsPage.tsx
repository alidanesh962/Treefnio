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
import DataManagementSection from '../components/settings/DataManagementSection';
import { getCurrentUser, clearCurrentUser } from '../utils/auth';
import { useSocket } from '../utils/socketContext';
import type { IUser, NewUser } from '../models/User';

interface CurrentUser {
  username: string;
  role: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(getCurrentUser());
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('data-management');
  const [users, setUsers] = useState<IUser[]>([]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch('https://treefnio.vercel.app/api/users', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      });
      if (response.ok) {
        const result: ApiResponse<IUser[]> = await response.json();
        if (result.data) {
          setUsers(result.data);
        }
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchUsers();
  }, [currentUser, navigate]);

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

  const handleUpdateUser = async (user: IUser): Promise<void> => {
    try {
      const response = await fetch('https://treefnio.vercel.app/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(user),
      });
      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (id: string): Promise<void> => {
    try {
      const response = await fetch('https://treefnio.vercel.app/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleAddUser = async (user: NewUser): Promise<void> => {
    try {
      const response = await fetch('https://treefnio.vercel.app/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(user),
      });
      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
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
            onClick={() => setActiveMenu('data-management')}
            className={`flex items-center w-full px-4 py-2 text-right
                      ${activeMenu === 'data-management' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <Database className="h-5 w-5 ml-2" />
            مدیریت داده‌ها
            <ChevronLeft className="h-4 w-4 mr-auto" />
          </button>

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
          {activeMenu === 'data-management' && <DataManagementSection />}
          {activeMenu === 'access-control' && (
            <AccessControlSection
              users={users}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onAddUser={handleAddUser}
            />
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