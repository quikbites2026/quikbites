import Image from 'next/image';
import { useCart } from '../context/CartContext';
import { FiShoppingCart, FiPhone } from 'react-icons/fi';

export default function Header({ settings }) {
  const { itemCount, subtotal, setIsCartOpen } = useCart();
  const currency = settings?.currency || 'SBD';
  const isOpen = settings?.openingHours?.isOpen !== false;

  return (
    <>
      {/* Top header bar */}
      <header className="header-pattern sticky top-0 z-40 shadow-lg">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">

          {/* Logo + Name */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 flex-shrink-0">
              <Image src="/logo.png" alt="QuikBites" fill style={{ objectFit: 'cover' }} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-white text-lg sm:text-xl leading-tight">QuikBites</h1>
              <p className="text-white/55 text-xs leading-none hidden sm:block">South Asian Cloud Kitchen</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <span className={`text-xs font-bold px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${
              isOpen
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {isOpen ? '🟢 Open' : '🔴 Closed'}
            </span>
            {settings?.contactPhone && (
              <a href={`tel:${settings.contactPhone}`}
                className="hidden md:flex items-center gap-1 text-white/70 hover:text-white text-sm transition-colors">
                <FiPhone size={14} />
                <span>{settings.contactPhone}</span>
              </a>
            )}
            {/* Desktop cart button */}
            <button onClick={() => setIsCartOpen(true)}
              className="relative hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-sm px-4 py-2 rounded-full transition-colors">
              <FiShoppingCart size={16} />
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-secondary text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile floating cart bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-35 sm:hidden" style={{paddingBottom: 'env(safe-area-inset-bottom, 8px)'}}>
          <div className="mx-3 mb-2">
            <button onClick={() => setIsCartOpen(true)}
              className="btn-primary w-full py-3.5 rounded-2xl flex items-center justify-between px-5 shadow-2xl">
              <div className="flex items-center gap-2">
                <span className="bg-white/25 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
                <span className="font-bold text-sm">View Cart</span>
              </div>
              <span className="font-black text-sm">{currency} {subtotal.toFixed(0)}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
