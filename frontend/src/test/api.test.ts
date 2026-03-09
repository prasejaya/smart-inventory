// test/api.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { inventoryApi, stockInApi, stockOutApi } from '../api'

const mockFetch = vi.fn()
global.fetch = mockFetch

function mockResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  })
}

describe('inventoryApi', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('calls GET /inventories', async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, message: 'ok', data: { data: [], total: 0, page: 1, limit: 10, total_pages: 0 } })
    )
    const res = await inventoryApi.getAll({})
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/inventories'),
      expect.objectContaining({ headers: expect.any(Object) })
    )
    expect(res.success).toBe(true)
  })

  it('calls GET /inventories with filters', async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, message: 'ok', data: { data: [], total: 0, page: 1, limit: 10, total_pages: 0 } })
    )
    await inventoryApi.getAll({ name: 'Product', sku: 'SKU-001' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('name=Product'),
      expect.any(Object)
    )
  })

  it('calls PATCH /inventories/:id/adjust', async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, message: 'adjusted', data: { id: '1', physical_stock: 100 } })
    )
    const res = await inventoryApi.adjustStock('test-id', { physical_stock: 100 })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/inventories/test-id/adjust'),
      expect.objectContaining({ method: 'PATCH' })
    )
    expect(res.success).toBe(true)
  })

  it('throws on failed response', async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: false, message: 'Not found' }, false)
    )
    await expect(inventoryApi.getById('nonexistent')).rejects.toThrow('Not found')
  })
})

describe('stockInApi', () => {
  afterEach(() => vi.clearAllMocks())

  it('calls POST /stock-ins to create', async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, message: 'created', data: { id: '1', status: 'CREATED' } })
    )
    const res = await stockInApi.create({ sku: 'SKU-001', name: 'Test', customer: 'Acme', quantity: 10, unit: 'pcs' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/stock-ins'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(res.success).toBe(true)
  })

  it('calls PATCH /stock-ins/:id/status', async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, message: 'updated', data: { id: '1', status: 'IN_PROGRESS' } })
    )
    await stockInApi.updateStatus('test-id', { status: 'IN_PROGRESS' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/stock-ins/test-id/status'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })
})

describe('stockOutApi', () => {
  afterEach(() => vi.clearAllMocks())

  it('calls POST /stock-outs for allocation', async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, message: 'allocated', data: { id: '1', status: 'ALLOCATED' } })
    )
    const res = await stockOutApi.create({ inventory_id: 'inv-1', quantity: 5 })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/stock-outs'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(res.success).toBe(true)
  })

  it('calls PATCH /stock-outs/:id/status for cancellation', async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, message: 'cancelled', data: { id: '1', status: 'CANCELLED' } })
    )
    await stockOutApi.updateStatus('test-id', { status: 'CANCELLED', notes: 'Cancelled by user' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/stock-outs/test-id/status'),
      expect.objectContaining({ method: 'PATCH' })
    )
  })
})