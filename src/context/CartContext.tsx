import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartItem } from '../types';

interface StockNotification {
  message: string;
  productName: string;
  maxStock: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  stockNotification: StockNotification | null;
  dismissNotification: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [stockNotification, setStockNotification] = useState<StockNotification | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Clear notification timer on unmount
  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  const showStockNotification = useCallback((productName: string, maxStock: number) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }

    setStockNotification({
      message: `Only ${maxStock} unit${maxStock !== 1 ? 's' : ''} of "${productName}" available. Quantity capped at maximum stock.`,
      productName,
      maxStock,
    });

    notificationTimerRef.current = setTimeout(() => {
      setStockNotification(null);
      notificationTimerRef.current = null;
    }, 5000);
  }, []);

  const dismissNotification = useCallback(() => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    setStockNotification(null);
  }, []);

  const addToCart = (item: CartItem) => {
    const availableStock = item.stock ?? Infinity;

    setCart((prev) => {
      const existing = prev.find(
        (ci) => ci.productId === item.productId && ci.variantId === item.variantId
      );
      const currentQuantity = existing ? existing.quantity : 0;

      // Check if adding 1 more would exceed stock
      if (currentQuantity + 1 > availableStock) {
        showStockNotification(item.name, availableStock);
        return prev;
      }

      if (existing) {
        return prev.map((ci) =>
          ci.productId === item.productId && ci.variantId === item.variantId
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string, variantId: string) => {
    setCart((prev) =>
      prev.filter((ci) => !(ci.productId === productId && ci.variantId === variantId))
    );
  };

  const updateQuantity = (productId: string, variantId: string, quantity: number) => {
    if (quantity < 1) {
      setCart((prev) =>
        prev.filter((ci) => !(ci.productId === productId && ci.variantId === variantId))
      );
      return;
    }

    setCart((prev) => {
      const item = prev.find(
        (ci) => ci.productId === productId && ci.variantId === variantId
      );
      if (!item) return prev;

      const availableStock = item.stock ?? Infinity;

      if (quantity > availableStock) {
        showStockNotification(item.name, availableStock);
        return prev.map((ci) =>
          ci.productId === productId && ci.variantId === variantId
            ? { ...ci, quantity: availableStock }
            : ci
        );
      }

      return prev.map((ci) =>
        ci.productId === productId && ci.variantId === variantId
          ? { ...ci, quantity }
          : ci
      );
    });
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal, stockNotification, dismissNotification }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
