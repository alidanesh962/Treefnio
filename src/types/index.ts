// src/types/index.ts

// src/types/index.ts

export interface Item {
  id: string;
  name: string;
  code: string;
  department: string;
  price: number;
  type: 'product' | 'material';
}

export interface RecipeMaterial {
  materialId: string;
  unit: string;
  amount: number;
  unitPrice: number;
  totalPrice: number;
}

export interface MaterialUnit {
  id: string;
  name: string;
  symbol: string;
}

export interface ProductRecipe {
  id: string;
  productId: string;
  name: string;
  materials: RecipeMaterial[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProductDefinition {
  id: string;
  name: string;
  code: string;
  saleDepartment: string;
  productionSegment: string;
  createdAt: number;
  updatedAt: number;
}

export interface Department {
  id: string;
  name: string;
  type: 'sale' | 'production';
  createdAt: number;
}

export interface Item {
  id: string;
  name: string;
  code: string;
  department: string;
  price: number;
  type: 'product' | 'material';
}

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

export interface UserActivity {
  id: string;
  username: string;
  type: 'login' | 'logout';
  timestamp: number;
  details?: string;
}

export interface Department {
  id: string;
  name: string;
  type: 'sale' | 'production';
  createdAt: number;
}

export interface ProductDefinition {
  id: string;
  name: string;
  code: string;
  saleDepartment: string;
  productionSegment: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProductRecipe {
  id: string;
  productId: string;
  name: string;
  materials: RecipeMaterial[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RecipeMaterial {
  materialId: string;
  unit: string;
  amount: number;
  unitPrice: number;
  totalPrice: number;
}

export interface MaterialUnit {
  id: string;
  name: string;
  symbol: string;
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

export type DateRange = [Date | null, Date | null];