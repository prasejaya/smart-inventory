// components/common/Notification.tsx
import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export function Notification() {
  const { state, dispatch } = useApp();
  const { notification } = state;

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_NOTIFICATION', payload: null });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, dispatch]);

  if (!notification) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white text-sm font-medium transition-all ${
        notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      {notification.message}
    </div>
  );
}