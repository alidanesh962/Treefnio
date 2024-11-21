import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { MaterialUnit } from '../../types';

interface UnitConversionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConvert: (amount: number) => void;
  targetUnit: MaterialUnit | undefined;
  availableUnits: MaterialUnit[];
}

// Function to identify the standardized unit type
const getUnitType = (unitName: string): string => {
  const name = unitName.trim().toLowerCase();
  
  // Check for Kilogram variations
  if (name.includes('کیلوگرم') || name.includes('کیلو گرم') || name.includes('کیلو')) {
    return 'kg';
  }
  
  // Check for Gram
  if (name.includes('گرم') && !name.includes('کیلو')) {
    return 'g';
  }
  
  // Check for Liter
  if (name.includes('لیتر')) {
    return 'l';
  }
  
  // Check for Milliliter variations
  if (name.includes('میلی لیتر') || name.includes('سی سی')) {
    return 'ml';
  }
  
  return name; // Return original if no match
};

// Function to get conversion factor between two units
const getConversionFactor = (fromUnit: string, toUnit: string): number => {
  const from = getUnitType(fromUnit);
  const to = getUnitType(toUnit);

  // Weight conversions
  if (from === 'g' && to === 'kg') return 0.001;
  if (from === 'kg' && to === 'g') return 1000;

  // Volume conversions
  if (from === 'ml' && to === 'l') return 0.001;
  if (from === 'l' && to === 'ml') return 1000;

  // If same unit or unknown conversion, return 1
  return 1;
};

const UnitConversionPopup: React.FC<UnitConversionPopupProps> = ({
  isOpen,
  onClose,
  onConvert,
  targetUnit,
  availableUnits
}) => {
  const [fromAmount, setFromAmount] = useState<string>('');
  const [fromUnit, setFromUnit] = useState<string>('');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  useEffect(() => {
    if (availableUnits.length > 0) {
      setFromUnit(availableUnits[0].id);
    }
  }, [availableUnits]);

  const handleConvert = () => {
    if (!fromAmount || !targetUnit) return;

    const amount = parseFloat(fromAmount);
    if (isNaN(amount)) return;

    const selectedFromUnit = availableUnits.find(u => u.id === fromUnit);
    if (!selectedFromUnit) return;

    // Get the conversion factor based on unit names
    const factor = getConversionFactor(selectedFromUnit.name, targetUnit.name);
    
    // Calculate and set the converted amount
    const result = amount * factor;
    setConvertedAmount(result);
  };

  const handleApply = () => {
    if (convertedAmount !== null) {
      onConvert(convertedAmount);
      onClose();
      // Reset state
      setFromAmount('');
      setConvertedAmount(null);
    }
  };

  if (!isOpen || !targetUnit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         onClick={(e) => {
           if (e.target === e.currentTarget) onClose();
         }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-72 shadow-lg"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            تبدیل واحد
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* From Unit */}
          <div className="flex gap-2">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-left"
              placeholder="مقدار"
              dir="ltr"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {availableUnits.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-4 h-4 border-b-2 border-r-2 border-gray-400 dark:border-gray-500 transform rotate-45" />
          </div>

          {/* To Unit (Read-only) */}
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-left"
                 dir="ltr">
              {convertedAmount?.toFixed(3) || 'مقدار تبدیل شده'}
            </div>
            <div className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-center">
              {targetUnit.name}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleApply}
              disabled={convertedAmount === null}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 
                       transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              اعمال
            </button>
            <button
              onClick={handleConvert}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       transition-colors"
            >
              تبدیل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitConversionPopup;