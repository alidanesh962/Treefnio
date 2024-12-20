// src/components/production/MaterialRow.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Search, ChevronDown, ChevronUp, MessageSquare, Calculator, Plus } from 'lucide-react';
import type { MaterialUnit, RecipeMaterial, Item } from '../../types';
import UnitConversionPopup from './UnitConversionPopup';
import AddUnitDialog from './AddUnitDialog';

interface MaterialRowProps {
  material: RecipeMaterial;
  index: number;
  materials: Item[];
  units: MaterialUnit[];
  onChange: (index: number, updates: Partial<RecipeMaterial>) => void;
  onDelete: (index: number) => void;
  error?: string;
  showHeader?: boolean;
  batchSize?: number;
}

const MaterialRow: React.FC<MaterialRowProps> = ({
  material,
  index,
  materials,
  units,
  onChange,
  onDelete,
  error,
  showHeader = false,
  batchSize = 1
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showUnitConversion, setShowUnitConversion] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const handleUnitChange = (unitId: string) => {
    onChange(index, { unit: unitId });
  };

  const handleNoteChange = (note: string) => {
    onChange(index, { note });
  };

  const handleConvertedAmount = (amount: number) => {
    handleQuantityChange(amount);
  };

  const handleNewUnitAdded = (unitId: string) => {
    handleUnitChange(unitId);
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMaterial = materials.find(m => m.id === material.materialId);
  const selectedUnit = units.find(u => u.id === material.unit);
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

          <div className="col-span-2">
            <div className="space-y-2">
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
              {batchSize > 1 && material.amount > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  هر واحد: {(material.amount / batchSize).toFixed(2)} {selectedUnit?.symbol}
                </div>
              )}
            </div>
          </div>

          {/* Unit Selection with Add New Unit Button */}
          <div className="col-span-2">
            <div className="flex gap-2">
              <select
                value={material.unit || ''}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">انتخاب واحد...</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddUnit(true)}
                className="p-2 text-blue-500 hover:text-blue-600 transition-colors
                         hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                title="افزودن واحد جدید"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="col-span-2">
            <input
              type="text"
              value={material.unitPrice?.toLocaleString() || ''}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-left"
              readOnly
              dir="ltr"
            />
          </div>

          <div className="col-span-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={material.totalPrice?.toLocaleString() || ''}
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
            {batchSize > 1 && material.totalPrice > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                هر واحد: {(material.totalPrice / batchSize).toLocaleString()} ریال
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unit Conversion Dialog */}
      <UnitConversionPopup
        isOpen={showUnitConversion}
        onClose={() => setShowUnitConversion(false)}
        onConvert={handleConvertedAmount}
        targetUnit={selectedUnit}
        availableUnits={units}
      />

      {/* Add New Unit Dialog */}
      <AddUnitDialog
        isOpen={showAddUnit}
        onClose={() => setShowAddUnit(false)}
        onConfirm={handleNewUnitAdded}
      />

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

      {error && (
        <div className="mt-1 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default MaterialRow;