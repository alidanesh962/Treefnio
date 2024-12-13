// src/components/production/ProductDefinitionForm.tsx
import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { db } from '../../database';
import { Department } from '../../types';
import DepartmentDialog from './DepartmentDialog';

interface ProductDefinitionFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function ProductDefinitionForm({ onBack, onSuccess }: ProductDefinitionFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    saleDepartment: '',
    productionSegment: ''
  });

  // Step 1: Add state for auto-generation toggle
  const [autoGenerateCode, setAutoGenerateCode] = useState(false);

  const [saleDepartments, setSaleDepartments] = useState<Department[]>([]);
  const [productionSegments, setProductionSegments] = useState<Department[]>([]);
  const [showSaleDeptDialog, setShowSaleDeptDialog] = useState(false);
  const [showProdSegDialog, setShowProdSegDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = () => {
    try {
      const saleDepts = db.getDepartmentsByType('sale');
      const prodDepts = db.getDepartmentsByType('production');
      setSaleDepartments(saleDepts);
      setProductionSegments(prodDepts);
    } catch (error) {
      console.error('Error loading departments:', error);
      setSubmitError('خطا در بارگیری اطلاعات بخش‌ها');
    }
  };

  const handleAddDepartment = (name: string, type: 'sale' | 'production') => {
    try {
      const newDept = db.addDepartment(name, type);
      loadDepartments();
      
      if (type === 'sale') {
        setFormData(prev => ({ ...prev, saleDepartment: newDept.id }));
        setShowSaleDeptDialog(false);
      } else {
        setFormData(prev => ({ ...prev, productionSegment: newDept.id }));
        setShowProdSegDialog(false);
      }
    } catch (error) {
      console.error(`Error adding ${type} department:`, error);
      setSubmitError(`خطا در ایجاد ${type === 'sale' ? 'واحد فروش' : 'واحد تولید'} جدید`);
    }
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>, type: 'sale' | 'production') => {
    const value = e.target.value;
    if (value === 'new') {
      if (type === 'sale') {
        setShowSaleDeptDialog(true);
      } else {
        setShowProdSegDialog(true);
      }
    } else {
      if (type === 'sale') {
        setFormData(prev => ({ ...prev, saleDepartment: value }));
      } else {
        setFormData(prev => ({ ...prev, productionSegment: value }));
      }
    }
  };

  // Step 3: Modify the validate function to skip code validation when auto-generating
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام محصول الزامی است';
    }

    if (!autoGenerateCode) {
      if (!formData.code.trim()) {
        newErrors.code = 'کد محصول الزامی است';
      }
      // Check for duplicate code only when not auto-generating
      const existingProducts = db.getProductDefinitions();
      if (!autoGenerateCode && formData.code.trim()) {
        if (existingProducts.some(p => p.code === formData.code.trim())) {
          newErrors.code = 'این کد محصول قبلاً استفاده شده است';
        }
      }
    }

    if (!formData.saleDepartment) {
      newErrors.saleDepartment = 'انتخاب واحد فروش الزامی است';
    }
    if (!formData.productionSegment) {
      newErrors.productionSegment = 'انتخاب واحد تولید الزامی است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 4: Modify the handleSubmit function to include autoGenerateCode
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setErrors({});

      if (!validate()) {
        setIsSubmitting(false);
        return;
      }

      const productData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        saleDepartment: formData.saleDepartment,
        productionSegment: formData.productionSegment,
        autoGenerateCode // Pass this flag to the DB method
      };

      await db.addProductDefinition(productData);
      onSuccess();
      
    } catch (error) {
      console.error('Error submitting product:', error);
      setSubmitError('خطا در ثبت محصول');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          تعریف محصول جدید
        </h2>
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                     rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{submitError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            نام محصول
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isSubmitting}
            className={`w-full px-3 py-2 rounded-lg border ${
              errors.name 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
            } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
            disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Step 5: Add the toggle UI component before the code input */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="autoGenerateCode"
              checked={autoGenerateCode}
              onChange={(e) => setAutoGenerateCode(e.target.checked)}
              className="rounded text-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <label
              htmlFor="autoGenerateCode"
              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              تولید خودکار کد محصول
            </label>
          </div>

          {/* Modified code input field: only show when auto-generate is off */}
          {!autoGenerateCode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                کد محصول
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.code 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-500">{errors.code}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            واحد فروش
          </label>
          <select
            value={formData.saleDepartment}
            onChange={(e) => handleDepartmentChange(e, 'sale')}
            disabled={isSubmitting}
            className={`w-full px-3 py-2 rounded-lg border ${
              errors.saleDepartment 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
            } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
            disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="">انتخاب واحد فروش...</option>
            {saleDepartments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
            <option value="new">+ افزودن واحد فروش جدید</option>
          </select>
          {errors.saleDepartment && (
            <p className="mt-1 text-sm text-red-500">{errors.saleDepartment}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            واحد تولید
          </label>
          <select
            value={formData.productionSegment}
            onChange={(e) => handleDepartmentChange(e, 'production')}
            disabled={isSubmitting}
            className={`w-full px-3 py-2 rounded-lg border ${
              errors.productionSegment 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
            } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
            disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="">انتخاب واحد تولید...</option>
            {productionSegments.map(segment => (
              <option key={segment.id} value={segment.id}>{segment.name}</option>
            ))}
            <option value="new">+ افزودن واحد تولید جدید</option>
          </select>
          {errors.productionSegment && (
            <p className="mt-1 text-sm text-red-500">{errors.productionSegment}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                   transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'در حال ثبت...' : 'ایجاد محصول'}
        </button>
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 
                   transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          انصراف
        </button>
      </div>

      {/* Department Dialogs */}
      <DepartmentDialog
        isOpen={showSaleDeptDialog}
        type="sale"
        onClose={() => setShowSaleDeptDialog(false)}
        onConfirm={(name) => handleAddDepartment(name, 'sale')}
      />

      <DepartmentDialog
        isOpen={showProdSegDialog}
        type="production"
        onClose={() => setShowProdSegDialog(false)}
        onConfirm={(name) => handleAddDepartment(name, 'production')}
      />
    </div>
  );
}
