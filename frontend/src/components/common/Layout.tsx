// components/layout/Layout.tsx
import { Link, useLocation } from 'react-router-dom';
import { Notification } from '../common/Notification';

const navLinks = [
  { path: '/', label: '📦 Inventory' },
  { path: '/stock-in', label: '⬇️ Stock In' },
  { path: '/stock-out', label: '⬆️ Stock Out' },
  { path: '/reports', label: '📊 Reports' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Notification />
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-blue-700">🏭 Smart Inventory</span>
            </div>
            <div className="flex gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}