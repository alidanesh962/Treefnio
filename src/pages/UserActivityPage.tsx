import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { getCurrentUser } from '../utils/auth';
import { getUserActivitiesByDate, UserActivityDetails } from '../utils/userActivity';
import { UserActivity } from '../types';

interface ActivityModalProps {
  date: string;
  activities: UserActivity[];
  onClose: () => void;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ date, activities, onClose }) => {
  const formatActivityDetails = (activity: UserActivity) => {
    if (activity.type === 'login') return 'ورود به سیستم';
    if (activity.type === 'logout') return 'خروج از سیستم';

    try {
      if (!activity.details) return '';
      const details: UserActivityDetails = JSON.parse(activity.details);
      const actionText = {
        create: 'ایجاد',
        edit: 'ویرایش',
        delete: 'حذف'
      }[details.action];

      return `${actionText} ${details.itemType}${details.itemName ? ` "${details.itemName}"` : ''} در بخش ${details.module}`;
    } catch {
      return activity.details || '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            فعالیت‌های {new Date(date).toLocaleDateString('fa-IR')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          {activities.map(activity => (
            <div
              key={activity.id}
              className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <p className="text-gray-900 dark:text-white">
                {formatActivityDetails(activity)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function UserActivityPage() {
  const navigate = useNavigate();
  const [currentUser] = useState(getCurrentUser());
  const [groupedActivities, setGroupedActivities] = useState<{ [date: string]: UserActivity[] }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<{ [username: string]: boolean }>({});

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Load activities
    const activities = getUserActivitiesByDate();
    setGroupedActivities(activities as { [key: string]: UserActivity[] });
  }, [currentUser, navigate]);

  const toggleUserExpansion = (username: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  if (!currentUser) return null;

  // Group activities by user for each date
  const groupByUser = (activities: UserActivity[]) => {
    const userGroups: { [username: string]: { name: string; username: string } } = {};
    activities.forEach(activity => {
      if (!userGroups[activity.username]) {
        userGroups[activity.username] = {
          name: activity.username, // In a real app, you'd want to fetch the full name
          username: activity.username
        };
      }
    });
    return Object.values(userGroups);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          فعالیت‌های کاربران
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {Object.entries(groupedActivities).map(([date, activities]) => (
            <div key={date} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {new Date(date).toLocaleDateString('fa-IR')}
                </h2>

                <div className="space-y-3">
                  {groupByUser(activities).map(user => (
                    <div key={user.username} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <button
                        onClick={() => toggleUserExpansion(user.username)}
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user.username}
                          </p>
                        </div>
                        {expandedUsers[user.username] ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>

                      {expandedUsers[user.username] && (
                        <div className="px-4 pb-4">
                          <button
                            onClick={() => setSelectedDate(date)}
                            className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            مشاهده جزئیات فعالیت‌ها
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedDate && (
        <ActivityModal
          date={selectedDate}
          activities={groupedActivities[selectedDate]}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
} 