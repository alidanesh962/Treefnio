// src/components/settings/ActivityExport.tsx
import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { exportActivities } from '../../utils/userActivity';

interface ActivityExportProps {
  className?: string;
}

const ActivityExport: React.FC<ActivityExportProps> = ({ className = '' }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const data = await exportActivities(format);
      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activities.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting activities:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={() => handleExport('json')}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-50 dark:bg-indigo-900/30 
                 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 
                 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50"
      >
        <FileJson className="h-4 w-4" />
        خروجی JSON
      </button>
      <button
        onClick={() => handleExport('csv')}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-50 dark:bg-green-900/30 
                 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 
                 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
      >
        <FileSpreadsheet className="h-4 w-4" />
        خروجی CSV
      </button>
    </div>
  );
};

export default ActivityExport;