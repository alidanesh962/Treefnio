    // src/components/settings/UserActivitySection.tsx
    import React, { useState } from 'react';
    import { useUserActivity } from '../../hooks/useUserActivity';
    import type { IUser } from '../../models/User';
    import type { UserActivity } from '../../types';
    import { X } from 'lucide-react';
    import { logUserActivity } from '../../utils/userActivity';
    
    interface UserActivitySectionProps {
      users: IUser[];
    }
    
    interface ActivityModalProps {
      date: string;
      activities: UserActivity[];
      onClose: () => void;
    }
    
    const ActivityModal: React.FC<ActivityModalProps> = ({ date, activities, onClose }) => {
      const formatActivity = (activity: UserActivity) => {
        switch (activity.type) {
          case 'login':
            return 'ورود به سیستم';
          case 'logout':
            return 'خروج از سیستم';
          case 'create':
            return `ایجاد در بخش ${activity.module}`;
          case 'edit':
            return `ویرایش در بخش ${activity.module}`;
          case 'delete':
            return `حذف در بخش ${activity.module}`;
          default:
            return `عملیات ${activity.type} در بخش ${activity.module}`;
        }
      };

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Activities on {new Date(date).toLocaleDateString()}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <p className="text-gray-900 dark:text-white">
                    {formatActivity(activity)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };
    
    const UserActivitySection: React.FC<UserActivitySectionProps> = ({ users }) => {
      const { activities, loading, refresh } = useUserActivity();
      const [selectedDate, setSelectedDate] = useState<string | null>(null);
      
      console.log('Raw activities:', activities);
      console.log('Users:', users);
      
      // Group activities by date and user
      const groupedActivities = React.useMemo(() => {
        const groups: { [key: string]: { [key: string]: UserActivity[] } } = {};
        
        activities.forEach(activity => {
          const date = new Date(activity.timestamp).toISOString().split('T')[0];
          if (!groups[date]) {
            groups[date] = {};
          }
          if (!groups[date][activity.username]) {
            groups[date][activity.username] = [];
          }
          groups[date][activity.username].push(activity);
        });
        
        console.log('Grouped activities:', groups);
        
        // Sort dates in descending order
        return Object.entries(groups)
          .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
          .reduce((acc, [date, users]) => {
            acc[date] = users;
            return acc;
          }, {} as { [key: string]: { [key: string]: UserActivity[] } });
      }, [activities]);

      const addTestActivity = () => {
        logUserActivity(
          'Admin',
          'Administrator',
          'login',
          'auth',
          'Test login activity'
        );
        refresh();
      };

      if (loading) {
        return (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        );
      }

      if (Object.keys(groupedActivities).length === 0) {
        return (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No activity records found</p>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Activities</h2>
            <button
              onClick={addTestActivity}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Test Activity
            </button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(groupedActivities).map(([date, userActivities]) => (
              <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {new Date(date).toLocaleDateString()}
                </h3>
                
                <div className="space-y-2">
                  {Object.entries(userActivities).map(([username, userDayActivities]) => {
                    const user = users.find(u => u.username === username);
                    const displayName = user ? user.name : username;
                    
                    const loginCount = userDayActivities.filter(a => a.type === 'login').length;
                    const otherActivities = userDayActivities.filter(a => !['login', 'logout'].includes(a.type));
                    
                    return (
                      <button
                        key={username}
                        onClick={() => setSelectedDate(date)}
                        className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{displayName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{username}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {loginCount > 0 && `${loginCount} login${loginCount > 1 ? 's' : ''}`}
                              {loginCount > 0 && otherActivities.length > 0 && ' • '}
                              {otherActivities.length > 0 && `${otherActivities.length} operation${otherActivities.length > 1 ? 's' : ''}`}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {selectedDate && (
            <ActivityModal
              date={selectedDate}
              activities={Object.values(groupedActivities[selectedDate]).flat()}
              onClose={() => setSelectedDate(null)}
            />
          )}
        </div>
      );
    };
    
    export default UserActivitySection;