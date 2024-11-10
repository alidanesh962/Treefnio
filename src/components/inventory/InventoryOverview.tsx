// src/components/inventory/InventoryOverview.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { db, Item } from '../../database';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';

export default function InventoryOverview() {
  const [products, setProducts] = useState<Item[]>([]);
  const [materials, setMaterials] = useState<Item[]>([]);
  const [editingProduct, setEditingProduct] = useState<Item | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Item | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    type: 'product' | 'material';
  }>({ isOpen: false, id: '', name: '', type: 'product' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(db.getProducts());
    setMaterials(db.getMaterials());
  };

  const handleAddProduct = (product: Omit<Item, 'id'>) => {
    const newProduct = db.addProduct(product);
    setProducts([...products, newProduct]);
  };

  const handleAddMaterial = (material: Omit<Item, 'id'>) => {
    const newMaterial = db.addMaterial(material);
    setMaterials([...materials, newMaterial]);
  };

  const handleUpdateProduct = (product: Item) => {
    if (db.updateProduct(product)) {
      setProducts(products.map(p => p.id === product.id ? product : p));
      setEditingProduct(null);
    }
  };

  const handleUpdateMaterial = (material: Item) => {
    if (db.updateMaterial(material)) {
      setMaterials(materials.map(m => m.id === material.id ? material : m));
      setEditingMaterial(null);
    }
  };

  const handleDelete = () => {
    if (deleteConfirm.type === 'product') {
      if (db.deleteProduct(deleteConfirm.id)) {
        setProducts(products.filter(p => p.id !== deleteConfirm.id));
      }
    } else {
      if (db.deleteMaterial(deleteConfirm.id)) {
        setMaterials(materials.filter(m => m.id !== deleteConfirm.id));
      }
    }
    setDeleteConfirm({ isOpen: false, id: '', name: '', type: 'product' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Products Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">کالا</h2>
        
        {/* Products List */}
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="relative p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">کد: {product.code}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    بخش: {product.department}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    قیمت: {product.price.toLocaleString()} ریال
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="p-1.5 text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({
                      isOpen: true,
                      id: product.id,
                      name: product.name,
                      type: 'product'
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
      </div>

      {/* Materials Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">متریال</h2>
        
        {/* Materials List */}
        <div className="space-y-4">
          {materials.map(material => (
            <div key={material.id} className="relative p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{material.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">کد: {material.code}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    بخش: {material.department}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    قیمت: {material.price.toLocaleString()} ریال
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingMaterial(material)}
                    className="p-1.5 text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({
                      isOpen: true,
                      id: material.id,
                      name: material.name,
                      type: 'material'
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
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        itemName={deleteConfirm.name}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '', type: 'product' })}
      />
    </div>
  );
}