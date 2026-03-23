import { useCart } from '../context/CartContext';
import { useRouter } from 'next/router';
import { FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';

export default function CartSidebar({ settings }) {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, subtotal, itemCount, getDiscountedPrice } = useCart();
  const router = useRouter();

  const currency = settings?.currency || 'SBD';
  const freeThreshold = settings?.freeDeliveryThreshold || 100;

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />

      {/* Sidebar — full width on mobile, fixed width on larger screens */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-sm bg-bg-warm z-50 shadow-2xl flex flex-col"
        style={{maxWidth: 'min(100vw, 400px)'}}>

        {/* Header */}
        <div className="header-pattern px-4 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-white text-lg">Your Order</h2>
            <p className="text-white/60 text-xs">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setIsCartOpen(false)}
            className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
            <FiX size={22} />
          </button>
        </div>

        {/* Free delivery progress */}
        {subtotal < freeThreshold && subtotal > 0 && (
          <div className="mx-3 mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex-shrink-0">
            <p className="text-xs text-amber-800 font-semibold mb-1.5">
              Add {currency} {(freeThreshold - subtotal).toFixed(0)} more for FREE delivery! 🎉
            </p>
            <div className="w-full bg-amber-200 rounded-full h-1.5">
              <div className="bg-amber-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, (subtotal / freeThreshold) * 100)}%` }} />
            </div>
          </div>
        )}
        {subtotal >= freeThreshold && (
          <div className="mx-3 mt-3 bg-green-50 border border-green-200 rounded-xl p-2.5 text-center flex-shrink-0">
            <p className="text-xs text-green-800 font-bold">🎉 You qualify for FREE delivery!</p>
          </div>
        )}

        {/* Items — scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <FiShoppingBag size={48} className="text-primary/30 mb-3" />
              <p className="font-display font-semibold text-text-muted">Your cart is empty</p>
              <p className="text-xs text-text-muted mt-1">Add some delicious items!</p>
            </div>
          ) : (
            items.map(item => {
              const price = getDiscountedPrice(item.price, item.discountPercent);
              const hasDiscount = item.discountPercent > 0;
              return (
                <div key={item.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-main text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-primary font-bold text-sm">
                        {currency} {(price * item.quantity).toFixed(0)}
                      </span>
                      {hasDiscount && (
                        <span className="text-text-muted text-xs line-through">
                          {currency} {(item.price * item.quantity).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Qty controls */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-primary transition-colors">
                      {item.quantity === 1 ? <FiTrash2 size={13} /> : <FiMinus size={13} />}
                    </button>
                    <span className="w-6 text-center font-bold text-sm text-secondary">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-primary transition-colors">
                      <FiPlus size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-3 pb-4 pt-3 border-t border-orange-100 space-y-3 bg-white flex-shrink-0"
            style={{paddingBottom: 'max(16px, env(safe-area-inset-bottom))'}}>
            <div className="flex justify-between items-center px-1">
              <span className="text-text-muted font-semibold text-sm">Subtotal</span>
              <span className="font-black text-secondary text-lg">{currency} {subtotal.toFixed(0)}</span>
            </div>
            <button
              onClick={() => { setIsCartOpen(false); router.push('/checkout'); }}
              className="btn-primary w-full py-4 rounded-xl text-base font-black">
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
