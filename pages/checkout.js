import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import { getSettings, createOrder } from '../lib/firebaseHelpers';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMapPin, FiUser, FiPhone, FiMail, FiFileText, FiHome, FiTruck } from 'react-icons/fi';

export default function Checkout() {
  const router = useRouter();
  const { items, subtotal, clearCart, getDiscountedPrice } = useCart();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderType, setOrderType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [selectedArea, setSelectedArea] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '', email: '', notes: '', unit: '' });

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      if (s?.deliveryAreas?.length) setSelectedArea(s.deliveryAreas[0].id);
    });
  }, []);

  useEffect(() => {
    if (items.length === 0) router.push('/');
  }, [items, router]);

  const currency = settings?.currency || 'SBD';
  const freeThreshold = settings?.freeDeliveryThreshold || 100;
  const area = settings?.deliveryAreas?.find(a => a.id === selectedArea);
  const baseDeliveryFee = area?.fee ?? settings?.defaultDeliveryFee ?? 10;
  const deliveryFee = orderType === 'pickup' ? 0 : (subtotal >= freeThreshold ? 0 : baseDeliveryFee);
  const isFreeDelivery = orderType === 'delivery' && subtotal >= freeThreshold;
  const opd = settings?.onlinePaymentDiscount;
  let onlineDiscount = 0;
  if (paymentMethod === 'mselen' && opd?.enabled && opd?.value > 0) {
    onlineDiscount = opd.type === 'percentage' ? (subtotal * opd.value) / 100 : opd.value;
  }
  const total = subtotal + deliveryFee - onlineDiscount;

  function handleChange(e) { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Please fill in your name and phone number'); return; }
    if (orderType === 'delivery' && !form.address) { toast.error('Please enter your delivery address'); return; }
    setLoading(true);
    try {
      const orderData = {
        items: items.map(i => ({
          id: i.id, name: i.name, price: i.price,
          discountPercent: i.discountPercent || 0,
          discountedPrice: getDiscountedPrice(i.price, i.discountPercent),
          quantity: i.quantity,
        })),
        customer: { name: form.name, phone: form.phone, email: form.email || '', address: form.address || '', unit: form.unit || '', notes: form.notes || '' },
        orderType, paymentMethod,
        deliveryArea: orderType === 'delivery' ? (area?.name || '') : '',
        subtotal, deliveryFee, onlineDiscount, total, currency,
        status: 'pending', estimatedTime: null, deliveryWaived: false,
      };
      const { id, orderNumber } = await createOrder(orderData);
      clearCart();
      router.push(`/track/${id}?orderNumber=${orderNumber}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inp = "w-full bg-bg-warm border border-orange-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary";

  return (
    <>
      <Head>
        <title>Checkout — QuikBites</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <div className="min-h-screen bg-bg-warm">
        {/* Header */}
        <div className="header-pattern px-3 sm:px-4 py-3.5 sticky top-0 z-30">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => router.back()} className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
              <FiArrowLeft size={20} />
            </button>
            <h1 className="font-display font-bold text-white text-lg">Checkout</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4"
          style={{paddingBottom: 'max(120px, env(safe-area-inset-bottom, 120px))'}}>

          {/* Order Type */}
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <h2 className="font-display font-bold text-secondary mb-3 text-sm sm:text-base flex items-center gap-2">
              <FiTruck size={16} className="text-primary" /> Delivery or Pickup?
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { value: 'delivery', label: '🛵 Delivery', desc: 'Delivered to your door' },
                { value: 'pickup', label: '🏃 Pickup', desc: 'Collect yourself' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => setOrderType(opt.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${orderType === opt.value ? 'border-primary bg-orange-50' : 'border-orange-100 hover:border-orange-200'}`}>
                  <p className="font-bold text-secondary text-sm">{opt.label}</p>
                  <p className="text-text-muted text-xs hidden sm:block">{opt.desc}</p>
                </button>
              ))}
            </div>
            {orderType === 'delivery' && settings?.deliveryAreas?.length > 0 && (
              <div className="mt-3">
                <label className="text-xs font-bold text-text-muted mb-1 block">Delivery Area</label>
                <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} className={inp}>
                  {settings.deliveryAreas.map(a => (
                    <option key={a.id} value={a.id}>{a.name} — {currency} {a.fee} delivery</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="bg-white rounded-2xl p-4 shadow-card space-y-3">
            <h2 className="font-display font-bold text-secondary text-sm sm:text-base flex items-center gap-2">
              <FiUser size={16} className="text-primary" /> Your Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-text-muted mb-1 block">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. John Doe" className={inp} />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted mb-1 block">Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} required placeholder="e.g. 7348123" className={inp} />
              </div>
            </div>
            {orderType === 'delivery' && (
              <>
                <div>
                  <label className="text-xs font-bold text-text-muted mb-1 block">Delivery Address *</label>
                  <input name="address" value={form.address} onChange={handleChange} placeholder="Street name, area" className={inp} />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted mb-1 block">Unit/Apt <span className="font-normal">(optional)</span></label>
                  <input name="unit" value={form.unit} onChange={handleChange} placeholder="e.g. Unit 3, Block B" className={inp} />
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-bold text-text-muted mb-1 block">Email <span className="font-normal">(optional)</span></label>
              <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="e.g. john@email.com" className={inp} />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted mb-1 block">Special Instructions <span className="font-normal">(optional)</span></label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                placeholder="e.g. No spice, extra sauce, call on arrival..."
                className={`${inp} resize-none`} />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <h2 className="font-display font-bold text-secondary mb-3 text-sm sm:text-base">💳 Payment Method</h2>
            <div className="space-y-2">
              <button type="button" onClick={() => setPaymentMethod('cod')}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${paymentMethod === 'cod' ? 'border-primary bg-orange-50' : 'border-orange-100'}`}>
                <span className="text-2xl flex-shrink-0">💵</span>
                <div>
                  <p className="font-bold text-secondary text-sm">Cash on Delivery</p>
                  <p className="text-text-muted text-xs">Pay when your order arrives</p>
                </div>
              </button>
              {settings?.mselenConfig?.enabled && (
                <button type="button" onClick={() => setPaymentMethod('mselen')}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${paymentMethod === 'mselen' ? 'border-primary bg-orange-50' : 'border-orange-100'}`}>
                  <span className="text-2xl flex-shrink-0">📱</span>
                  <div>
                    <p className="font-bold text-secondary text-sm">M-SELEN Mobile Money</p>
                    <p className="text-text-muted text-xs">
                      Pay instantly online
                      {opd?.enabled && opd?.value > 0 && (
                        <span className="ml-1 text-green-600 font-bold">
                          — Save {opd.type === 'percentage' ? `${opd.value}%` : `${currency} ${opd.value}`}!
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <h2 className="font-display font-bold text-secondary mb-3 text-sm sm:text-base">🧾 Order Summary</h2>
            <div className="space-y-1.5 mb-3">
              {items.map(item => {
                const price = getDiscountedPrice(item.price, item.discountPercent);
                return (
                  <div key={item.id} className="flex justify-between items-start text-sm gap-2">
                    <span className="text-text-main flex-1">{item.name} <span className="text-text-muted">×{item.quantity}</span></span>
                    <span className="font-semibold text-secondary flex-shrink-0">{currency} {(price * item.quantity).toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-orange-100 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="font-semibold">{currency} {subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Delivery</span>
                <span className={`font-semibold ${deliveryFee === 0 ? 'text-green-600' : ''}`}>
                  {orderType === 'pickup' ? 'Pickup (Free)' : isFreeDelivery ? '🎉 FREE' : `${currency} ${deliveryFee}`}
                </span>
              </div>
              {onlineDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-semibold">
                  <span>Online Payment Discount</span>
                  <span>− {currency} {onlineDiscount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base sm:text-lg pt-2 border-t border-orange-100">
                <span className="text-secondary">Total</span>
                <span className="text-primary">{currency} {total.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {paymentMethod === 'mselen' && settings?.mselenConfig?.enabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm">
              <p className="font-bold text-blue-800 mb-1">📱 M-SELEN Payment Instructions</p>
              <p className="text-blue-700">After placing your order, transfer <strong>{currency} {total.toFixed(0)}</strong> via M-SELEN to complete your order.</p>
              {settings.mselenConfig.merchantId && (
                <p className="text-blue-700 mt-1">Merchant ID: <strong>{settings.mselenConfig.merchantId}</strong></p>
              )}
            </div>
          )}

          {/* Submit — sticky on mobile */}
          <div className="fixed bottom-0 left-0 right-0 sm:relative sm:bottom-auto sm:left-auto sm:right-auto bg-white sm:bg-transparent p-3 sm:p-0 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] sm:shadow-none"
            style={{paddingBottom: 'max(12px, env(safe-area-inset-bottom))'}}>
            <button type="submit" disabled={loading || items.length === 0}
              className="btn-primary w-full py-4 rounded-2xl text-base font-black max-w-2xl mx-auto block">
              {loading ? (
                <span className="flex items-center justify-center gap-2"><div className="spinner w-5 h-5" /> Placing Order...</span>
              ) : `🍛 Place Order — ${currency} ${total.toFixed(0)}`}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
