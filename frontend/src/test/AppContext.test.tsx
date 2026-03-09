// test/AppContext.test.tsx
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProvider, useApp } from '../context/AppContext'
import type { Inventory } from '../types'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
)

describe('AppContext', () => {
  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    expect(result.current.state.inventories).toEqual([])
    expect(result.current.state.stockIns).toEqual([])
    expect(result.current.state.stockOuts).toEqual([])
    expect(result.current.state.loading).toBe(false)
    expect(result.current.state.notification).toBeNull()
  })

  it('sets loading state', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    act(() => {
      result.current.dispatch({ type: 'SET_LOADING', payload: true })
    })
    expect(result.current.state.loading).toBe(true)
  })

  it('sets notification', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    act(() => {
      result.current.dispatch({
        type: 'SET_NOTIFICATION',
        payload: { type: 'success', message: 'Test success' },
      })
    })
    expect(result.current.state.notification).toEqual({ type: 'success', message: 'Test success' })
  })

  it('clears notification', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    act(() => {
      result.current.dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'success', message: 'msg' } })
    })
    act(() => {
      result.current.dispatch({ type: 'SET_NOTIFICATION', payload: null })
    })
    expect(result.current.state.notification).toBeNull()
  })

  it('sets inventories', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    const inv: Inventory[] = [
      { id: '1', sku: 'SKU-001', name: 'Product A', customer: 'Acme', physical_stock: 100, allocated_stock: 0, available_stock: 100, unit: 'pcs', created_at: '', updated_at: '' },
    ]
    act(() => {
      result.current.dispatch({ type: 'SET_INVENTORIES', payload: inv })
    })
    expect(result.current.state.inventories).toHaveLength(1)
    expect(result.current.state.inventories[0].sku).toBe('SKU-001')
  })

  it('updates a single inventory item', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    const inv: Inventory[] = [
      { id: '1', sku: 'SKU-001', name: 'Product A', customer: 'Acme', physical_stock: 100, allocated_stock: 0, available_stock: 100, unit: 'pcs', created_at: '', updated_at: '' },
      { id: '2', sku: 'SKU-002', name: 'Product B', customer: 'Corp', physical_stock: 50, allocated_stock: 10, available_stock: 40, unit: 'kg', created_at: '', updated_at: '' },
    ]
    act(() => {
      result.current.dispatch({ type: 'SET_INVENTORIES', payload: inv })
    })
    act(() => {
      result.current.dispatch({
        type: 'UPDATE_INVENTORY',
        payload: { ...inv[0], physical_stock: 200, available_stock: 200 },
      })
    })
    expect(result.current.state.inventories[0].physical_stock).toBe(200)
    expect(result.current.state.inventories[1].physical_stock).toBe(50) // unchanged
  })

  it('sets error state', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    act(() => {
      result.current.dispatch({ type: 'SET_ERROR', payload: 'Something went wrong' })
    })
    expect(result.current.state.error).toBe('Something went wrong')
  })
})