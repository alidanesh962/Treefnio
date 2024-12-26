import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  Package, 
  FileText, 
  Users,
  Activity
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'داشبورد' },
    { path: '/inventory', icon: Package, label: 'انبار' },
    { path: '/reports', icon: FileText, label: 'گزارشات' },
    { path: '/settings', icon: Settings, label: 'تنظیمات' },
    { path: '/user-activities', icon: Activity, label: 'فعالیت‌های کاربران' },
  ];

  return (
    <aside className={`bg-white dark:bg-gray-800 w-64 min-h-screen border-l border-gray-200 dark:border-gray-700 ${className}`}>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 