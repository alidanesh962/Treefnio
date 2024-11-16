import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Settings, 
  Package, 
  Bell, 
  ChevronDown, 
  BarChart2, 
  Users, 
  Calendar,
  DollarSign,
  Clock,
  Menu as MenuIcon,
  X,
  FileText
} from 'lucide-react';
import moment from 'moment-jalaali';
import DarkModeToggle from '../components/layout/DarkModeToggle';
import AnalogClock from '../components/layout/AnalogClock';
import LogoutConfirmDialog from '../components/common/LogoutConfirmDialog';
import { getCurrentUser, clearCurrentUser } from '../utils/auth';

// Configure Persian locale
moment.loadPersian({
  dialect: 'persian-modern',
  usePersianDigits: false
});

// Define Persian weekdays
const persianWeekdays: { [key: string]: string } = {
  'Saturday': 'شنبه',
  'Sunday': 'یکشنبه',
  'Monday': 'دوشنبه',
  'Tuesday': 'سه‌شنبه',
  'Wednesday': 'چهارشنبه',
  'Thursday': 'پنج‌شنبه',
  'Friday': 'جمعه'
};

// Sample notifications - In a real app, these would come from your backend
const notifications = [
  { id: 1, text: 'سفارش جدید: میز شماره ۵', time: '۵ دقیقه پیش' },
  { id: 2, text: 'موجودی رو به اتمام: نوشابه', time: '۱۵ دقیقه پیش' },
  { id: 3, text: 'گزارش روزانه آماده است', time: '۱ ساعت پیش' },
];

// Sample quick stats
const quickStats = [
  { id: 1, title: 'سفارشات امروز', value: '۴۸', icon: BarChart2, color: 'text-blue-500' },
  { id: 2, title: 'تعداد میز‌های فعال', value: '۱۲', icon: Users, color: 'text-green-500' },
  { id: 3, title: 'رزرو‌های امروز', value: '۸', icon: Calendar, color: 'text-purple-500' },
  { id: 4, title: 'درآمد امروز', value: '۲,۵۴۰,۰۰۰', icon: DollarSign, color: 'text-yellow-500' },
];
export default function Dashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Redirect to login if no user is logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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

  // Format Shamsi date
  const shamsiDate = moment(currentTime).format('jYYYY/jMM/jDD');
  const englishDayOfWeek = moment(currentTime).format('dddd');
  const dayOfWeek = persianWeekdays[englishDayOfWeek] || englishDayOfWeek;
  const timeString = moment(currentTime).format('HH:mm:ss');

  if (!currentUser) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </button>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white mr-4">
                داشبورد مدیریت
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 
                                border border-gray-200 dark:border-gray-700">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <p className="text-sm text-gray-800 dark:text-white">
                          {notification.text}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="text-gray-800 dark:text-white">
                    {currentUser.username}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2
                                border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleLogoutClick}
                      className="w-full px-4 py-2 text-right text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700/50
                               flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      خروج
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map(stat => (
            <div key={stat.id} 
                 className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6
                          border border-gray-200/50 dark:border-gray-700/50
                          hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-700 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold text-gray-800 dark:text-white font-mono">
                  {stat.value}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </h3>
            </div>
          ))}
        </div>

        {/* Main Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clock and Date Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col items-center">
              <div className="mb-6">
                <AnalogClock size={200} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800 dark:text-white mb-2 font-mono">
                  {timeString}
                </p>
                <p className="text-lg font-bold text-gray-800 dark:text-white">
                  {shamsiDate}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {dayOfWeek}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 
                         border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
              دسترسی سریع
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20
                         hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors
                         border border-blue-200/50 dark:border-blue-900/50"
              >
                <Settings className="h-6 w-6 text-blue-500" />
                <span className="text-blue-700 dark:text-blue-300 font-medium">تنظیمات</span>
              </button>
              

              <button
                onClick={() => navigate('/production')}
                className="flex items-center gap-3 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20
                        hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors
                        border border-indigo-200/50 dark:border-indigo-900/50"
              >
                <Package className="h-6 w-6 text-indigo-500" />
                <span className="text-indigo-700 dark:text-indigo-300 font-medium">ماژول تولید</span>
              </button>

              <button
                onClick={() => navigate('/sales')}
                className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20
                        hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors
                        border border-yellow-200/50 dark:border-yellow-900/50"
              >
                <DollarSign className="h-6 w-6 text-yellow-500" />
                <span className="text-yellow-700 dark:text-yellow-300 font-medium">ماژول فروش</span>
              </button>
              <button
                onClick={() => navigate('/inventory')}
                className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20
                         hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors
                         border border-green-200/50 dark:border-green-900/50"
              >
                <Package className="h-6 w-6 text-green-500" />
                <span className="text-green-700 dark:text-green-300 font-medium">مدیریت انبار</span>
              </button>
              

                <button
                  onClick={() => navigate('/reports')}
                  className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20
                          hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors
                          border border-purple-200/50 dark:border-purple-900/50"
                >
                  <FileText className="h-6 w-6 text-purple-500" />
                  <span className="text-purple-700 dark:text-purple-300 font-medium">گزارش گیری و خروجی</span>
                </button>
            </div>
          </div>
        </div>
      </main>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-50"
          ></div>
          
          {/* Menu Content */}
          <div className="fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-800 shadow-lg
                        border-l border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">منو</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => navigate('/settings')}
                className="w-full flex items-center gap-3 p-3 rounded-lg
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings className="h-5 w-5 text-blue-500" />
                <span className="text-gray-800 dark:text-white">تنظیمات</span>
              </button>

              <button
                onClick={() => navigate('/inventory')}
                className="w-full flex items-center gap-3 p-3 rounded-lg
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Package className="h-5 w-5 text-green-500" />
                <span className="text-gray-800 dark:text-white">مدیریت انبار</span>
              </button>

              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 p-3 rounded-lg
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                         text-red-500"
              >
                <LogOut className="h-5 w-5" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dark Mode Toggle */}
      <DarkModeToggle />

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        username={currentUser.username}
      />

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            نسخه ۱.۰.۰ | آخرین بروزرسانی: {shamsiDate}
          </p>
        </div>
      </footer>
    </div>
  );
}