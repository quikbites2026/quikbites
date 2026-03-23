import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { subscribeToActiveOrders, updateOrderStatus } from '../../lib/firebaseHelpers';
import toast from 'react-hot-toast';
import { FiLogOut, FiCheck, FiX, FiClock, FiTruck, FiBell } from 'react-icons/fi';

const STATUS_ACTIONS = {
  pending: [
    { label: 'Accept', next: 'accepted', color: 'bg-green-500 hover:bg-green-600', icon: '✅' },
    { label: 'Reject', next: 'rejected', color: 'bg-red-500 hover:bg-red-600', icon: '❌' },
  ],
  accepted: [{ label: 'Start Preparing', next: 'preparing', color: 'bg-blue-500 hover:bg-blue-600', icon: '👨‍🍳' }],
  preparing: [{ label: 'Mark Ready', next: 'ready', color: 'bg-purple-500 hover:bg-purple-600', icon: '🔔' }],
  ready: [
    { label: 'Out for Delivery', next: 'out_for_delivery', color: 'bg-orange-500 hover:bg-orange-600', icon: '🛵' },
    { label: 'Mark Delivered', next: 'delivered', color: 'bg-green-500 hover:bg-green-600', icon: '🎉' },
  ],
  out_for_delivery: [{ label: 'Mark Delivered', next: 'delivered', color: 'bg-green-500 hover:bg-green-600', icon: '🎉' }],
};

const STATUS_COLORS = {
  pending: 'status-pending', accepted: 'status-accepted', preparing: 'status-preparing',
  ready: 'status-ready', out_for_delivery: 'status-out_for_delivery',
  delivered: 'status-delivered', rejected: 'status-rejected',
};

export default function Kitchen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showTimerModal, setShowTimerModal] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [waiveDelivery, setWaiveDelivery] = useState(false);
  const prevOrderIds = useRef(new Set());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) router.push('/login?role=kitchen');
      else setUser(u);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToActiveOrders(newOrders => {
      const hasNew = newOrders.some(o => !prevOrderIds.current.has(o.id));
      if (hasNew && prevOrderIds.current.size > 0) playAlert();
      prevOrderIds.current = new Set(newOrders.map(o => o.id));
      setOrders(newOrders);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  function playAlert() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 200, 400].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay/1000);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay/1000 + 0.3);
        osc.start(ctx.currentTime + delay/1000);
        osc.stop(ctx.currentTime + delay/1000 + 0.3);
      });
    } catch {}
  }

  async function handleAction(orderId, nextStatus, extra = {}) {
    try {
      await updateOrderStatus(orderId, nextStatus, extra);
      toast.success(`Order updated!`);
    } catch { toast.error('Failed to update order'); }
  }

  async function handleAcceptWithTimer(orderId) {
    const estimatedTime = Date.now() + timerMinutes * 60 * 1000;
    await handleAction(orderId, 'accepted', { estimatedTime, deliveryWaived: waiveDelivery });
    setShowTimerModal(null); setWaiveDelivery(false);
  }

  async function handleReject(orderId) {
    await handleAction(orderId, 'rejected', { rejectionReason });
    setShowRejectModal(null); setRejectionReason('');
  }

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => o.status !== 'pending');

  if (loading) return (
    <div className="min-h-screen bg-secondary flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" style={{borderColor:'rgba(255,255,255,0.2)',borderTopColor:'#E8651A'}} />
        <p className="text-white/60 text-sm">Loading kitchen...</p>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Kitchen Dashboard — QuikBites</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <div className="min-h-screen bg-secondary text-white" style={{paddingBottom:'env(safe-area-inset-bottom)'}}>
        {/* Header */}
        <div className="bg-black/30 px-3 sm:px-4 py-3 flex items-center justify-between sticky top-0 z-30"
          style={{paddingTop:'max(12px,env(safe-area-inset-top))'}}>
          <div>
            <h1 className="font-display font-bold text-white text-lg">👨‍🍳 Kitchen</h1>
            <p className="text-white/50 text-xs">{orders.length} active order{orders.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {pendingOrders.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full animate-pulse">
                {pendingOrders.length} NEW
              </span>
            )}
            <button onClick={() => signOut(auth)} className="text-white/50 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-3 py-4 space-y-4">
          {pendingOrders.length > 0 && (
            <div>
              <h2 className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <FiBell size={12} className="text-red-400" /> New Orders ({pendingOrders.length})
              </h2>
              <div className="space-y-3">
                {pendingOrders.map(order => (
                  <OrderCard key={order.id} order={order} isPending
                    onAccept={() => setShowTimerModal(order.id)}
                    onReject={() => setShowRejectModal(order.id)} />
                ))}
              </div>
            </div>
          )}

          {activeOrders.length > 0 && (
            <div>
              <h2 className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <FiClock size={12} className="text-yellow-400" /> In Progress ({activeOrders.length})
              </h2>
              <div className="space-y-3">
                {activeOrders.map(order => (
                  <OrderCard key={order.id} order={order}
                    onAction={(next) => handleAction(order.id, next)} />
                ))}
              </div>
            </div>
          )}

          {orders.length === 0 && (
            <div className="text-center py-24">
              <p className="text-6xl mb-3">🍽️</p>
              <p className="font-display font-bold text-white/60 text-xl">No active orders</p>
              <p className="text-white/30 text-sm mt-1">New orders will appear here in real-time</p>
            </div>
          )}
        </div>

        {/* Accept + Timer modal */}
        {showTimerModal && (
          <Modal onClose={() => { setShowTimerModal(null); setWaiveDelivery(false); }}>
            <h3 className="font-display font-bold text-secondary text-lg mb-4 text-center">✅ Accept Order</h3>
            <div className="mb-4">
              <label className="text-xs font-bold text-text-muted mb-2 block">⏱ Estimated time (minutes)</label>
              <div className="flex items-center gap-3 justify-center">
                <button onClick={() => setTimerMinutes(m => Math.max(5, m - 5))}
                  className="w-12 h-12 rounded-2xl bg-orange-100 text-primary font-bold text-xl hover:bg-orange-200 transition-colors">−</button>
                <span className="font-black text-secondary text-4xl w-16 text-center">{timerMinutes}</span>
                <button onClick={() => setTimerMinutes(m => m + 5)}
                  className="w-12 h-12 rounded-2xl bg-orange-100 text-primary font-bold text-xl hover:bg-orange-200 transition-colors">+</button>
              </div>
              <p className="text-text-muted text-xs text-center mt-1">minutes until ready/delivered</p>
            </div>
            {orders.find(o => o.id === showTimerModal)?.orderType === 'delivery' && (
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-green-50 rounded-xl mb-4 border border-green-200">
                <input type="checkbox" checked={waiveDelivery} onChange={e => setWaiveDelivery(e.target.checked)} className="w-4 h-4 accent-green-600" />
                <span className="text-sm font-semibold text-green-800">🎁 Waive delivery fee for this order</span>
              </label>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowTimerModal(null); setWaiveDelivery(false); }}
                className="flex-1 py-3 rounded-xl border border-orange-100 text-text-muted font-bold text-sm">Cancel</button>
              <button onClick={() => handleAcceptWithTimer(showTimerModal)}
                className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors">✅ Accept</button>
            </div>
          </Modal>
        )}

        {/* Reject modal */}
        {showRejectModal && (
          <Modal onClose={() => setShowRejectModal(null)}>
            <h3 className="font-display font-bold text-secondary text-lg mb-4 text-center">❌ Reject Order</h3>
            <label className="text-xs font-bold text-text-muted mb-1 block">Reason (optional)</label>
            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={3}
              placeholder="e.g. Item unavailable, kitchen closing..."
              className="w-full bg-bg-warm border border-orange-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowRejectModal(null)}
                className="flex-1 py-3 rounded-xl border border-orange-100 text-text-muted font-bold text-sm">Cancel</button>
              <button onClick={() => handleReject(showRejectModal)}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors">❌ Reject</button>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}

function OrderCard({ order, isPending, onAccept, onReject, onAction }) {
  const [timer, setTimer] = useState('');
  useEffect(() => {
    if (!order.estimatedTime) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, order.estimatedTime - Date.now());
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimer(diff > 0 ? `${m}:${s.toString().padStart(2,'0')}` : 'Overdue');
    }, 1000);
    return () => clearInterval(interval);
  }, [order.estimatedTime]);

  const actions = STATUS_ACTIONS[order.status] || [];
  const currency = order.currency || 'SBD';

  return (
    <div className={`rounded-2xl p-3.5 sm:p-4 border ${isPending ? 'bg-red-500/10 border-red-400/40' : 'bg-white/10 border-white/10'}`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2.5 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-white text-base sm:text-lg">{order.orderNumber}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
              {order.status?.replace('_',' ').toUpperCase()}
            </span>
            <span className="text-xs text-white/40 border border-white/10 px-2 py-0.5 rounded-full">
              {order.orderType === 'pickup' ? '🏃 Pickup' : '🛵 Delivery'}
            </span>
            {order.deliveryWaived && <span className="text-xs text-green-300 font-semibold">🎁 Fee Waived</span>}
          </div>
          <p className="text-white/60 text-xs mt-0.5">{order.customer?.name} · {order.customer?.phone}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-black text-accent text-base sm:text-lg">{currency} {order.total?.toFixed(0)}</p>
          {timer && <p className="text-xs text-yellow-300 font-semibold">{timer}</p>}
        </div>
      </div>

      {/* Items */}
      <div className="bg-black/20 rounded-xl p-2.5 mb-2.5 space-y-1">
        {order.items?.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-white/80 truncate mr-2">{item.name}</span>
            <span className="text-white/60 font-semibold flex-shrink-0">×{item.quantity}</span>
          </div>
        ))}
      </div>

      {order.customer?.address && (
        <p className="text-white/50 text-xs mb-1">🛵 {order.customer.address}{order.customer.unit ? `, ${order.customer.unit}` : ''}{order.deliveryArea ? ` — ${order.deliveryArea}` : ''}</p>
      )}
      {order.customer?.notes && <p className="text-yellow-200/70 text-xs mb-2.5">📝 {order.customer.notes}</p>}

      {/* Actions */}
      <div className="flex gap-2">
        {isPending ? (
          <>
            <button onClick={onAccept} className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1">
              <FiCheck size={14} /> Accept
            </button>
            <button onClick={onReject} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1">
              <FiX size={14} /> Reject
            </button>
          </>
        ) : actions.map(action => (
          <button key={action.next} onClick={() => onAction(action.next)}
            className={`flex-1 py-2.5 rounded-xl ${action.color} text-white font-bold text-sm transition-colors`}>
            {action.icon} <span className="hidden xs:inline sm:inline">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-5 z-50 max-w-sm mx-auto shadow-2xl">
        {children}
      </div>
    </>
  );
}
