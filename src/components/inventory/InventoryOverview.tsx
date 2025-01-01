import React, { useState, useEffect } from 'react';
import { Plus, Filter, X, Calendar } from 'lucide-react';
import { db } from '../../database';
import { formatToJalali } from '../../utils/dateUtils';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import NewItemDialog from './NewItemDialog';
import DatePicker, { DayValue } from '@hassanmojab/react-modern-calendar-datepicker';
import '@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css';
import moment from 'moment-jalaali';
import type { Item } from '../../database/types';

// Extend Item type to include createdAt
interface ExtendedItem extends Item {
  createdAt?: number;
}

interface FilterState {
  search: string;
  name: string;
  code: string;
  dateFrom: DayValue;
  dateTo: DayValue;
  category: string;
  department: string;
  minPrice: string;
  maxPrice: string;
}

interface SortConfig {
  field: keyof ExtendedItem | undefined;
  direction: 'asc' | 'desc';
}

const initialFilterState: FilterState = {
  search: '',
  name: '',
  code: '',
  dateFrom: null,
  dateTo: null,
  category: 'all',
  department: 'all',
  minPrice: '',
  maxPrice: ''
};

export default function InventoryOverview() {
  const [materials, setMaterials] = useState<ExtendedItem[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: undefined, direction: 'asc' });
  const [showNewItemDialog, setShowNewItemDialog] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedMaterials = db.getMaterials().map((material: Item) => ({
      ...material,
      createdAt: Date.now()
    }));
    setMaterials(loadedMaterials);

    const uniqueDepartments = Array.from(new Set(loadedMaterials.map((item: Item) => item.department))) as string[];
    setDepartments(uniqueDepartments);
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', date: DayValue) => {
    setFilters(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const convertToTimestamp = (date: DayValue): number | null => {
    if (!date) return null;
    return moment(`${date.year}/${date.month}/${date.day}`, 'jYYYY/jM/jD').valueOf();
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = !filters.search || 
      Object.values(material).some(value => 
        String(value).toLowerCase().includes(filters.search.toLowerCase())
      );

    const matchesName = !filters.name || 
      material.name.toLowerCase().includes(filters.name.toLowerCase());

    const matchesCode = !filters.code || 
      material.code.toLowerCase().includes(filters.code.toLowerCase());

    const matchesDepartment = !filters.department || filters.department === 'all' || 
      material.department === filters.department;

    const matchesMinPrice = !filters.minPrice || 
      material.price >= parseFloat(filters.minPrice);

    const matchesMaxPrice = !filters.maxPrice || 
      material.price <= parseFloat(filters.maxPrice);

    const materialDate = material.createdAt || 0;
    const dateFrom = convertToTimestamp(filters.dateFrom);
    const dateTo = convertToTimestamp(filters.dateTo);

    const matchesDateFrom = !dateFrom || materialDate >= dateFrom;
    const matchesDateTo = !dateTo || materialDate <= dateTo;

    return matchesSearch && matchesName && matchesCode && 
           matchesDepartment && matchesMinPrice && matchesMaxPrice &&
           matchesDateFrom && matchesDateTo;
  });

  const handleAddItem = async (item: { name: string; code: string; department: string; price: number }) => {
    const newItem = db.addMaterial({ ...item, type: 'material' });
    loadData();
    setShowNewItemDialog(false);
  };

  const handleDelete = async () => {
    if (deleteConfirm.id) {
      db.deleteMaterial(deleteConfirm.id);
      loadData();
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          موجودی انبار
        </h2>
        <button
          onClick={() => setShowNewItemDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                   rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          افزودن ماده اولیه
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Date Range */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <DatePicker
              value={filters.dateFrom}
              onChange={(date: DayValue) => handleDateChange('dateFrom', date)}
              inputPlaceholder="از تاریخ"
              locale="fa"
              shouldHighlightWeekends
              inputClassName="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <span className="text-gray-500 dark:text-gray-400">تا</span>
          <div className="flex-1">
            <DatePicker
              value={filters.dateTo}
              onChange={(date: DayValue) => handleDateChange('dateTo', date)}
              inputPlaceholder="تا تاریخ"
              locale="fa"
              shouldHighlightWeekends
              inputClassName="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 dark:text-gray-400">نام</label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-600 dark:text-gray-400">کد</label>
              <input
                type="text"
                value={filters.code}
                onChange={(e) => handleFilterChange('code', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-600 dark:text-gray-400">بخش</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-600 dark:text-gray-400">قیمت</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="حداقل"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-1/2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="حداکثر"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-1/2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Filter Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
          >
            {showAdvancedFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            {showAdvancedFilters ? 'بستن فیلترها' : 'فیلترهای پیشرفته'}
          </button>

          {(filters.search || filters.name || filters.code || filters.department !== 'all' || 
            filters.minPrice || filters.maxPrice || filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => setFilters(initialFilterState)}
              className="text-red-500 hover:text-red-600 transition-colors"
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  نام
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  کد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  گروه
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  قیمت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMaterials.map((material) => (
                <tr key={material.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {material.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {material.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {material.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {material.price.toLocaleString()} ریال
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, id: material.id, name: material.name })}
                      className="text-red-500 hover:text-red-600 transition-colors"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <NewItemDialog
        isOpen={showNewItemDialog}
        type="material"
        onClose={() => setShowNewItemDialog(false)}
        onConfirm={handleAddItem}
        departments={departments}
      />

      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        itemName={deleteConfirm.name}
      />
    </div>
  );
} 