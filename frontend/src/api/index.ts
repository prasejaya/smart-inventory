// api/index.ts
import type {
  APIResponse,
  CreateStockInPayload,
  CreateStockOutPayload,
  Inventory,
  InventoryFilter,
  PaginatedResponse,
  StockAdjustmentPayload,
  StockIn,
  StockOut,
  UpdateStatusPayload,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<APIResponse<T>> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  const data: APIResponse<T> = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
}

// Inventory API
export const inventoryApi = {
  getAll: (filter: InventoryFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.name) params.append('name', filter.name);
    if (filter.sku) params.append('sku', filter.sku);
    if (filter.customer) params.append('customer', filter.customer);
    if (filter.page) params.append('page', String(filter.page));
    if (filter.limit) params.append('limit', String(filter.limit));
    return request<PaginatedResponse<Inventory>>(`/inventories?${params}`);
  },

  getById: (id: string) =>
    request<Inventory>(`/inventories/${id}`),

  create: (payload: { sku: string; name: string; customer: string; unit: string }) =>
    request<Inventory>('/inventories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adjustStock: (id: string, payload: StockAdjustmentPayload) =>
    request<Inventory>(`/inventories/${id}/adjust`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

// Stock In API
export const stockInApi = {
  getAll: (page = 1, limit = 10) =>
    request<PaginatedResponse<StockIn>>(`/stock-ins?page=${page}&limit=${limit}`),

  getById: (id: string) =>
    request<{ stock_in: StockIn; logs: unknown[] }>(`/stock-ins/${id}`),

  create: (payload: CreateStockInPayload) =>
    request<StockIn>('/stock-ins', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateStatus: (id: string, payload: UpdateStatusPayload) =>
    request<StockIn>(`/stock-ins/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

// Stock Out API
export const stockOutApi = {
  getAll: (page = 1, limit = 10) =>
    request<PaginatedResponse<StockOut>>(`/stock-outs?page=${page}&limit=${limit}`),

  getById: (id: string) =>
    request<{ stock_out: StockOut; logs: unknown[] }>(`/stock-outs/${id}`),

  create: (payload: CreateStockOutPayload) =>
    request<StockOut>('/stock-outs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateStatus: (id: string, payload: UpdateStatusPayload) =>
    request<StockOut>(`/stock-outs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

// Report API
export const reportApi = {
  getStockInReport: () =>
    request('/reports/stock-in'),

  getStockOutReport: () =>
    request('/reports/stock-out'),
};