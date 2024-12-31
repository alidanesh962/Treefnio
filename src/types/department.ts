export interface Department {
  id: string;
  name: string;
  type: 'sale' | 'production';
  createdAt?: string | number;
  updatedAt?: string | number;
  isActive?: boolean;
} 