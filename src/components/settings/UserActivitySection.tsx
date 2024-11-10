    // src/components/settings/UserActivitySection.tsx
    import React, { useState, useEffect } from 'react';
    import { Search, LogIn, LogOut, RefreshCw, UserCheck, Clock } from 'lucide-react';
    import moment from 'moment-jalaali';
    import { User } from '../../types';
    import { useUserActivity } from '../../hooks/useUserActivity';
    
    interface UserActivitySectionProps {
      users: User[];
    }
    
    export const UserActivitySection: React.FC<UserActivitySectionProps> = ({ users }) => {
      const [selectedUser, setSelectedUser] = useState<string>('');
      const [searchQuery, setSearchQuery] = useState('');
      const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
      const { activities, loading, stats, refresh } = useUserActivity(selectedUser);
    
      useEffect(() => {
        const filtered = users.filter(user =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredUsers(filtered);
      }, [searchQuery, users]);
    
      const formatDateTime = (timestamp: number) => {
        return moment(timestamp).format('jYYYY/jMM/jDD HH:mm:ss');
      };
    
      return (
        <div className="space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">کل فعالیت‌ها</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800 dark:text-white">{stats.total}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">فعالیت‌های امروز</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800 dark:text-white">{stats.today}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <LogIn className="h-5 w-5 text-indigo-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">تعداد ورود</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800 dark:text-white">{stats.logins}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <LogOut className="h-5 w-5 text-orange-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">تعداد خروج</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800 dark:text-white">{stats.logouts}</span>
                </div>
              </div>
            </div>
          )}
    
          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                گزارش ورود و خروج کاربران
              </h3>
              <button
                onClick={refresh}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 
                         text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 
                         dark:hover:bg-blue-900/40 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                بروزرسانی
              </button>
            </div>
    
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="جستجوی کاربر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
    
              {searchQuery && (
                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user.username);
                        setSearchQuery('');
                      }}
                      className="w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700
                               text-gray-800 dark:text-white"
                    >
                      {user.username}
                    </button>
                  ))}
                </div>
              )}
    
              {selectedUser && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-blue-700 dark:text-blue-300">
                    نمایش گزارش برای: {selectedUser}
                  </span>
                  <button
                    onClick={() => setSelectedUser('')}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    نمایش همه
                  </button>
                </div>
              )}
            </div>
          </div>
    
          {/* Activity List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500 dark:text-gray-400">در حال بارگذاری...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">هیچ فعالیتی ثبت نشده است</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {activities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {activity.type === 'login' ? (
                        <LogIn className="h-5 w-5 text-green-500" />
                      ) : (
                        <LogOut className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {activity.username}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.type === 'login' ? 'ورود به سیستم' : 'خروج از سیستم'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-gray-900 dark:text-white font-mono">
                        {formatDateTime(activity.timestamp)}
                      </p>
                      {activity.details && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    };
    
    export default UserActivitySection;