import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('quikbites_cart');
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('quikbites_cart', JSON.stringify(items));
  }, [items]);

  function addItem(menuItem, quantity = 1) {
    setItems(prev => {
      const existing = prev.find(i => i.id === menuItem.id);
      if (existing) {
        return prev.map(i =>
          i.id === menuItem.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...menuItem, quantity }];
    });
    setIsCartOpen(true);
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function updateQuantity(id, quantity) {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  }

  function clearCart() {
    setItems([]);
  }

  function getDiscountedPrice(price, discountPercent) {
    if (!discountPercent || discountPercent <= 0) return price;
    return price - (price * discountPercent) / 100;
  }

  const subtotal = items.reduce((sum, item) => {
    const price = getDiscountedPrice(item.price, item.discountPercent);
    return sum + price * item.quantity;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      subtotal,
      itemCount,
      isCartOpen,
      setIsCartOpen,
      getDiscountedPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
