// pages/StockOutPage.tsx
import { useEffect, useState } from 'react';
import { inventoryApi, stockOutApi } from '../api';
import { Pagination } from '../components/common/Pagination';
import { StatusBadge } from '../components/common/StatusBadge';
import { useApp } from '../context/AppContext';
import type { Inventory, StockOut, StockOutLog, StockOutStatus } from '../types';

const NEXT_STATUSES: Record<StockOutStatus, StockOutStatus[]> = {
  DRAFT: ['ALLOCATED', 'CANCELLED'],
  ALLOCATED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DONE', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
};

function CreateStockOutModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (inventoryId: string, qty: number, notes: string) => void }) {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [inventoryId, setInventoryId] = useState('');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<Inventory | null>(null);

  useEffect(() => {
    inventoryApi.getAll({ limit: 100 }).then((res) => {
      if (res.data) setInventories(res.data.data);
    });
  }, []);

  const handleSelectInventory = (id: string) => {
    setInventoryId(id);
    setSelected(inventories.find((i) => i.id === id) || null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-2">Create Stock Out (Stage 1: Allocation)</h2>
        <p className="text-xs text-gray-500 mb-4 bg-blue-50 p-2 rounded">
          This will allocate stock (Two-Phase Commitment Stage 1). Physical stock will not be deducted until DONE.
        </p>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Select Inventory Item</label>
          <select
            value={inventoryId}
            onChange={(e) => handleSelectInventory(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">-- Select item --</option>
            {inventories.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.sku} — {inv.name} (Available: {inv.available_stock} {inv.unit})
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <div className="mb-3 text-xs bg-gray-50 p-2 rounded border">
            <p>Physical: <strong>{selected.physical_stock}</strong> | Allocated: <strong className="text-yellow-700">{selected.allocated_stock}</strong> | Available: <strong className={selected.available_stock > 0 ? 'text-green-700' : 'text-red-600'}>{selected.available_stock}</strong></p>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            max={selected?.available_stock}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded border hover:bg-gray-100">Cancel</button>
          <button
            onClick={() => onSubmit(inventoryId, Number(qty), notes)}
            disabled={!inventoryId || !qty}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Allocate (Stage 1)
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ stockOut, logs, onClose, onUpdateStatus }: {
  stockOut: StockOut;
  logs: StockOutLog[];
  onClose: () => void;
  onUpdateStatus: (status: StockOutStatus, notes: string) => void;
}) {
  const [notes, setNotes] = useState('');
  const nextStatuses = NEXT_STATUSES[stockOut.status];

  const stageInfo: Record<StockOutStatus, string> = {
    DRAFT: 'Draft - Not yet allocated',
    ALLOCATED: 'Stage 1 Complete - Stock reserved. Awaiting execution.',
    IN_PROGRESS: 'Stage 2 In Progress - Packing / Delivery',
    DONE: 'Stage 2 Complete - Stock deducted from physical.',
    CANCELLED: 'Cancelled - Allocated stock released back.',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Stock Out Detail</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <div className="mb-3 p-2 rounded bg-blue-50 text-xs text-blue-700 font-medium">
            {stageInfo[stockOut.status]}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            {[
              ['SKU', stockOut.sku],
              ['Name', stockOut.name],
              ['Customer', stockOut.customer],
              ['Quantity', `${stockOut.quantity} ${stockOut.unit}`],
              ['Status', null],
              ['Notes', stockOut.notes || '-'],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <span className="text-gray-500 text-xs uppercase">{label}</span>
                <p className="font-medium mt-0.5">
                  {label === 'Status' ? <StatusBadge status={stockOut.status} /> : value}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">History / Audit Log</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="text-xs bg-gray-50 rounded p-2 border-l-4 border-purple-300">
                  <div className="flex justify-between">
                    <span>{log.old_status ? `${log.old_status} → ${log.new_status}` : `Created as ${log.new_status}`}</span>
                    <span className="text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  {log.notes && <p className="text-gray-500 mt-0.5">{log.notes}</p>}
                </div>
              ))}
            </div>
          </div>

          {nextStatuses.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">Update Status</h3>
              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex gap-2">
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => onUpdateStatus(status, notes)}
                    className={`flex-1 py-2 rounded text-sm font-medium ${
                      status === 'CANCELLED'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {status === 'CANCELLED' ? '⚠️ ' : '→ '}{status}
                    {status === 'CANCELLED' ? ' (Rollback)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StockOutPage() {
  const { dispatch } = useApp();
  const [stockOuts, setStockOuts] = useState<StockOut[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<{ stockOut: StockOut; logs: StockOutLog[] } | null>(null);

  const fetchStockOuts = async () => {
    setLoading(true);
    try {
      const res = await stockOutApi.getAll(page);
      if (res.data) {
        setStockOuts(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.total_pages);
      }
    } catch (err: unknown) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'error', message: String(err) } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStockOuts(); }, [page]);

  const handleCreate = async (inventoryId: string, qty: number, notes: string) => {
    try {
      await stockOutApi.create({ inventory_id: inventoryId, quantity: qty, notes });
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'success', message: 'Stock allocated (Stage 1 complete)!' } });
      setShowCreate(false);
      fetchStockOuts();
    } catch (err: unknown) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'error', message: String(err) } });
    }
  };

  const handleOpenDetail = async (id: string) => {
    try {
      const res = await stockOutApi.getById(id);
      if (res.data) {
        setSelected({ stockOut: res.data.stock_out as StockOut, logs: res.data.logs as StockOutLog[] });
      }
    } catch (err: unknown) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'error', message: String(err) } });
    }
  };

  const handleUpdateStatus = async (status: StockOutStatus, notes: string) => {
    if (!selected) return;
    try {
      await stockOutApi.updateStatus(selected.stockOut.id, { status, notes });
      const msg = status === 'CANCELLED' ? 'Order cancelled. Stock released!' : `Status updated to ${status}!`;
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'success', message: msg } });
      setSelected(null);
      fetchStockOuts();
    } catch (err: unknown) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'error', message: String(err) } });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Out (Barang Keluar)</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} transactions · Two-Phase Commitment</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + New Stock Out
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['SKU', 'Name', 'Customer', 'Qty', 'Unit', 'Status', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : stockOuts.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No stock out transactions</td></tr>
              ) : (
                stockOuts.map((so) => (
                  <tr key={so.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-700">{so.sku}</td>
                    <td className="px-4 py-3 font-medium">{so.name}</td>
                    <td className="px-4 py-3 text-gray-600">{so.customer}</td>
                    <td className="px-4 py-3 font-semibold">{so.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{so.unit}</td>
                    <td className="px-4 py-3"><StatusBadge status={so.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(so.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleOpenDetail(so.id)}
                        className="text-xs bg-gray-50 text-gray-700 border px-3 py-1 rounded hover:bg-gray-100"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {showCreate && <CreateStockOutModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
      {selected && (
        <DetailModal
          stockOut={selected.stockOut}
          logs={selected.logs}
          onClose={() => setSelected(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}