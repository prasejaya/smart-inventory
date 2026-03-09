// pages/ReportPage.tsx
import { useEffect, useState } from 'react';
import { reportApi } from '../api';
import { StatusBadge } from '../components/common/StatusBadge';
import { useApp } from '../context/AppContext';
import type { StockIn, StockOut } from '../types';

type Tab = 'stock-in' | 'stock-out';

interface StockInWithLogs extends StockIn {
  logs: unknown[];
}
interface StockOutWithLogs extends StockOut {
  logs: unknown[];
}

function StockInReportTable({ data }: { data: StockInWithLogs[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['SKU', 'Name', 'Customer', 'Qty', 'Unit', 'Status', 'Completed At'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-8 text-gray-400">No completed stock in transactions</td></tr>
          ) : (
            data.map((si) => (
              <tr key={si.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-blue-700">{si.sku}</td>
                <td className="px-4 py-3 font-medium">{si.name}</td>
                <td className="px-4 py-3 text-gray-600">{si.customer}</td>
                <td className="px-4 py-3 font-semibold">{si.quantity}</td>
                <td className="px-4 py-3 text-gray-500">{si.unit}</td>
                <td className="px-4 py-3"><StatusBadge status={si.status} /></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(si.updated_at).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function StockOutReportTable({ data }: { data: StockOutWithLogs[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['SKU', 'Name', 'Customer', 'Qty', 'Unit', 'Status', 'Completed At'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-8 text-gray-400">No completed stock out transactions</td></tr>
          ) : (
            data.map((so) => (
              <tr key={so.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-blue-700">{so.sku}</td>
                <td className="px-4 py-3 font-medium">{so.name}</td>
                <td className="px-4 py-3 text-gray-600">{so.customer}</td>
                <td className="px-4 py-3 font-semibold">{so.quantity}</td>
                <td className="px-4 py-3 text-gray-500">{so.unit}</td>
                <td className="px-4 py-3"><StatusBadge status={so.status} /></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(so.updated_at).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ReportPage() {
  const { dispatch } = useApp();
  const [tab, setTab] = useState<Tab>('stock-in');
  const [stockInData, setStockInData] = useState<StockInWithLogs[]>([]);
  const [stockOutData, setStockOutData] = useState<StockOutWithLogs[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [siRes, soRes] = await Promise.all([
          reportApi.getStockInReport(),
          reportApi.getStockOutReport(),
        ]);
        if (siRes.data) setStockInData(siRes.data as StockInWithLogs[]);
        if (soRes.data) setStockOutData(soRes.data as StockOutWithLogs[]);
      } catch (err: unknown) {
        dispatch({ type: 'SET_NOTIFICATION', payload: { type: 'error', message: String(err) } });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Only showing completed (DONE) transactions</p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('stock-in')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'stock-in' ? 'bg-blue-600 text-white' : 'border hover:bg-gray-100'}`}
        >
          ⬇️ Stock In Report ({stockInData.length})
        </button>
        <button
          onClick={() => setTab('stock-out')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'stock-out' ? 'bg-blue-600 text-white' : 'border hover:bg-gray-100'}`}
        >
          ⬆️ Stock Out Report ({stockOutData.length})
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading report data...</div>
        ) : tab === 'stock-in' ? (
          <StockInReportTable data={stockInData} />
        ) : (
          <StockOutReportTable data={stockOutData} />
        )}
      </div>
    </div>
  );
}