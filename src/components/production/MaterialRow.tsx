// src/components/production/MaterialRow.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Search, ChevronDown, ChevronUp, MessageSquare, Calculator } from 'lucide-react';
import type { MaterialUnit, RecipeMaterial, Item } from '../../types';
import UnitConversionPopup from './UnitConversionPopup';

interface MaterialRowProps {
  material: RecipeMaterial;
  index: number;
  materials: Item[];
  units: MaterialUnit[];
  onChange: (index: number, updates: Partial<RecipeMaterial>) => void;
  onDelete: (index: number) => void;
  error?: string;
  showHeader?: boolean;
}

const MaterialRow: React.FC<MaterialRowProps> = ({
  material,
  index,
  materials,
  units,
  onChange,
  onDelete,
  error,
  showHeader = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showUnitConversion, setShowUnitConversion] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle clicking outside of dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleQuantityChange = (value: number) => {
    const selectedMaterial = materials.find(m => m.id === material.materialId);
    if (selectedMaterial) {
      const totalPrice = value * selectedMaterial.price;
      onChange(index, {
        amount: value,
        unitPrice: selectedMaterial.price,
        totalPrice: totalPrice
      });
    }
  };

  const handleMaterialChange = (materialId: string) => {
    const selectedMaterial = materials.find(m => m.id === materialId);
    if (selectedMaterial) {
      const totalPrice = material.amount * selectedMaterial.price;
      onChange(index, {
        materialId,
        unitPrice: selectedMaterial.price,
        totalPrice: totalPrice,
        unit: selectedMaterial.unit || ''
      });
    }
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleNoteChange = (note: string) => {
    onChange(index, { note });
  };

  const handleConvertedAmount = (amount: number) => {
    handleQuantityChange(amount);
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMaterial = materials.find(m => m.id === material.materialId);
  const selectedUnit = units.find(u => u.id === (selectedMaterial?.unit || material.unit));

  return (
    <div>
      {showHeader && (
        <div className="grid grid-cols-12 gap-4 mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          <div className="col-span-1"></div>
          <div className="col-span-3">نام ماده اولیه</div>
          <div className="col-span-2">مقدار</div>
          <div className="col-span-2">واحد</div>
          <div className="col-span-2">قیمت واحد (ریال)</div>
          <div className="col-span-2">قیمت کل (ریال)</div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 items-start bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          {/* Delete Button */}
          <div className="col-span-1 flex justify-center">
            <button
              onClick={() => onDelete(index)}
              className="p-2 text-red-500 hover:text-red-600 transition-colors
                       hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              title="حذف"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>

          {/* Material Selection with Search */}
          <div className="col-span-3 relative" ref={dropdownRef}>
            <div 
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                       cursor-pointer flex items-center justify-between"
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                if (!isDropdownOpen) {
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }
              }}
            >
              <span className="truncate">
                {selectedMaterial ? selectedMaterial.name : 'انتخاب ماده اولیه...'}
              </span>
              {isDropdownOpen ? (
                <ChevronUp className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              )}
            </div>

            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg 
                            border border-gray-200 dark:border-gray-700 py-2 max-h-64 overflow-y-auto">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 
                              bg-white dark:bg-gray-800">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-md border border-gray-300 
                               dark:border-gray-600 bg-gray-50 dark:bg-gray-700 
                               text-gray-900 dark:text-white text-sm"
                      placeholder="جستجو..."
                    />
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="mt-1">
                  {filteredMaterials.map((mat) => (
                    <button
                      key={mat.id}
                      className={`w-full text-right px-3 py-2 text-sm hover:bg-gray-100 
                                dark:hover:bg-gray-700/50 ${
                        mat.id === material.materialId
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                      onClick={() => handleMaterialChange(mat.id)}
                    >
                      {mat.name}
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                        ({mat.code})
                      </span>
                    </button>
                  ))}
                  {filteredMaterials.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                      موردی یافت نشد
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Amount Input with Conversion Button */}
          <div className="col-span-2">
            <div className="flex gap-2">
              <input
                type="number"
                value={material.amount || ''}
                onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-left"
                min="0"
                step="0.01"
                placeholder="مقدار"
                dir="ltr"
              />
              <button
                onClick={() => setShowUnitConversion(true)}
                className="p-2 text-gray-500 hover:text-gray-600 transition-colors
                         hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                title="تبدیل واحد"
              >
                <Calculator className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Unit Display */}
          <div className="col-span-2">
            <div className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                          bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-sm">
              {selectedUnit ? `${selectedUnit.name} (${selectedUnit.symbol})` : '-'}
            </div>
          </div>

          {/* Unit Price Display */}
          <div className="col-span-2">
            <input
              type="text"
              value={material.unitPrice.toLocaleString()}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-left"
              readOnly
              dir="ltr"
            />
          </div>

          {/* Total Price Display */}
          <div className="col-span-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={material.totalPrice.toLocaleString()}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-left"
                readOnly
                dir="ltr"
              />
              <button
                onClick={() => setShowNoteInput(!showNoteInput)}
                className={`p-2 rounded-lg transition-colors ${
                  material.note
                    ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={material.note ? 'ویرایش یادداشت' : 'افزودن یادداشت'}
              >
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Unit Conversion Popup */}
        <UnitConversionPopup
          isOpen={showUnitConversion}
          onClose={() => setShowUnitConversion(false)}
          onConvert={handleConvertedAmount}
          targetUnit={selectedUnit}
          availableUnits={units}
        />

        {/* Note Input */}
        {showNoteInput && (
          <div className="pr-12 -mt-2">
            <textarea
              value={material.note || ''}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="یادداشت برای این ماده اولیه..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-1 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default MaterialRow;