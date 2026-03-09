// pages/InventoryPage.tsx
import { useEffect, useState } from 'react';
import { inventoryApi } from '../api';
import { Pagination } from '../components/common/Pagination';
import { useApp } from '../context/AppContext';
import type { Inventory, InventoryFilter } from '../types';

// ---- Sub-components (view only) ----

function InventoryFilters({
  filter,
  onChange,
}: {
  filter: InventoryFilter;
  onChange: (f: InventoryFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        placeholder="Search by name..."
        value={filter.name || ''}
        onChange={(e) => onChange({ ...filter, name: e.target.value, page: 1 })}
        className="border rounded px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        placeholder="Search by SKU..."
        value={filter.sku || ''}
        onChange={(e) => onChange({ ...filter, sku: e.target.value, page: 1 })}
        className="border rounded px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        placeholder="Search by customer..."
        value={filter.customer || ''}
        onChange={(e) => onChange({ ...filter, customer: e.target.value, page: 1 })}
        className="border rounded px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
}

function InventoryTable({
  inventories,
  onAdjust,
}: {
  inventories: Inventory[];
  onAdjust: (inv: Inventory) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['SKU', 'Name', 'Customer', 'Unit', 'Physical Stock', 'Allocated', 'Available', 'Actions'].map(
              (h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {inventories.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-8 text-gray-400">No inventory found</td>
            </tr>
          ) : (
            inventories.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-blue-700">{inv.sku}</td>
                <td className="px-4 py-3 font-medium">{inv.name}</td>
                <td className="px-4 py-3 text-gray-600">{inv.customer}</td>
                <td className="px-4 py-3 text-gray-500">{inv.unit}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{inv.physical_stock}</td>
                <td className="px-4 py-3 text-yellow-700 font-medium">{inv.allocated_stock}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${inv.available_stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {inv.available_stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onAdjust(inv)}
                    className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded hover:bg-blue-100"
                  >
                    Adjust
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AdjustModal({
  inventory,
  onClose,
  onSubmit,
}: {
  inventory: Inventory;
  onClose: () => void;
  onSubmit: (physicalStock: number) => void;
}) {
  const [value, setValue] = useState(String(inventory.physical_stock));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Adjust Stock — {inventory.name}</h2>
        <div className="mb-4 text-sm text-gray-600">
          <p>SKU: <span className="font-mono font-medium">{inventory.sku}</span></p>
          <p>Current Physical: <span className="font-medium">{inventory.physical_stock}</span></p>
          <p>Allocated: <span className="font-medium text-yellow-700">{inventory.allocated_stock}</span></p>
          <p>Min allowed: <span className="font-medium text-red-600">{inventory.allocated_stock}</span></p>
        </div>
        <label className="block text-sm font-medium mb-1">New Physical Stock</label>
        <input
          type="number"
          value={value}
          min={inventory.allocated_stock}
          onChange={(e) => setValue(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded border hover:bg-gray-100">Cancel</button>
          <button
            onClick={() => onSubmit(Number(value))}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateInventoryModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: { sku: string; name: string; customer: string; unit: string }) => void }) {
  const [form, setForm] = useState({ sku: '', name: '', customer: '', unit: 'pcs' });
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create New Inventory Item</h2>
        {(['sku', 'name', 'customer', 'unit'] as const).map((field) => (
          <div key={field} className="mb-3">
            <label className="block text-sm font-medium mb-1 capitalize">{field}</label>
            <input
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        ))}
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded border hover:bg-gray-100">Cancel</button>
          <button onClick={() => onSubmit(form)} className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Create</button>
        </div>
      </div>
    </div>
  );
}

// ---- Main Page Component ----
export function InventoryPage() {
  const { dispatch } = useApp();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [filter, setFilter] = useState<InventoryFilter>({ page: 1, limit: 10 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Inventory | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchInventories = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getAll(filter);
      if (res.data) {
        setInventories(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.total_pages);
      }
    } catch (err: unknown) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'error', message: String(err) } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, [filter]);

  const handleAdjust = async (physicalStock: number) => {
    if (!adjustTarget) return;
    try {
      await inventoryApi.adjustStock(adjustTarget.id, { physical_stock: physicalStock });
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'success', message: 'Stock adjusted successfully!' } });
      setAdjustTarget(null);
      fetchInventories();
    } catch (err: unknown) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'error', message: String(err) } });
    }
  };

  const handleCreate = async (data: { sku: string; name: string; customer: string; unit: string }) => {
    try {
      await inventoryApi.create(data);
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'success', message: 'Inventory created!' } });
      setShowCreate(false);
      fetchInventories();
    } catch (err: unknown) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'error', message: String(err) } });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} items</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + New Item
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <InventoryFilters filter={filter} onChange={setFilter} />
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <InventoryTable inventories={inventories} onAdjust={setAdjustTarget} />
        )}
        <Pagination page={filter.page || 1} totalPages={totalPages} onPageChange={(p) => setFilter({ ...filter, page: p })} />
      </div>

      {adjustTarget && (
        <AdjustModal inventory={adjustTarget} onClose={() => setAdjustTarget(null)} onSubmit={handleAdjust} />
      )}
      {showCreate && (
        <CreateInventoryModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}