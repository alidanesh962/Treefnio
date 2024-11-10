// src/types/index.ts
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
  
  export type DateRange = [Date | null, Date | null];