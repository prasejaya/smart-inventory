// pages/StockInPage.tsx
import { useEffect, useState } from 'react';
import { stockInApi } from '../api';
import { Pagination } from '../components/common/Pagination';
import { StatusBadge } from '../components/common/StatusBadge';
import { useApp } from '../context/AppContext';
import type { StockIn, StockInLog, StockInStatus } from '../types';

const NEXT_STATUSES: Record<StockInStatus, StockInStatus[]> = {
  CREATED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DONE', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
};

function CreateStockInModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: object) => void }) {
  const [form, setForm] = useState({ sku: '', name: '', customer: '', quantity: '', unit: 'pcs', notes: '' });
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Create Stock In</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'sku', label: 'SKU' },
            { key: 'name', label: 'Product Name' },
            { key: 'customer', label: 'Customer' },
            { key: 'unit', label: 'Unit' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded border hover:bg-gray-100">Cancel</button>
          <button
            onClick={() => onSubmit({ ...form, quantity: Number(form.quantity) })}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ stockIn, logs, onClose, onUpdateStatus }: {
  stockIn: StockIn;
  logs: StockInLog[];
  onClose: () => void;
  onUpdateStatus: (status: StockInStatus, notes: string) => void;
}) {
  const [notes, setNotes] = useState('');
  const nextStatuses = NEXT_STATUSES[stockIn.status];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Stock In Detail</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            {[
              ['SKU', stockIn.sku],
              ['Name', stockIn.name],
              ['Customer', stockIn.customer],
              ['Quantity', `${stockIn.quantity} ${stockIn.unit}`],
              ['Status', null],
              ['Notes', stockIn.notes || '-'],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <span className="text-gray-500 text-xs uppercase">{label}</span>
                <p className="font-medium mt-0.5">
                  {label === 'Status' ? <StatusBadge status={stockIn.status} /> : value}
                </p>
              </div>
            ))}
          </div>

          {/* History Logs */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">History / Audit Log</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="text-xs bg-gray-50 rounded p-2 border-l-4 border-blue-300">
                  <div className="flex justify-between">
                    <span>{log.old_status ? `${log.old_status} → ${log.new_status}` : `Created as ${log.new_status}`}</span>
                    <span className="text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  {log.notes && <p className="text-gray-500 mt-0.5">{log.notes}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Status Update */}
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
                    → {status}
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

export function StockInPage() {
  const { dispatch } = useApp();
  const [stockIns, setStockIns] = useState<StockIn[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<{ stockIn: StockIn; logs: StockInLog[] } | null>(null);

  const fetchStockIns = async () => {
    setLoading(true);
    try {
      const res = await stockInApi.getAll(page);
      if (res.data) {
        setStockIns(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.total_pages);
      }
    } catch (err: unknown) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'error', message: String(err) } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStockIns(); }, [page]);

  const handleCreate = async (data: object) => {
    try {
      await stockInApi.create(data as Parameters<typeof stockInApi.create>[0]);
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'success', message: 'Stock In created!' } });
      setShowCreate(false);
      fetchStockIns();
    } catch (err: unknown) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'error', message: String(err) } });
    }
  };

  const handleOpenDetail = async (id: string) => {
    try {
      const res = await stockInApi.getById(id);
      if (res.data) {
        setSelected({ stockIn: res.data.stock_in as StockIn, logs: res.data.logs as StockInLog[] });
      }
    } catch (err: unknown) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'error', message: String(err) } });
    }
  };

  const handleUpdateStatus = async (status: StockInStatus, notes: string) => {
    if (!selected) return;
    try {
      await stockInApi.updateStatus(selected.stockIn.id, { status, notes });
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'success', message: `Status updated to ${status}!` } });
      setSelected(null);
      fetchStockIns();
    } catch (err: unknown) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'error', message: String(err) } });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock In (Barang Masuk)</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} transactions</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + New Stock In
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
              ) : stockIns.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No stock in transactions</td></tr>
              ) : (
                stockIns.map((si) => (
                  <tr key={si.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-700">{si.sku}</td>
                    <td className="px-4 py-3 font-medium">{si.name}</td>
                    <td className="px-4 py-3 text-gray-600">{si.customer}</td>
                    <td className="px-4 py-3 font-semibold">{si.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{si.unit}</td>
                    <td className="px-4 py-3"><StatusBadge status={si.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(si.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleOpenDetail(si.id)}
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

      {showCreate && <CreateStockInModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
      {selected && (
        <DetailModal
          stockIn={selected.stockIn}
          logs={selected.logs}
          onClose={() => setSelected(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}