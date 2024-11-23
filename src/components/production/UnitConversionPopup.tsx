import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import type { MaterialUnit } from '../../types';

interface UnitConversionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConvert: (amount: number) => void;
  targetUnit: MaterialUnit | undefined;
  availableUnits: MaterialUnit[];
}

interface ConversionFactor {
  from: string;
  to: string;
  factor: number;
}

// Conversion factors for common units
const CONVERSION_FACTORS: ConversionFactor[] = [
  // Weight conversions
  { from: 'g', to: 'kg', factor: 0.001 },
  { from: 'kg', to: 'g', factor: 1000 },
  // Volume conversions
  { from: 'ml', to: 'l', factor: 0.001 },
  { from: 'l', to: 'ml', factor: 1000 },
];

const UnitConversionPopup: React.FC<UnitConversionPopupProps> = ({
  isOpen,
  onClose,
  onConvert,
  targetUnit,
  availableUnits
}) => {
  const [fromAmount, setFromAmount] = useState<string>('');
  const [fromUnit, setFromUnit] = useState<string>(availableUnits[0]?.id || '');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  // Find the actual unit symbols for conversion
  const selectedFromUnit = availableUnits.find(u => u.id === fromUnit);
  
  const handleConvert = () => {
    if (!fromAmount || !selectedFromUnit || !targetUnit) return;

    const amount = parseFloat(fromAmount);
    if (isNaN(amount)) return;

    // If the units are the same, no conversion needed
    if (selectedFromUnit.symbol === targetUnit.symbol) {
      setConvertedAmount(amount);
      return;
    }

    // Find conversion factor
    const factor = CONVERSION_FACTORS.find(
      cf => cf.from === selectedFromUnit.symbol && cf.to === targetUnit.symbol
    );

    if (factor) {
      setConvertedAmount(amount * factor.factor);
    } else {
      // Try reverse conversion
      const reverseFactor = CONVERSION_FACTORS.find(
        cf => cf.from === targetUnit.symbol && cf.to === selectedFromUnit.symbol
      );
      if (reverseFactor) {
        setConvertedAmount(amount / reverseFactor.factor);
      } else {
        // If no conversion found, keep the same value
        setConvertedAmount(amount);
      }
    }
  };

  const handleApply = () => {
    if (convertedAmount !== null) {
      onConvert(convertedAmount);
      onClose();
      setFromAmount('');
      setConvertedAmount(null);
    }
  };

  if (!isOpen) return null;

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
                  {unit.symbol}
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
              {convertedAmount?.toString() || 'مقدار تبدیل شده'}
            </div>
            <div className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-center">
              {targetUnit?.symbol || '-'}
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