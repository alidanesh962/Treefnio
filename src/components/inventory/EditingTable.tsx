// src/components/inventory/EditingTable.tsx
import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Item, MaterialUnit } from '../../types';

interface EditingTableProps {
  items: Item[];
  selectedItems: string[];
  onSelectItems: (ids: string[]) => void;
  onSort: (key: keyof Item) => void;
  units: MaterialUnit[];
}

export default function EditingTable({
  items,
  selectedItems,
  onSelectItems,
  onSort,
  units
}: EditingTableProps) {
  const handleSelectAll = (checked: boolean) => {
    onSelectItems(checked ? items.map(item => item.id) : []);
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      onSelectItems([...selectedItems, id]);
    } else {
      onSelectItems(selectedItems.filter(itemId => itemId !== id));
    }
  };

  const getUnitDisplay = (unitId?: string): string => {
    if (!unitId) return '-';
    const unit = units.find(u => u.id === unitId);
    return unit ? `${unit.name} (${unit.symbol})` : '-';
  };

  const renderSortButton = (label: string, key: keyof Item) => (
    <button
      onClick={() => onSort(key)}
      className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 
                dark:hover:text-white"
    >
      {label}
      <ArrowUpDown className="h-4 w-4" />
    </button>
  );
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="px-6 py-3">
                <input
                  type="checkbox"
                  checked={selectedItems.length === items.length && items.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-right">{renderSortButton('نام', 'name')}</th>
              <th className="px-6 py-3 text-right">{renderSortButton('کد', 'code')}</th>
              <th className="px-6 py-3 text-right">{renderSortButton('بخش', 'department')}</th>
              <th className="px-6 py-3 text-right">{renderSortButton('واحد', 'unit')}</th>
              <th className="px-6 py-3 text-right">{renderSortButton('قیمت', 'price')}</th>
              <th className="px-6 py-3 text-right">نوع</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">{item.name}</td>
                <td className="px-6 py-4">{item.code}</td>
                <td className="px-6 py-4">{item.department}</td>
                <td className="px-6 py-4">{getUnitDisplay(item.unit)}</td>
                <td className="px-6 py-4">{item.price.toLocaleString()} ریال</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    item.type === 'product'
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {item.type === 'product' ? 'کالا' : 'متریال'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} // End of EditingTable component

// Type exports if needed
export type { EditingTableProps };