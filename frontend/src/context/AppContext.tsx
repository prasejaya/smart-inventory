// context/AppContext.tsx
import React, { createContext, useContext, useReducer } from 'react';
import type { Inventory, StockIn, StockOut } from '../types';

interface AppState {
  inventories: Inventory[];
  stockIns: StockIn[];
  stockOuts: StockOut[];
  loading: boolean;
  error: string | null;
  notification: { type: 'success' | 'error'; message: string } | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATION'; payload: { type: 'success' | 'error'; message: string } | null }
  | { type: 'SET_INVENTORIES'; payload: Inventory[] }
  | { type: 'SET_STOCK_INS'; payload: StockIn[] }
  | { type: 'SET_STOCK_OUTS'; payload: StockOut[] }
  | { type: 'UPDATE_INVENTORY'; payload: Inventory }
  | { type: 'UPDATE_STOCK_IN'; payload: StockIn }
  | { type: 'UPDATE_STOCK_OUT'; payload: StockOut };

const initialState: AppState = {
  inventories: [],
  stockIns: [],
  stockOuts: [],
  loading: false,
  error: null,
  notification: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'SET_INVENTORIES':
      return { ...state, inventories: action.payload };
    case 'SET_STOCK_INS':
      return { ...state, stockIns: action.payload };
    case 'SET_STOCK_OUTS':
      return { ...state, stockOuts: action.payload };
    case 'UPDATE_INVENTORY':
      return {
        ...state,
        inventories: state.inventories.map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case 'UPDATE_STOCK_IN':
      return {
        ...state,
        stockIns: state.stockIns.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case 'UPDATE_STOCK_OUT':
      return {
        ...state,
        stockOuts: state.stockOuts.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}