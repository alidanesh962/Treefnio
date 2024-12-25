// src/components/settings/ActivityFilters.tsx
import React from 'react';
import { PersianDateInput } from '../common/PersianDateInput';
import { formatToJalali, parseJalali, getCurrentJalaliDate } from '../../utils/dateUtils';

interface ActivityFiltersProps {
  dateRange: [string, string];
  onDateRangeChange: (range: [string, string]) => void;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  const handleDateChange = (index: number, value: string) => {
    const newRange = [...dateRange] as [string, string];
    newRange[index] = value;
    onDateRangeChange(newRange);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-4">
        <label className="text-gray-700 dark:text-gray-300">بازه زمانی:</label>
        <div className="flex items-center space-x-2">
          <PersianDateInput
            value={dateRange[0]}
            onChange={(value) => handleDateChange(0, value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="از تاریخ"
          />
          <span className="text-gray-500 dark:text-gray-400">تا</span>
          <PersianDateInput
            value={dateRange[1]}
            onChange={(value) => handleDateChange(1, value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="تا تاریخ"
          />
        </div>
      </div>
    </div>
  );
};