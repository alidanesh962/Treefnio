import React, { useState } from 'react';
import BostonGraphSection from './BostonGraphSection';

export default function ReportingModule() {
  const [activeTab, setActiveTab] = useState('boston');

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 ${activeTab === 'boston' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('boston')}
        >
          تحلیل بوستون
        </button>
      </div>

      {activeTab === 'boston' && <BostonGraphSection />}
    </div>
  );
} 