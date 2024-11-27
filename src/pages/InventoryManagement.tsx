import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Menu, 
  X, 
  Package, 
  ChevronLeft,
  ArrowRightLeft,
  ArrowDown,
  ArrowUp,
  Edit3,
  BarChart2
} from 'lucide-react';
import DarkModeToggle from '../components/layout/DarkModeToggle';
import BackButton from '../components/layout/BackButton';
import LogoutConfirmDialog from '../components/common/LogoutConfirmDialog';
import InventoryOverview from '../components/inventory/InventoryOverview';
import EditingMP from '../components/inventory/EditingMP';
import { getCurrentUser, clearCurrentUser } from '../utils/auth';
import { CurrentUser } from '../types';

export default function InventoryManagement() {
  const navigate = useNavigate();
  const [currentUser] = useState<CurrentUser | null>(getCurrentUser());
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('live-inventory');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
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

  const menuItems = [
    {
      id: 'live-inventory',
      label: 'موجودی لحظه‌ای',
      icon: Package
    },
    {
      id: 'incoming',
      label: 'ثبت ورودی',
      icon: ArrowDown
    },
    {
      id: 'outgoing',
      label: 'ثبت خروجی',
      icon: ArrowUp
    },
    {
      id: 'materials-edit',
      label: 'ویرایش مواد اولیه',
      icon: Edit3
    },
    {
      id: 'reports',
      label: 'گزارشات',
      icon: BarChart2
    }
  ];

  const getMenuContent = () => {
    switch (activeMenu) {
      case 'live-inventory':
        return <InventoryOverview />;
      case 'materials-edit':
        return <EditingMP />;
      // We'll implement these components later
      case 'incoming':
      case 'outgoing':
      case 'reports':
        return (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {menuItems.find(item => item.id === activeMenu)?.label}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              این بخش در حال توسعه است...
            </p>
          </div>
        );
      default:
        return null;
    }
  };

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
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">مدیریت انبار</h2>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        
        <nav className="mt-4">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`flex items-center w-full px-4 py-2 text-right
                      ${activeMenu === item.id 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <item.icon className="h-5 w-5 ml-2" />
              {item.label}
              <ChevronLeft className="h-4 w-4 mr-auto" />
            </button>
          ))}
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
          {getMenuContent()}
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