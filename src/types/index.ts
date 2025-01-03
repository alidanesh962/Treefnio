// src/types/index.ts

// Base Types
export interface Item {
  id: string;
  name: string;
  code: string;
  department: string;
  price: number;
  type: 'product' | 'material';
  unit?: string;
  stock?: number;
  minStock?: number;
  location?: string;
  expiryDate?: number;
  lastPurchasePrice?: number;
  lastEntryDate?: number;
}

export interface ExtendedItem extends Item {
  createdAt?: number;
  saleDepartment?: string;
  productionSegment?: string;
  updatedAt?: number;
  isActive?: boolean;
}

export interface MaterialUnit {
  id: string;
  name: string;
  symbol: string;
}

export interface Department {
  id: string;
  name: string;
  type: 'sale' | 'production';
  createdAt: number;
}

// User Related Types
export interface CurrentUser {
  username: string;
  role: 'admin' | 'user';
}

export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'user';
}

export interface UserActivity {
  id: string;
  username: string;
  fullName: string;
  type: 'create' | 'edit' | 'delete' | 'login' | 'logout';
  timestamp: number;
  module: string;
  details?: string;
}

// Recipe Related Types
export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: Array<{
    materialId: string;
    quantity: number;
  }>;
  finalProduct: string;
  yield: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface RecipeMaterial {
  materialId: string;
  unit: string;
  amount: number;
  unitPrice: number;
  totalPrice: number;
  note?: string;  // Added note field for material comments
}

export interface ProductRecipe {
  id: string;
  productId: string;
  name: string;
  materials: RecipeMaterial[];
  notes?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Product Related Types
export interface ProductDefinition {
  id: string;
  name: string;
  code: string;
  saleDepartment: string;
  productionSegment: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export interface ExtendedProductDefinition extends ProductDefinition {
  isActive: boolean;
}

export interface ProductionBatch {
  id: string;
  productId: string;
  recipeId: string;
  quantity: number;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  startDate?: number;
  completionDate?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// Inventory Related Types
export interface InventoryEntry {
  id: string;
  materialId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  tax: number;
  shipping: number;
  storageLocation: string;
  notes: string;
  seller: string;
  buyer: string;
  invoiceNumber: string;
  documentNumber: string;
  createdAt: number;
}

export interface InventoryTransaction {
  id: string;
  type: 'entry' | 'exit';
  materialId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  reference: string;
  notes?: string;
  createdAt: number;
  createdBy: string;
}

export interface StorageLocation {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: number;
}

export interface MaterialStock {
  materialId: string;
  quantity: number;
  unit: string;
  location: string;
  lastUpdated: number;
}

// Utility Types
export type DateRange = [Date | null, Date | null];

export interface SalesDataset {
  id: string;
  name: string;
  importDate: number;
  data: Array<{
    date: string;
    department: string;
    totalAmount: number;
    productId: string;
    quantity: number;
  }>;
}

export * from './product';
export * from './material';
