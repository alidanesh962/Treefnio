// src/components/inventory/EditingMP.tsx
import React, { useState, useEffect } from 'react';
import { 
  Edit2, 
  Trash2, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  ArrowUpDown, 
  X,
  Plus 
} from 'lucide-react';
import { Item, MaterialUnit } from '../../types';
import { db } from '../../database';
import BulkEditDialog from './BulkEditDialog';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import MaterialImport from './MaterialImport';
import MaterialCreateDialog from './MaterialCreateDialog';

interface FilterState {
  search: string;
  name: string;
  code: string;
  department: string;
  location: string;
  minStock: string;
  maxStock: string;
  minPrice: string;
  maxPrice: string;
  expiryDateFrom: string;
  expiryDateTo: string;
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
  location: '',
  minStock: '',
  maxStock: '',
  minPrice: '',
  maxPrice: '',
  expiryDateFrom: '',
  expiryDateTo: ''
};
const EditingMP: React.FC = () => {
  // State declarations
  const [items, setItems] = useState<Item[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [sort, setSort] = useState<SortState>({ field: undefined, direction: 'asc' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);

  // Effect hooks
  useEffect(() => {
    loadAllItems();
    loadUnits();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [items, filters, sort]);

  // Basic functions
  const loadAllItems = () => {
    const materials = db.getMaterials().map(item => ({ ...item, type: 'material' as const }));
    setItems(materials);
  };

  const loadUnits = () => {
    setUnits(db.getMaterialUnits());
  };

  const normalizeString = (str: string | number): string => {
    return String(str).toLowerCase().trim();
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
  // Filter and Sort Functions
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

      const matchesLocation = !filters.location || 
        (item.location && item.location.toLowerCase().includes(filters.location.toLowerCase()));

      const matchesMinStock = !filters.minStock || 
        (item.stock !== undefined && item.stock >= Number(filters.minStock));

      const matchesMaxStock = !filters.maxStock || 
        (item.stock !== undefined && item.stock <= Number(filters.maxStock));

      const matchesMinPrice = !filters.minPrice || 
        item.price >= parseFloat(filters.minPrice);

      const matchesMaxPrice = !filters.maxPrice || 
        item.price <= parseFloat(filters.maxPrice);

      const matchesExpiryDateFrom = !filters.expiryDateFrom || 
        (item.expiryDate && item.expiryDate >= new Date(filters.expiryDateFrom).getTime());

      const matchesExpiryDateTo = !filters.expiryDateTo || 
        (item.expiryDate && item.expiryDate <= new Date(filters.expiryDateTo).getTime());

      return matchesSearch && matchesName && matchesCode && 
             matchesDepartment && matchesLocation && 
             matchesMinStock && matchesMaxStock && 
             matchesMinPrice && matchesMaxPrice &&
             matchesExpiryDateFrom && matchesExpiryDateTo;
    });

    // Apply sorting
    if (sort.field) {
      result.sort((a, b) => {
        let valueA: string | number;
        let valueB: string | number;

        // Handle special cases first
        switch (sort.field) {
          case 'stock':
            valueA = typeof a.stock === 'number' ? a.stock : 0;
            valueB = typeof b.stock === 'number' ? b.stock : 0;
            break;
          case 'minStock':
            valueA = typeof a.minStock === 'number' ? a.minStock : 0;
            valueB = typeof b.minStock === 'number' ? b.minStock : 0;
            break;
          case 'expiryDate':
            valueA = typeof a.expiryDate === 'number' ? a.expiryDate : 0;
            valueB = typeof b.expiryDate === 'number' ? b.expiryDate : 0;
            break;
          case 'price':
            valueA = a.price ?? 0;
            valueB = b.price ?? 0;
            break;
          case 'name':
          case 'code':
          case 'department':
          case 'location':
            valueA = String(a[sort.field] || '');
            valueB = String(b[sort.field] || '');
            break;
          default:
            valueA = '';
            valueB = '';
        }

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
  // Event Handlers
  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      const newSelectedItems = filteredItems.map(item => item.id);
      setSelectedItems(newSelectedItems);
    }
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const clearFilters = () => {
    setFilters(initialFilterState);
    setSort({ field: undefined, direction: 'asc' });
  };

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
      db.deleteMaterial(id);
    });
    loadAllItems();
    setShowDeleteConfirm(false);
    setSelectedItems([]);
  };

  const handleImportSuccess = () => {
    loadAllItems();
    setShowImportDialog(false);
  };

  const handleCreateSuccess = () => {
    loadAllItems();
    setShowCreateDialog(false);
  };
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            موجودی لحظه‌ای
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                       rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              افزودن ماده اولیه
            </button>
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

        {/* Search Section */}
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="جستجوی کلی..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

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
        </div>
      </div>
      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {/* Row 1 - Text Filters */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                placeholder="نام"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={filters.code}
                onChange={(e) => handleFilterChange('code', e.target.value)}
                placeholder="کد"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                placeholder="بخش"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="محل نگهداری"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Row 2 - Number Inputs */}
            <div className="flex gap-2 flex-1 min-w-[200px]">
              <input
                type="number"
                value={filters.minStock}
                onChange={(e) => handleFilterChange('minStock', e.target.value)}
                placeholder="حداقل موجودی"
                className="w-1/2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                value={filters.maxStock}
                onChange={(e) => handleFilterChange('maxStock', e.target.value)}
                placeholder="حداکثر موجودی"
                className="w-1/2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2 flex-1 min-w-[200px]">
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="حداقل قیمت"
                className="w-1/2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="حداکثر قیمت"
                className="w-1/2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Row 3 - Date Inputs */}
            <div className="flex gap-2 flex-1 min-w-[200px]">
              <input
                type="date"
                value={filters.expiryDateFrom}
                onChange={(e) => handleFilterChange('expiryDateFrom', e.target.value)}
                className="w-1/2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="date"
                value={filters.expiryDateTo}
                onChange={(e) => handleFilterChange('expiryDateTo', e.target.value)}
                className="w-1/2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {Object.entries(filters).some(([key, value]) => value !== '' && key !== 'search') && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              {Object.entries(filters).map(([key, value]) => {
                if (value !== '' && key !== 'search') {
                  let displayKey = '';
                  switch(key) {
                    case 'name': displayKey = 'نام'; break;
                    case 'code': displayKey = 'کد'; break;
                    case 'department': displayKey = 'بخش'; break;
                    case 'location': displayKey = 'محل نگهداری'; break;
                    case 'minStock': displayKey = 'حداقل موجودی'; break;
                    case 'maxStock': displayKey = 'حداکثر موجودی'; break;
                    case 'minPrice': displayKey = 'حداقل قیمت'; break;
                    case 'maxPrice': displayKey = 'حداکثر قیمت'; break;
                    case 'expiryDateFrom': displayKey = 'تاریخ انقضا از'; break;
                    case 'expiryDateTo': displayKey = 'تاریخ انقضا تا'; break;
                    default: displayKey = key;
                  }
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm 
                               bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200"
                    >
                      {displayKey}: {value}
                      <button
                        onClick={() => handleFilterChange(key as keyof FilterState, '')}
                        className="hover:text-blue-600 dark:hover:text-blue-400 ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      )}
      {/* Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={filteredItems.length > 0 && selectedItems.length === filteredItems.length}
                  onChange={handleSelectAll}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
              </th>
              {[
                { key: 'name' as const, label: 'نام' },
                { key: 'code' as const, label: 'کد' },
                { key: 'department' as const, label: 'گروه' },
                { key: 'stock' as const, label: 'موجودی' },
                { key: 'minStock' as const, label: 'حداقل موجودی' },
                { key: 'location' as const, label: 'محل نگهداری' },
                { key: 'expiryDate' as const, label: 'تاریخ انقضا' },
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
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(prev => [...prev, item.id]);
                      } else {
                        setSelectedItems(prev => prev.filter(id => id !== item.id));
                      }
                    }}
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
                  {item.stock || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.minStock || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.location || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('fa-IR') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.price.toLocaleString()} ریال
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
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
        type="item"
      />

      {showImportDialog && (
        <MaterialImport
          onClose={() => setShowImportDialog(false)}
          onSuccess={handleImportSuccess}
        />
      )}

      {showCreateDialog && (
        <MaterialCreateDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default EditingMP;