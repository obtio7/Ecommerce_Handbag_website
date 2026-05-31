import React from 'react';
import { useCart } from '../context/CartContext';
import { AlertTriangle, X } from 'lucide-react';

const StockNotification: React.FC = () => {
  const { stockNotification, dismissNotification } = useCart();

  if (!stockNotification) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-50 max-w-sm bg-amber-50 border border-amber-300 rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4"
    >
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">Stock Limited</p>
        <p className="text-sm text-amber-700 mt-1">
          {stockNotification.message}
        </p>
      </div>
      <button
        onClick={dismissNotification}
        className="flex-shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default StockNotification;

