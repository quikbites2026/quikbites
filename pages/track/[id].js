import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { subscribeToOrder } from '../../lib/firebaseHelpers';
import { FiCheckCircle, FiPhone } from 'react-icons/fi';

const STATUS_STEPS = [
  { key: 'pending',          label: 'Order Placed',       icon: '📋', desc: 'Waiting for kitchen to confirm' },
  { key: 'accepted',         label: 'Accepted',           icon: '✅', desc: 'Kitchen confirmed your order' },
  { key: 'preparing',        label: 'Preparing',          icon: '👨‍🍳', desc: 'Your food is being cooked' },
  { key: 'ready',            label: 'Ready',              icon: '🔔', desc: 'Your order is ready!' },
  { key: 'out_for_delivery', label: 'Out for Delivery',   icon: '🛵', desc: 'On the way to you!' },
  { key: 'delivered',        label: 'Delivered',          icon: '🎉', desc: 'Enjoy your meal!' },
];

const PICKUP_STEPS = [
  { key: 'pending',    label: 'Order Placed',      icon: '📋', desc: 'Waiting for kitchen to confirm' },
  { key: 'accepted',  label: 'Accepted',           icon: '✅', desc: 'Kitchen confirmed your order' },
  { key: 'preparing', label: 'Preparing',          icon: '👨‍🍳', desc: 'Your food is being cooked' },
  { key: 'ready',     label: 'Ready for Pickup',   icon: '🔔', desc: 'Please come to collect your order!' },
  { key: 'delivered', label: 'Picked Up',          icon: '🎉', desc: 'Enjoy your meal!' },
];

export default function TrackOrder() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToOrder(id, ord => { setOrder(ord); setLoading(false); });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!order?.estimatedTime) { setTimeLeft(null); return; }
    const interval = setInterval(() => {
      const diff = Math.max(0, order.estimatedTime - Date.now());
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(diff > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : null);
    }, 1000);
    return () => clearInterval(interval);
  }, [order?.estimatedTime]);

  if (loading) return (
    <div className="min-h-screen bg-bg-warm flex items-center justify-center">
      <div className="text-center"><div className="spinner mx-auto mb-3" /><p className="text-text-muted font-semibold">Loading your order...</p></div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-bg-warm flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl mb-3">😕</p>
        <p className="font-display font-bold text-secondary text-xl">Order not found</p>
        <button onClick={() => router.push('/')} className="mt-4 btn-primary px-6 py-3 rounded-xl">Go Home</button>
      </div>
    </div>
  );

  const steps = order.orderType === 'pickup' ? PICKUP_STEPS : STATUS_STEPS;
  const currentIdx = steps.findIndex(s => s.key === order.status);
  const currentStep = steps[currentIdx] || steps[0];
  const isRejected = order.status === 'rejected';
  const isCompleted = order.status === 'delivered';
  const currency = order.currency || 'SBD';

  return (
    <>
      <Head>
        <title>Track {order.orderNumber} — QuikBites</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <div className="min-h-screen bg-bg-warm">
        {/* Header */}
        <div className="header-pattern px-4 py-5 text-center">
          <p className="text-white/60 text-xs mb-1">Order</p>
          <h1 className="font-display font-bold text-white text-2xl sm:text-3xl">{order.orderNumber}</h1>
          <p className="text-white/60 text-xs mt-1">{order.customer?.name} · {order.customer?.phone}</p>
        </div>

        <div className="max-w-lg mx-auto px-3 sm:px-4 py-5 space-y-4"
          style={{paddingBottom: 'max(24px, env(safe-area-inset-bottom))'}}>

          {isRejected && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
              <p className="text-4xl mb-2">😔</p>
              <p className="font-display font-bold text-red-800 text-xl">Order Rejected</p>
              <p className="text-red-600 text-sm mt-1">{order.rejectionReason || 'The kitchen was unable to accept your order at this time.'}</p>
              <button onClick={() => router.push('/')} className="mt-4 btn-primary px-6 py-3 rounded-xl">Order Again</button>
            </div>
          )}

          {/* Timer */}
          {!isRejected && timeLeft && (
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 text-center text-white shadow-warm">
              <p className="text-white/70 text-sm font-semibold mb-1">
                {order.orderType === 'pickup' ? '⏱ Ready in approximately' : '⏱ Estimated delivery in'}
              </p>
              <p className="font-display font-bold text-5xl sm:text-6xl">{timeLeft}</p>
              <p className="text-white/60 text-xs mt-1">minutes remaining</p>
            </div>
          )}

          {/* Current status */}
          {!isRejected && (
            <div className="bg-white rounded-2xl p-5 shadow-card text-center">
              <span className="text-5xl">{currentStep.icon}</span>
              <h2 className="font-display font-bold text-secondary text-xl mt-2">{currentStep.label}</h2>
              <p className="text-text-muted text-sm mt-1">{currentStep.desc}</p>
            </div>
          )}

          {/* Progress steps */}
          {!isRejected && (
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <div className="space-y-3">
                {steps.map((step, idx) => {
                  const done = idx < currentIdx || isCompleted;
                  const active = idx === currentIdx && !isCompleted;
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm transition-all
                        ${done ? 'bg-green-500 text-white' : active ? 'bg-primary text-white' : 'bg-orange-50 text-text-muted'}`}>
                        {done ? <FiCheckCircle size={16} /> : <span>{step.icon}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${active ? 'text-primary' : done ? 'text-green-700' : 'text-text-muted'}`}>
                          {step.label}
                        </p>
                        {active && <p className="text-xs text-text-muted">{step.desc}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order details */}
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <h3 className="font-display font-bold text-secondary mb-3">🧾 Order Details</h3>
            <div className="space-y-1.5 mb-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm gap-2">
                  <span className="text-text-main flex-1 truncate">{item.name} <span className="text-text-muted">×{item.quantity}</span></span>
                  <span className="font-semibold flex-shrink-0">{currency} {(item.discountedPrice * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-orange-100 pt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal</span>
                <span>{currency} {order.subtotal?.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Delivery</span>
                <span className={order.deliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>
                  {order.orderType === 'pickup' ? 'Pickup' : order.deliveryWaived ? '🎁 Waived' : order.deliveryFee === 0 ? 'FREE' : `${currency} ${order.deliveryFee}`}
                </span>
              </div>
              {order.onlineDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Online Discount</span>
                  <span>− {currency} {order.onlineDiscount?.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base pt-1 border-t border-orange-100">
                <span>Total</span>
                <span className="text-primary">{currency} {order.total?.toFixed(0)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-orange-100 text-xs text-text-muted space-y-1">
              <p>💳 {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'M-SELEN Mobile Money'}</p>
              {order.orderType === 'delivery' && order.customer?.address && (
                <p>📍 {order.customer.address}{order.customer.unit ? `, ${order.customer.unit}` : ''}{order.deliveryArea ? ` (${order.deliveryArea})` : ''}</p>
              )}
              {order.customer?.notes && <p>📝 {order.customer.notes}</p>}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-secondary/5 border border-secondary/10 rounded-2xl p-4 text-center text-sm">
            <p className="text-text-muted mb-2">Need help with your order?</p>
            <a href="tel:7348123" className="inline-flex items-center gap-2 font-bold text-primary hover:underline">
              <FiPhone size={14} /> WhatsApp / Call: 7348123
            </a>
          </div>

          {isCompleted && (
            <button onClick={() => router.push('/')} className="btn-primary w-full py-3.5 rounded-xl text-base font-black">
              Order Again 🍛
            </button>
          )}
        </div>
      </div>
    </>
  );
}
