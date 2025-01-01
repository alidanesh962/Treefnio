import React, { useState } from 'react';
import { Package, Database, Archive, Layers } from 'lucide-react';
import UnitsManagement from './UnitsManagement';
import DepartmentsManagement from './DepartmentsManagement';
import MaterialValuesManagement from './MaterialValuesManagement';
import MaterialGroupsManagement from './MaterialGroupsManagement';

interface TabOption {
  id: 'units' | 'departments' | 'material-values' | 'material-groups';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabOption[] = [
  { id: 'units', label: 'واحدهای اندازه‌گیری', icon: Package },
  { id: 'departments', label: 'بخش‌ها و گروه‌ها', icon: Database },
  { id: 'material-values', label: 'انبار ها', icon: Archive },
  { id: 'material-groups', label: 'گروه مواد اولیه', icon: Layers },
];

export default function BasicInfoSection() {
  const [activeTab, setActiveTab] = useState<'units' | 'departments' | 'material-values' | 'material-groups'>('units');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          مدیریت اطلاعات پایه
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          در این بخش می‌توانید اطلاعات پایه سیستم را مدیریت کنید
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <tab.icon className={`h-5 w-5 ${
                activeTab === tab.id
                  ? 'text-blue-500'
                  : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'units' && <UnitsManagement />}
        {activeTab === 'departments' && <DepartmentsManagement />}
        {activeTab === 'material-values' && <MaterialValuesManagement />}
        {activeTab === 'material-groups' && <MaterialGroupsManagement />}
      </div>
    </div>
  );
}