import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import { FiShoppingCart, FiPhone, FiX } from 'react-icons/fi';

const CONTACT_PHONE = '7348123';

export default function Header({ settings }) {
  const { itemCount, subtotal, setIsCartOpen } = useCart();
  const currency = settings?.currency || 'SBD';
  const isOpen = settings?.openingHours?.isOpen !== false;
  const [showContact, setShowContact] = useState(false);

  const whatsappUrl = `https://wa.me/677${CONTACT_PHONE}?text=${encodeURIComponent('Hi QuikBites, I would like to place an order!')}`;
  const smsUrl = `sms:${CONTACT_PHONE}?body=${encodeURIComponent('Hi QuikBites, I would like to place an order!')}`;

  return (
    <>
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
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

            {/* Open/Closed — emoji only on mobile, full text on desktop */}
            <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
              isOpen
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              <span className="sm:hidden">{isOpen ? '🟢' : '🔴'}</span>
              <span className="hidden sm:inline">{isOpen ? '🟢 Open' : '🔴 Closed'}</span>
            </span>

            {/* Contact button — ALL screen sizes */}
            <button
              onClick={() => setShowContact(true)}
              className="flex items-center gap-1 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1.5 rounded-full transition-colors border border-white/20 flex-shrink-0"
            >
              <FiPhone size={13} />
              <span className="text-xs font-bold hidden sm:inline">{CONTACT_PHONE}</span>
              <span className="text-xs font-bold sm:hidden">Call</span>
            </button>

            {/* Cart button — desktop only (mobile uses floating bar) */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-sm px-4 py-2 rounded-full transition-colors"
            >
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
        <div className="fixed bottom-0 left-0 right-0 z-35 sm:hidden"
          style={{paddingBottom: 'env(safe-area-inset-bottom, 8px)'}}>
          <div className="mx-3 mb-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="btn-primary w-full py-3.5 rounded-2xl flex items-center justify-between px-5 shadow-2xl"
            >
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

      {/* Contact popup modal */}
      {showContact && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={() => setShowContact(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-5 z-50 max-w-sm mx-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-secondary text-lg">Contact QuikBites</h3>
              <button
                onClick={() => setShowContact(false)}
                className="text-text-muted hover:text-secondary p-1 rounded-lg hover:bg-orange-50"
              >
                <FiX size={20} />
              </button>
            </div>
            <p className="text-text-muted text-sm mb-4">We are here to help! Reach us via:</p>
            <div className="space-y-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowContact(false)}
                className="flex items-center gap-3 bg-green-50 hover:bg-green-100 border border-green-200 text-green-800 font-bold text-sm px-4 py-3 rounded-xl transition-colors"
              >
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-bold">WhatsApp</p>
                  <p className="text-xs text-green-600 font-normal">Chat with us on WhatsApp</p>
                </div>
              </a>
              <a
                href={smsUrl}
                onClick={() => setShowContact(false)}
                className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-sm px-4 py-3 rounded-xl transition-colors"
              >
                <span className="text-2xl">📱</span>
                <div>
                  <p className="font-bold">Send SMS</p>
                  <p className="text-xs text-blue-600 font-normal">Send us a text message</p>
                </div>
              </a>
              <a
                href={`tel:${CONTACT_PHONE}`}
                onClick={() => setShowContact(false)}
                className="flex items-center gap-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-primary font-bold text-sm px-4 py-3 rounded-xl transition-colors"
              >
                <span className="text-2xl">📞</span>
                <div>
                  <p className="font-bold">Call Us</p>
                  <p className="text-xs text-primary font-normal">{CONTACT_PHONE}</p>
                </div>
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}
