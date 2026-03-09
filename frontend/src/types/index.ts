// types/index.ts

export type StockInStatus = 'CREATED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type StockOutStatus = 'DRAFT' | 'ALLOCATED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface Inventory {
  id: string;
  sku: string;
  name: string;
  customer: string;
  physical_stock: number;
  allocated_stock: number;
  available_stock: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface StockIn {
  id: string;
  inventory_id: string;
  sku: string;
  name: string;
  customer: string;
  quantity: number;
  unit: string;
  status: StockInStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface StockInLog {
  id: string;
  stock_in_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  notes: string;
  created_at: string;
}

export interface StockOut {
  id: string;
  inventory_id: string;
  sku: string;
  name: string;
  customer: string;
  quantity: number;
  unit: string;
  status: StockOutStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface StockOutLog {
  id: string;
  stock_out_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  notes: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface InventoryFilter {
  name?: string;
  sku?: string;
  customer?: string;
  page?: number;
  limit?: number;
}

export interface CreateStockInPayload {
  sku: string;
  name: string;
  customer: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface CreateStockOutPayload {
  inventory_id: string;
  quantity: number;
  notes?: string;
}

export interface UpdateStatusPayload {
  status: string;
  notes?: string;
}

export interface StockAdjustmentPayload {
  physical_stock: number;
  notes?: string;
}