import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, FileSpreadsheet, Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { Item, MaterialUnit } from '../../types';
import { db } from '../../database';
import EditingTable from './EditingTable';
import MaterialImport from './MaterialImport';
import BulkEditDialog from './BulkEditDialog';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';

interface FilterState {
  search: string;
  name: string;
  code: string;
  department: string;
  unit: string;
  minPrice: string;
  maxPrice: string;
}

interface SortState {
  field: keyof Item | undefined;
  direction: 'asc' | 'desc';
}

const initialFilterState: FilterState = {
  search: '',
  name: '',
  code: '',
  department: '',
  unit: '',
  minPrice: '',
  maxPrice: ''
};
export default function EditingMP() {
  // State definitions
  const [items, setItems] = useState<Item[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [sort, setSort] = useState<SortState>({ field: undefined, direction: 'asc' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);

  // Effects
  useEffect(() => {
    loadAllItems();
    loadUnits();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [items, filters, sort]);

  // Load Functions
  const loadAllItems = () => {
    const materials = db.getMaterials().map(item => ({ ...item, type: 'material' as const }));
    setItems(materials);
  };

  const loadUnits = () => {
    setUnits(db.getMaterialUnits());
  };

  // Utility Functions
  const normalizeString = (str: string | number): string => {
    return String(str).toLowerCase().trim();
  };

  const isNumeric = (str: string): boolean => {
    if (typeof str !== 'string') return false;
    return !isNaN(parseFloat(str)) && isFinite(Number(str));
  };

  const getUnitName = (unitId: string): string => {
    return units.find(u => u.id === unitId)?.name || '';
  };
  // Sorting and Filtering Functions
  const applyFiltersAndSort = () => {
    let result = [...items];

    // Apply filters
    result = result.filter(item => {
      const matchesSearch = !filters.search || 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(filters.search.toLowerCase())
        );

      const matchesName = !filters.name || 
        item.name.toLowerCase().includes(filters.name.toLowerCase());

      const matchesCode = !filters.code || 
        item.code.toLowerCase().includes(filters.code.toLowerCase());

      const matchesDepartment = !filters.department || 
        item.department.toLowerCase().includes(filters.department.toLowerCase());

      const matchesUnit = !filters.unit || 
        getUnitName(item.unit || '').toLowerCase().includes(filters.unit.toLowerCase());

      const matchesMinPrice = !filters.minPrice || 
        item.price >= parseFloat(filters.minPrice);

      const matchesMaxPrice = !filters.maxPrice || 
        item.price <= parseFloat(filters.maxPrice);

      return matchesSearch && matchesName && matchesCode && 
             matchesDepartment && matchesUnit && 
             matchesMinPrice && matchesMaxPrice;
    });

    // Apply sorting - Fixed TypeScript error here
    if (sort.field) {
      result.sort((a, b) => {
        let valueA: string | number;
        let valueB: string | number;

        // Type guard to ensure sort.field exists
        if (!sort.field) {
          return 0;
        }

        // Handle special cases for different fields
        if (sort.field === 'unit') {
          valueA = getUnitName(sort.field in a && a[sort.field] ? String(a[sort.field]) : '');
          valueB = getUnitName(sort.field in b && b[sort.field] ? String(b[sort.field]) : '');
        } else if (sort.field === 'price') {
          valueA = sort.field in a ? Number(a[sort.field]) || 0 : 0;
          valueB = sort.field in b ? Number(b[sort.field]) || 0 : 0;
        } else {
          valueA = sort.field in a ? String(a[sort.field]) : '';
          valueB = sort.field in b ? String(b[sort.field]) : '';
        }

        // Normalize strings for comparison
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          valueA = normalizeString(valueA);
          valueB = normalizeString(valueB);
        }

        if (valueA < valueB) return sort.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredItems(result);
  };

  const handleSort = (field: keyof Item) => {
    setSort(prevSort => ({
      field,
      direction: 
        prevSort.field === field && prevSort.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilterState);
    setSort({ field: undefined, direction: 'asc' });
  };
  // Event Handlers for Bulk Operations
  const handleBulkEdit = (changes: Partial<Item>) => {
    selectedItems.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item) {
        const updatedItem = { ...item, ...changes };
        db.updateMaterial(updatedItem);
      }
    });
    loadAllItems();
    setShowBulkEdit(false);
    setSelectedItems([]);
  };

  const handleBulkDelete = () => {
    selectedItems.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item) {
        db.deleteMaterial(id);
      }
    });
    loadAllItems();
    setShowDeleteConfirm(false);
    setSelectedItems([]);
  };

  // Filter Change Handlers
  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  // Selection Handlers
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  // Import Handler
  const handleImportSuccess = () => {
    loadAllItems();
    setShowImportDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            ویرایش متریال
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white 
                       rounded-lg hover:bg-green-600 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              ورود گروهی
            </button>
            {selectedItems.length > 0 && (
              <>
                <button
                  onClick={() => setShowBulkEdit(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg
                           hover:bg-blue-600 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  ویرایش گروهی ({selectedItems.length})
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg
                           hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف گروهی
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="space-y-4">
          {/* Global Search */}
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="جستجوی کلی..."
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
            {Object.values(filters).some(value => value !== '') && (
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  نام
                </label>
                <input
                  type="text"
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
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
                  onChange={(e) => handleFilterChange('code', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  گروه
                </label>
                <input
                  type="text"
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  واحد
                </label>
                <select
                  value={filters.unit}
                  onChange={(e) => handleFilterChange('unit', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">همه واحدها</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  حداقل قیمت
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  حداکثر قیمت
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          نمایش {filteredItems.length} مورد از {items.length} مورد
        </div>
        {selectedItems.length > 0 && (
          <div className="text-sm text-blue-600 dark:text-blue-400">
            {selectedItems.length} مورد انتخاب شده
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
              </th>
              {[
                { key: 'name' as const, label: 'نام' },
                { key: 'code' as const, label: 'کد' },
                { key: 'department' as const, label: 'گروه' },
                { key: 'unit' as const, label: 'واحد' },
                { key: 'price' as const, label: 'قیمت' }
              ].map(column => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 
                           uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    <ArrowUpDown className={`h-4 w-4 ${
                      sort.field === column.key 
                        ? 'text-blue-500' 
                        : 'text-gray-400'
                    }`} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getUnitName(item.unit || '')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.price.toLocaleString()} ریال
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  موردی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      {showBulkEdit && (
        <BulkEditDialog
          isOpen={showBulkEdit}
          onClose={() => setShowBulkEdit(false)}
          onConfirm={handleBulkEdit}
          selectedCount={selectedItems.length}
          units={units}
        />
      )}

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        itemName={`${selectedItems.length} مورد انتخاب شده`}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {showImportDialog && (
        <MaterialImport
          onClose={() => setShowImportDialog(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
}