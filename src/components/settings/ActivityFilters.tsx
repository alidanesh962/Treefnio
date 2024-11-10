// src/components/settings/ActivityFilters.tsx
import React from 'react';
import { Filter } from 'lucide-react';
import moment from 'moment-jalaali';

interface ActivityFiltersProps {
  dateRange: [Date | null, Date | null];
  activityType: 'all' | 'login' | 'logout';
  onDateRangeChange: (range: [Date | null, Date | null]) => void;
  onActivityTypeChange: (type: 'all' | 'login' | 'logout') => void;
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  dateRange,
  activityType,
  onDateRangeChange,
  onActivityTypeChange
}) => {
  const [startDate, endDate] = dateRange;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-gray-400" />
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">فیلترها</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date Range */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-600 dark:text-gray-400">بازه زمانی</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate ? moment(startDate).format('YYYY-MM-DD') : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                onDateRangeChange([date, endDate]);
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <span className="text-gray-500 dark:text-gray-400 self-center">تا</span>
            <input
              type="date"
              value={endDate ? moment(endDate).format('YYYY-MM-DD') : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                onDateRangeChange([startDate, date]);
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Activity Type */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-600 dark:text-gray-400">نوع فعالیت</label>
          <select
            value={activityType}
            onChange={(e) => onActivityTypeChange(e.target.value as 'all' | 'login' | 'logout')}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">همه</option>
            <option value="login">ورود</option>
            <option value="logout">خروج</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ActivityFilters;