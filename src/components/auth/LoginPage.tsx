import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User as UserIcon, Lock } from 'lucide-react';
import moment from 'moment-jalaali';
import DarkModeToggle from '../layout/DarkModeToggle';
import AnalogClock from '../layout/AnalogClock';
import { validateCredentials, setCurrentUser } from '../../utils/auth';

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

interface FormData {
  username: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username && !formData.password) {
      setError('لطفا رمز عبور و نام کاربری را وارد کنید');
      return;
    }

    if (!formData.username) {
      setError('لطفا نام کاربری را وارد کنید');
      return;
    }

    if (!formData.password) {
      setError('لطفا رمز عبور را وارد کنید');
      return;
    }

    // Check if credentials are valid
    if (validateCredentials(formData.username, formData.password)) {
      // For default admin, always set role as admin
      const role = (formData.username === 'Admin' && formData.password === 'Admin') ? 'admin' : 'user';
      setCurrentUser(formData.username, role);
      navigate('/dashboard');
    } else {
      setError('نام کاربری یا رمز عبور اشتباه است');
    }
  };

  // Format Shamsi date
  const shamsiDate = moment(currentTime).format('jYYYY/jMM/jDD');
  const englishDayOfWeek = moment(currentTime).format('dddd');
  const dayOfWeek = persianWeekdays[englishDayOfWeek] || englishDayOfWeek;
  const timeString = moment(currentTime).format('HH:mm:ss');

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 grid grid-cols-12 gap-4 opacity-5 dark:opacity-[0.02] pointer-events-none">
        {Array.from({ length: 144 }).map((_, i) => (
          <div key={i} className="aspect-square bg-black dark:bg-white rounded-full"></div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* Left Side - Clock and Date */}
          <div className="hidden md:flex flex-col items-center justify-center p-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl">
            <div className="mb-8">
              <AnalogClock size={240} />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800 dark:text-white mb-2 font-mono">
                {timeString}
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {shamsiDate}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {dayOfWeek}
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-200/50 dark:border-gray-700/50">
            {/* Logo/Title Section */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                سیستم مدیریت رستوران
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                لطفا برای ورود به سیستم، اطلاعات خود را وارد کنید
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                  نام کاربری
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition duration-150 ease-in-out"
                    placeholder="نام کاربری خود را وارد کنید"
                  />
                  <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                  رمز عبور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition duration-150 ease-in-out"
                    placeholder="رمز عبور خود را وارد کنید"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-500 dark:text-red-400 text-sm text-center p-3 bg-red-50 dark:bg-red-900/20 
                              rounded-md border border-red-200 dark:border-red-900/30">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 
                         text-white rounded-lg font-medium shadow-sm
                         transition duration-150 ease-in-out
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         dark:focus:ring-offset-gray-800"
              >
                ورود به سیستم
              </button>

              {/* Clock and Date for Mobile */}
              <div className="md:hidden text-center pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="mb-4">
                  <AnalogClock size={160} />
                </div>
                <p className="text-xl font-bold text-gray-800 dark:text-white mb-1 font-mono">
                  {timeString}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {shamsiDate} - {dayOfWeek}
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <DarkModeToggle />

      {/* Version Text */}
      <div className="absolute bottom-4 right-4 text-sm text-gray-500 dark:text-gray-400">
        نسخه 0.0.1
      </div>
    </div>
  );
}