// App.tsx
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AppProvider } from './context/AppContext';
import { InventoryPage } from './pages/InventoryPage';
import { ReportPage } from './pages/ReportPage';
import { StockInPage } from './pages/StockInPage';
import { StockOutPage } from './pages/StockOutPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<InventoryPage />} />
            <Route path="/stock-in" element={<StockInPage />} />
            <Route path="/stock-out" element={<StockOutPage />} />
            <Route path="/reports" element={<ReportPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}