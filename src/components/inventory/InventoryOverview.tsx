import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  X,
  ArrowUpDown,
  Package,
  Calendar 
} from 'lucide-react';
import moment from 'moment-jalaali';
import { db } from '../../database';
import type { Item } from '../../database/types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import NewItemDialog from './NewItemDialog';
import DatePicker, { DayValue } from '@hassanmojab/react-modern-calendar-datepicker';
import '@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css';

// Extend Item type to include createdAt
interface ExtendedItem extends Item {
  createdAt?: number;
}

// Define type for Persian date
type PersianDateType = {
  year: number;
  month: number;
  day: number;
} | null;

interface FilterState {
  search: string;
  name: string;
  code: string;
  department: string;
  minPrice: string;
  maxPrice: string;
  dateFrom: PersianDateType;
  dateTo: PersianDateType;
}

interface SortConfig {
  field: keyof ExtendedItem | undefined;
  direction: 'asc' | 'desc';
}

const initialFilterState: FilterState = {
  search: '',
  name: '',
  code: '',
  department: '',
  minPrice: '',
  maxPrice: '',
  dateFrom: null,
  dateTo: null
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
    const loadedMaterials = db.getMaterials().map(material => ({
      ...material,
      createdAt: Date.now() // Add createdAt field to existing materials
    }));
    setMaterials(loadedMaterials);

    const uniqueDepartments = Array.from(new Set(loadedMaterials.map(item => item.department)));
    setDepartments(uniqueDepartments);
  };

  const handleSort = (field: keyof ExtendedItem) => {
    setSortConfig(current => ({
      field,
      direction: 
        current?.field === field && current.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    }));
  };
  const handleAddItem = (item: { name: string; code: string; department: string; price: number }) => {
    const newMaterial: ExtendedItem = {
      id: '', // This will be set by the database
      name: item.name,
      code: item.code,
      department: item.department,
      price: item.price,
      type: 'material',
      createdAt: Date.now()
    };
    const addedMaterial = db.addMaterial(newMaterial);
    setMaterials(prevMaterials => [...prevMaterials, { ...addedMaterial, createdAt: Date.now() }]);
    setShowNewItemDialog(false);
    loadData();
  };

  const handleDelete = () => {
    if (deleteConfirm.id && db.deleteMaterial(deleteConfirm.id)) {
      setMaterials(materials.filter(m => m.id !== deleteConfirm.id));
      loadData();
    }
    setDeleteConfirm({ isOpen: false, id: '', name: '' });
  };

  const clearFilters = () => {
    setFilters(initialFilterState);
    setSortConfig({ field: undefined, direction: 'asc' });
  };

  const handleDateChange = (
    key: 'dateFrom' | 'dateTo',
    value: DayValue
  ): void => {
    setFilters(prev => ({
      ...prev,
      [key]: value as PersianDateType
    }));
  };

  const convertToTimestamp = (date: PersianDateType): number | null => {
    if (!date) return null;
    return moment(`${date.year}/${date.month}/${date.day}`, 'jYYYY/jM/jD').valueOf();
  };

  const dateToString = (date: PersianDateType): string => {
    if (!date) return '';
    return `${date.year}/${String(date.month).padStart(2, '0')}/${String(date.day).padStart(2, '0')}`;
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

    const matchesDepartment = !filters.department || 
      material.department.toLowerCase().includes(filters.department.toLowerCase());

    const matchesMinPrice = !filters.minPrice || 
      material.price >= parseFloat(filters.minPrice);

    const matchesMaxPrice = !filters.maxPrice || 
      material.price <= parseFloat(filters.maxPrice);

    // Date filtering
    const materialDate = material.createdAt || 0;
    const dateFrom = convertToTimestamp(filters.dateFrom);
    const dateTo = convertToTimestamp(filters.dateTo);

    const matchesDateFrom = !dateFrom || materialDate >= dateFrom;
    const matchesDateTo = !dateTo || materialDate <= dateTo;

    return matchesSearch && matchesName && matchesCode && 
           matchesDepartment && matchesMinPrice && matchesMaxPrice &&
           matchesDateFrom && matchesDateTo;
  }).sort((a, b) => {
    if (!sortConfig.field) return 0;

    const valueA = sortConfig.field in a ? a[sortConfig.field] : null;
    const valueB = sortConfig.field in b ? b[sortConfig.field] : null;

    // Handle null/undefined values
    if (valueA === null && valueB === null) return 0;
    if (valueA === null) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valueB === null) return sortConfig.direction === 'asc' ? 1 : -1;

    // Type guard for string/number comparison
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortConfig.direction === 'asc' 
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
    
    // Handle number comparison
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortConfig.direction === 'asc' 
        ? valueA - valueB 
        : valueB - valueA;
    }

    // Default case: convert to strings and compare
    return sortConfig.direction === 'asc'
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA));
  });
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

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
        {/* Global Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="جستجوی کلی..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
          >
            <Filter className="h-4 w-4" />
            {showAdvancedFilters ? 'مخفی کردن فیلترها' : 'نمایش فیلترهای پیشرفته'}
          </button>
          {(Object.values(filters).some(value => 
            value !== '' && value !== null) ||
            filters.dateFrom !== null || 
            filters.dateTo !== null
          ) && (
            <button
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-600 flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              پاک کردن فیلترها
            </button>
          )}
        </div>
        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {/* Basic Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام ماده اولیه
              </label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                کد
              </label>
              <input
                type="text"
                value={filters.code}
                onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                گروه
              </label>
              <select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">همه</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Date Range Pickers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                از تاریخ
              </label>
              <DatePicker
                value={filters.dateFrom}
                onChange={(date) => handleDateChange('dateFrom', date)}
                inputPlaceholder="انتخاب تاریخ"
                locale="fa"
                shouldHighlightWeekends
                inputClassName="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                              bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                colorPrimary="#3b82f6"
                colorPrimaryLight="rgba(59, 130, 246, 0.1)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                تا تاریخ
              </label>
              <DatePicker
                value={filters.dateTo}
                onChange={(date) => handleDateChange('dateTo', date)}
                inputPlaceholder="انتخاب تاریخ"
                locale="fa"
                shouldHighlightWeekends
                inputClassName="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                              bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                colorPrimary="#3b82f6"
                colorPrimaryLight="rgba(59, 130, 246, 0.1)"
                minimumDate={filters.dateFrom || undefined}
              />
            </div>
            {/* Price Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                حداقل قیمت
              </label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                حداکثر قیمت
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Materials List */}
      {filteredMaterials.length > 0 ? (
        <div className="space-y-4">
          {filteredMaterials.map(material => (
            <div key={material.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{material.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">کد: {material.code}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    گروه: {material.department}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    قیمت: {material.price.toLocaleString()} ریال
                  </p>
                  {material.createdAt && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      تاریخ ثبت: {moment(material.createdAt).format('jYYYY/jMM/jDD')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirm({
                      isOpen: true,
                      id: material.id,
                      name: material.name
                    })}
                    className="p-1.5 text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="flex flex-col items-center justify-center">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              موردی یافت نشد
            </p>
          </div>
        </div>
      )}
      {/* New Item Dialog */}
      {showNewItemDialog && (
        <NewItemDialog
          isOpen={true}
          type="material"
          onClose={() => setShowNewItemDialog(false)}
          onConfirm={handleAddItem}
          departments={departments}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        itemName={deleteConfirm.name}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        type="item"
      />

      {/* Date Picker Styles */}
      <style>
        {`
          .DatePicker {
            direction: rtl;
          }
          
          .Calendar {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-radius: 0.5rem;
          }

          .Calendar__weekDay {
            color: #6b7280;
          }

          .Calendar__day.-selected {
            background-color: #3b82f6 !important;
            color: white;
          }

          .Calendar__day.-today {
            border-color: #3b82f6;
          }

          .Calendar__day:hover {
            background-color: rgba(59, 130, 246, 0.1);
          }
        `}
      </style>
    </div>
  );
}