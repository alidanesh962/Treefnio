// src/pages/ProductionModule.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Menu, X, Package, ChevronLeft, 
  Settings, Factory, Plus
} from 'lucide-react';
import DarkModeToggle from '../components/layout/DarkModeToggle';
import BackButton from '../components/layout/BackButton';
import LogoutConfirmDialog from '../components/common/LogoutConfirmDialog';
import { getCurrentUser, clearCurrentUser } from '../utils/auth';
import { CurrentUser } from '../types';

export default function ProductionModule() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(getCurrentUser());
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('define-product');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
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
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">ماژول تولید</h2>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        
        <nav className="mt-4">
          <button
            onClick={() => setActiveMenu('define-product')}
            className={`flex items-center w-full px-4 py-2 text-right
                      ${activeMenu === 'define-product' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <Plus className="h-5 w-5 ml-2" />
            تعریف محصول
            <ChevronLeft className="h-4 w-4 mr-auto" />
          </button>

          {/* Additional menu items can be added here */}
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
          {activeMenu === 'define-product' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                تعریف محصول
              </h1>
              {/* Content for تعریف محصول will go here */}
            </div>
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