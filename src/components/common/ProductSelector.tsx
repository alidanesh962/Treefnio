import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { ProductDefinition } from '../../types';

interface ProductSelectorProps {
  value: ProductDefinition | null;
  onChange: (product: ProductDefinition | null) => void;
  suggestedProducts?: ProductDefinition[];
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

export default function ProductSelector({
  value,
  onChange,
  suggestedProducts = [],
  error,
  helperText,
  disabled,
}: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  const filteredProducts = suggestedProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className={`w-full px-3 py-2 rounded-lg border text-sm cursor-pointer flex items-center justify-between
                   bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600
                   ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}
                   ${error ? 'border-red-500' : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsDropdownOpen(!isDropdownOpen);
            if (!isDropdownOpen) {
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }
          }
        }}
      >
        <span className="truncate text-gray-900 dark:text-white">
          {value ? value.name : 'انتخاب محصول...'}
        </span>
        {!disabled && (
          isDropdownOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )
        )}
      </div>

      {isDropdownOpen && (
        <div className="fixed inset-x-0 z-50 mt-1 w-full bg-gray-50 dark:bg-gray-700 rounded-lg shadow-lg 
                       border border-gray-300 dark:border-gray-600"
             style={{
               position: 'absolute',
               width: '100%',
               maxWidth: dropdownRef.current?.offsetWidth,
             }}
        >
          <div className="p-2 border-b border-gray-200 dark:border-gray-600 sticky top-0 
                         bg-gray-50 dark:bg-gray-700">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 
                          dark:border-gray-600 bg-gray-50 dark:bg-gray-700 
                          text-gray-900 dark:text-white text-sm"
                placeholder="جستجو بر اساس نام یا کد محصول..."
              />
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                className={`w-full text-right px-3 py-2 text-sm
                          ${product.id === value?.id 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600/50'
                          }`}
                onClick={() => {
                  onChange(product);
                  setIsDropdownOpen(false);
                  setSearchQuery('');
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {product.code}
                  </span>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                موردی یافت نشد
              </div>
            )}
          </div>
        </div>
      )}

      {helperText && (
        <div className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {helperText}
        </div>
      )}
    </div>
  );
} 