// components/common/StatusBadge.tsx
import type { StockInStatus, StockOutStatus } from '../../types';

type Status = StockInStatus | StockOutStatus;

const statusConfig: Record<Status, { label: string; className: string }> = {
  CREATED: { label: 'Created', className: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800' },
  DONE: { label: 'Done', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
  ALLOCATED: { label: 'Allocated', className: 'bg-purple-100 text-purple-800' },
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}