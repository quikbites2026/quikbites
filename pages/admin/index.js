import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import {
  getSettings, updateSettings,
  getCategories, addCategory, updateCategory, deleteCategory,
  getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem,
  subscribeToAllOrders,
} from '../../lib/firebaseHelpers';
import toast from 'react-hot-toast';
import { FiLogOut, FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiMapPin, FiImage } from 'react-icons/fi';
import ImageUploader from '../../components/ImageUploader';

const TABS = [
  { id: 'orders',      label: 'Orders',     icon: '📋' },
  { id: 'menu',        label: 'Menu',       icon: '🍛' },
  { id: 'reports',     label: 'Reports',    icon: '📊' },
  { id: 'search',      label: 'Order Search', icon: '🔍' },
  { id: 'neworder',    label: 'New Order',  icon: '➕' },
  { id: 'delivery',    label: 'Delivery',   icon: '🛵' },
  { id: 'settings',    label: 'Settings',   icon: '⚙️' },
];

export default function AdminPanel() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('orders');
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) router.push('/login?role=admin');
      else setUser(u);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([getSettings(), getCategories(), getMenuItems()]).then(([s, c, m]) => {
      setSettings(s);
      setCategories(c);
      setMenuItems(m);
      setLoading(false);
    });

    const unsub = subscribeToAllOrders(setOrders);
    return () => unsub();
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-bg-warm flex items-center justify-center">
      <div className="spinner" />
    </div>
  );

  return (
    <>
      <Head>
        <title>Admin — QuikBites</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <div className="min-h-screen bg-bg-warm">
        {/* Header */}
        <div className="header-pattern px-3 sm:px-4 py-3 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="font-display font-bold text-white text-base sm:text-lg">⚙️ Admin Portal</h1>
              <p className="text-white/50 text-xs truncate">{user?.email}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <a href="/kitchen" className="text-white/60 hover:text-white text-xs px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors border border-white/20 whitespace-nowrap">
                👨‍🍳 Kitchen
              </a>
              <button onClick={() => signOut(auth)} className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                <FiLogOut size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs — horizontal scroll on mobile */}
        <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 sm:mb-5 scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                  tab === t.id ? 'bg-primary text-white shadow-warm' : 'bg-white text-text-muted hover:bg-orange-50'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{paddingBottom: 'max(32px, env(safe-area-inset-bottom))'}}>
            {tab === 'orders' && (
              <OrdersTab orders={orders} currency={settings?.currency || 'SBD'} />
            )}
            {tab === 'menu' && (
              <MenuTab
                categories={categories} setCategories={setCategories}
                menuItems={menuItems} setMenuItems={setMenuItems}
                currency={settings?.currency || 'SBD'}
              />
            )}
            {tab === 'reports' && (
              <ReportsTab orders={orders} currency={settings?.currency || 'SBD'} menuItems={menuItems} />
            )}
            {tab === 'search' && (
              <OrderSearchTab orders={orders} currency={settings?.currency || 'SBD'} />
            )}
            {tab === 'neworder' && (
              <PlaceOrderTab settings={settings} categories={categories} menuItems={menuItems} />
            )}
            {tab === 'delivery' && (
              <DeliveryTab settings={settings} setSettings={setSettings} />
            )}
            {tab === 'settings' && (
              <SettingsTab settings={settings} setSettings={setSettings} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── ORDERS TAB ────────────────────────────────────────────────────────────
function OrdersTab({ orders, currency }) {
  const [filter, setFilter] = useState('all');
  const statuses = ['all','pending','accepted','preparing','ready','out_for_delivery','delivered','rejected'];
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
              filter === s ? 'bg-secondary text-white' : 'bg-white text-text-muted hover:bg-orange-50'
            }`}>
            {s === 'all' ? `All (${orders.length})` : s.replace('_',' ')}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(order => (
          <div key={order.id} className="bg-white rounded-2xl p-4 shadow-card">
            <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-secondary">{order.orderNumber}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  { pending:'status-pending', accepted:'status-accepted', preparing:'status-preparing',
                    ready:'status-ready', out_for_delivery:'status-out_for_delivery',
                    delivered:'status-delivered', rejected:'status-rejected' }[order.status]
                }`}>
                  {order.status?.replace('_',' ').toUpperCase()}
                </span>
                <span className="text-xs text-text-muted">{order.orderType === 'pickup' ? '🏃 Pickup' : '🛵 Delivery'}</span>
              </div>
              <span className="font-black text-primary">{currency} {order.total?.toFixed(0)}</span>
            </div>
            <p className="text-sm text-text-main font-semibold">{order.customer?.name} · {order.customer?.phone}</p>
            {order.customer?.address && <p className="text-xs text-text-muted">{order.customer.address}</p>}
            <div className="mt-2 flex flex-wrap gap-1">
              {order.items?.map((item, i) => (
                <span key={i} className="text-xs bg-orange-50 text-secondary px-2 py-0.5 rounded-full">
                  {item.name} ×{item.quantity}
                </span>
              ))}
            </div>
            {order.customer?.notes && (
              <p className="text-xs text-amber-700 mt-1">📝 {order.customer.notes}</p>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-semibold">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MENU TAB ──────────────────────────────────────────────────────────────
function MenuTab({ categories, setCategories, menuItems, setMenuItems, currency }) {
  const [view, setView] = useState('items'); // 'items' | 'categories'
  const [editItem, setEditItem] = useState(null);
  const [editCat, setEditCat] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', emoji: '🍽️', order: categories.length + 1, active: true });

  // Item form
  const emptyItem = { name: '', description: '', price: '', discountPercent: 0, categoryId: categories[0]?.id || '', available: true, image: '' };
  const [newItem, setNewItem] = useState(emptyItem);

  async function saveItem(isEdit) {
    const data = isEdit ? editItem : newItem;
    if (!data.name || !data.price || !data.categoryId) {
      toast.error('Name, price and category are required'); return;
    }
    try {
      if (isEdit) {
        await updateMenuItem(data.id, { ...data, price: Number(data.price), discountPercent: Number(data.discountPercent) });
        setMenuItems(prev => prev.map(i => i.id === data.id ? { ...data, price: Number(data.price), discountPercent: Number(data.discountPercent) } : i));
        setEditItem(null);
      } else {
        const id = await addMenuItem({ ...data, price: Number(data.price), discountPercent: Number(data.discountPercent) });
        setMenuItems(prev => [...prev, { ...data, id, price: Number(data.price), discountPercent: Number(data.discountPercent) }]);
        setShowAddItem(false);
        setNewItem(emptyItem);
      }
      toast.success(isEdit ? 'Item updated!' : 'Item added!');
    } catch { toast.error('Failed to save item'); }
  }

  async function removeItem(id) {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteMenuItem(id);
      setMenuItems(prev => prev.filter(i => i.id !== id));
      toast.success('Item deleted');
    } catch { toast.error('Failed to delete'); }
  }

  async function saveCat(isEdit) {
    const data = isEdit ? editCat : newCat;
    if (!data.name) { toast.error('Category name required'); return; }
    try {
      if (isEdit) {
        await updateCategory(data.id, data);
        setCategories(prev => prev.map(c => c.id === data.id ? data : c));
        setEditCat(null);
      } else {
        const id = await addCategory(data);
        setCategories(prev => [...prev, { ...data, id }]);
        setShowAddCat(false);
        setNewCat({ name: '', emoji: '🍽️', order: categories.length + 2, active: true });
      }
      toast.success(isEdit ? 'Category updated!' : 'Category added!');
    } catch { toast.error('Failed to save category'); }
  }

  async function removeCat(id) {
    const hasItems = menuItems.some(i => i.categoryId === id);
    if (hasItems) { toast.error('Remove all items in this category first'); return; }
    if (!confirm('Delete category?')) return;
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch { toast.error('Failed to delete'); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2">
          <button onClick={() => setView('items')} className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${view === 'items' ? 'bg-primary text-white' : 'bg-white text-text-muted'}`}>
            🍛 Items ({menuItems.length})
          </button>
          <button onClick={() => setView('categories')} className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${view === 'categories' ? 'bg-primary text-white' : 'bg-white text-text-muted'}`}>
            📂 Categories ({categories.length})
          </button>
        </div>
        <button onClick={() => view === 'items' ? setShowAddItem(true) : setShowAddCat(true)}
          className="btn-primary px-4 py-1.5 rounded-xl text-sm flex items-center gap-1">
          <FiPlus size={14} /> Add {view === 'items' ? 'Item' : 'Category'}
        </button>
      </div>

      {/* Items list */}
      {view === 'items' && (
        <div className="space-y-2">
          {categories.filter(c => c.active).map(cat => {
            const catItems = menuItems.filter(i => i.categoryId === cat.id);
            if (!catItems.length) return null;
            return (
              <div key={cat.id} className="bg-white rounded-2xl overflow-hidden shadow-card">
                <div className="bg-orange-50 px-4 py-2 flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span className="font-display font-bold text-secondary text-sm">{cat.name}</span>
                  <span className="text-text-muted text-xs">({catItems.length})</span>
                </div>
                <div className="divide-y divide-orange-50">
                  {catItems.map(item => (
                    editItem?.id === item.id ? (
                      <ItemForm key={item.id} data={editItem} setData={setEditItem} categories={categories} currency={currency}
                        onSave={() => saveItem(true)} onCancel={() => setEditItem(null)} />
                    ) : (
                      <div key={item.id} className="px-3 sm:px-4 py-3 flex items-center gap-3">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-orange-50 flex items-center justify-center border border-orange-100">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <FiImage size={18} className="text-orange-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-secondary text-sm">{item.name}</span>
                            {item.discountPercent > 0 && (
                              <span className="badge-discount">{item.discountPercent}% OFF</span>
                            )}
                            {!item.available && <span className="text-xs text-red-500 font-semibold">Unavailable</span>}
                          </div>
                          <p className="text-text-muted text-xs truncate">{item.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-secondary text-sm">{currency} {item.price}</p>
                          {item.discountPercent > 0 && (
                            <p className="text-xs text-primary">{currency} {(item.price - item.price * item.discountPercent / 100).toFixed(0)}</p>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => setEditItem({ ...item })} className="p-1.5 text-text-muted hover:text-primary rounded-lg hover:bg-orange-50"><FiEdit2 size={14} /></button>
                          <button onClick={() => removeItem(item.id)} className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-red-50"><FiTrash2 size={14} /></button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            );
          })}

          {/* Add new item inline */}
          {showAddItem && (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="bg-green-50 px-4 py-2">
                <span className="font-display font-bold text-green-800 text-sm">➕ Add New Item</span>
              </div>
              <ItemForm data={newItem} setData={setNewItem} categories={categories} currency={currency}
                onSave={() => saveItem(false)} onCancel={() => { setShowAddItem(false); setNewItem(emptyItem); }} />
            </div>
          )}
        </div>
      )}

      {/* Categories list */}
      {view === 'categories' && (
        <div className="space-y-2">
          {categories.map(cat => (
            editCat?.id === cat.id ? (
              <div key={cat.id} className="bg-white rounded-2xl p-4 shadow-card">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input value={editCat.emoji} onChange={e => setEditCat(p => ({...p, emoji: e.target.value}))}
                    className="bg-bg-warm border border-orange-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="Emoji" />
                  <input value={editCat.name} onChange={e => setEditCat(p => ({...p, name: e.target.value}))}
                    className="bg-bg-warm border border-orange-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="Category name" />
                </div>
                <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
                  <input type="checkbox" checked={editCat.active} onChange={e => setEditCat(p => ({...p, active: e.target.checked}))} className="accent-primary" />
                  Active
                </label>
                <div className="flex gap-2">
                  <button onClick={() => saveCat(true)} className="btn-primary px-4 py-1.5 rounded-xl text-sm flex items-center gap-1"><FiSave size={12}/> Save</button>
                  <button onClick={() => setEditCat(null)} className="px-4 py-1.5 rounded-xl border border-orange-100 text-text-muted text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div key={cat.id} className="bg-white rounded-2xl p-3 shadow-card flex items-center gap-3">
                <span className="text-2xl">{cat.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-secondary text-sm">{cat.name}</p>
                  <p className="text-xs text-text-muted">{menuItems.filter(i => i.categoryId === cat.id).length} items · {cat.active ? '✅ Active' : '❌ Hidden'}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditCat({...cat})} className="p-1.5 text-text-muted hover:text-primary rounded-lg hover:bg-orange-50"><FiEdit2 size={14}/></button>
                  <button onClick={() => removeCat(cat.id)} className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-red-50"><FiTrash2 size={14}/></button>
                </div>
              </div>
            )
          ))}

          {showAddCat && (
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <p className="font-display font-bold text-secondary text-sm mb-3">➕ New Category</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <input value={newCat.emoji} onChange={e => setNewCat(p => ({...p, emoji: e.target.value}))}
                  className="bg-bg-warm border border-orange-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Emoji" />
                <input value={newCat.name} onChange={e => setNewCat(p => ({...p, name: e.target.value}))}
                  className="bg-bg-warm border border-orange-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Category name" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveCat(false)} className="btn-primary px-4 py-1.5 rounded-xl text-sm flex items-center gap-1"><FiSave size={12}/> Add</button>
                <button onClick={() => setShowAddCat(false)} className="px-4 py-1.5 rounded-xl border border-orange-100 text-text-muted text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemForm({ data, setData, categories, currency, onSave, onCancel }) {
  const inp = "w-full bg-bg-warm border border-orange-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary";
  return (
    <div className="p-4 space-y-3">
      {/* Name + Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-text-muted mb-1 block">Item Name *</label>
          <input value={data.name} onChange={e => setData(p => ({...p, name: e.target.value}))}
            placeholder="e.g. Chicken Curry" className={inp} />
        </div>
        <div>
          <label className="text-xs font-bold text-text-muted mb-1 block">Category *</label>
          <select value={data.categoryId} onChange={e => setData(p => ({...p, categoryId: e.target.value}))} className={inp}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold text-text-muted mb-1 block">Description</label>
        <textarea value={data.description} onChange={e => setData(p => ({...p, description: e.target.value}))}
          placeholder="Describe the dish..." rows={2} className={`${inp} resize-none`} />
      </div>

      {/* Price + Discount + Available */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-bold text-text-muted mb-1 block">Price ({currency}) *</label>
          <input type="number" value={data.price} onChange={e => setData(p => ({...p, price: e.target.value}))}
            placeholder="0" className={inp} />
        </div>
        <div>
          <label className="text-xs font-bold text-text-muted mb-1 block">Discount %</label>
          <input type="number" min="0" max="100" value={data.discountPercent}
            onChange={e => setData(p => ({...p, discountPercent: e.target.value}))}
            placeholder="0" className={inp} />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-text-main">
            <input type="checkbox" checked={data.available}
              onChange={e => setData(p => ({...p, available: e.target.checked}))} className="accent-primary w-4 h-4" />
            Available
          </label>
        </div>
      </div>

      {/* Photo uploader */}
      <ImageUploader
        itemId={data.id || null}
        currentImage={data.image || ''}
        onImageSaved={(url) => setData(p => ({...p, image: url}))}
      />

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} className="btn-primary px-5 py-2 rounded-xl text-sm flex items-center gap-1.5">
          <FiSave size={13}/> Save Item
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-orange-100 text-text-muted text-sm flex items-center gap-1.5 hover:bg-orange-50">
          <FiX size={13}/> Cancel
        </button>
      </div>
    </div>
  );
}

// ─── DELIVERY TAB ──────────────────────────────────────────────────────────
function DeliveryTab({ settings, setSettings }) {
  const [areas, setAreas] = useState(settings?.deliveryAreas || []);
  const [freeThreshold, setFreeThreshold] = useState(settings?.freeDeliveryThreshold || 100);
  const [newArea, setNewArea] = useState({ name: '', fee: '' });
  const [saving, setSaving] = useState(false);
  const currency = settings?.currency || 'SBD';

  async function save() {
    setSaving(true);
    try {
      await updateSettings({ deliveryAreas: areas, freeDeliveryThreshold: Number(freeThreshold) });
      setSettings(p => ({ ...p, deliveryAreas: areas, freeDeliveryThreshold: Number(freeThreshold) }));
      toast.success('Delivery settings saved!');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  }

  function addArea() {
    if (!newArea.name || !newArea.fee) { toast.error('Name and fee required'); return; }
    const id = newArea.name.toLowerCase().replace(/\s+/g, '-');
    setAreas(prev => [...prev, { id, name: newArea.name, fee: Number(newArea.fee) }]);
    setNewArea({ name: '', fee: '' });
  }

  function removeArea(id) { setAreas(prev => prev.filter(a => a.id !== id)); }
  function updateArea(id, field, value) {
    setAreas(prev => prev.map(a => a.id === id ? { ...a, [field]: field === 'fee' ? Number(value) : value } : a));
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-4 shadow-card">
        <h3 className="font-display font-bold text-secondary mb-3 flex items-center gap-2">
          <FiMapPin size={16} className="text-primary" /> Delivery Areas & Fees
        </h3>
        <div className="space-y-2 mb-4">
          {areas.map(area => (
            <div key={area.id} className="flex items-center gap-2">
              <input value={area.name} onChange={e => updateArea(area.id, 'name', e.target.value)}
                className="flex-1 bg-bg-warm border border-orange-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <div className="flex items-center gap-1">
                <span className="text-xs text-text-muted">{currency}</span>
                <input type="number" value={area.fee} onChange={e => updateArea(area.id, 'fee', e.target.value)}
                  className="w-20 bg-bg-warm border border-orange-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <button onClick={() => removeArea(area.id)} className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-red-50">
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add area */}
        <div className="flex gap-2 mb-2">
          <input value={newArea.name} onChange={e => setNewArea(p => ({...p, name: e.target.value}))}
            placeholder="Area name (e.g. White River)" className="flex-1 bg-bg-warm border border-orange-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-text-muted">{currency}</span>
            <input type="number" value={newArea.fee} onChange={e => setNewArea(p => ({...p, fee: e.target.value}))}
              placeholder="Fee" className="w-20 bg-bg-warm border border-orange-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <button onClick={addArea} className="btn-primary px-3 py-2 rounded-xl text-sm flex items-center gap-1">
            <FiPlus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-card">
        <h3 className="font-display font-bold text-secondary mb-3">🎉 Free Delivery Threshold</h3>
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-sm">Free delivery when order exceeds</span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-text-muted">{currency}</span>
            <input type="number" value={freeThreshold} onChange={e => setFreeThreshold(e.target.value)}
              className="w-24 bg-bg-warm border border-orange-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2">
        {saving ? <div className="spinner w-4 h-4" /> : <FiSave size={16} />}
        Save Delivery Settings
      </button>
    </div>
  );
}

// ─── SETTINGS TAB ──────────────────────────────────────────────────────────
function SettingsTab({ settings, setSettings }) {
  const [form, setForm] = useState({
    storeName: settings?.storeName || 'QuikBites',
    contactPhone: settings?.contactPhone || '',
    currency: settings?.currency || 'SBD',
    isOpen: settings?.openingHours?.isOpen !== false,
    openTime: settings?.openingHours?.open || '08:00',
    closeTime: settings?.openingHours?.close || '21:00',
    onlineDiscountEnabled: settings?.onlinePaymentDiscount?.enabled || false,
    onlineDiscountType: settings?.onlinePaymentDiscount?.type || 'percentage',
    onlineDiscountValue: settings?.onlinePaymentDiscount?.value || 0,
    mselenEnabled: settings?.mselenConfig?.enabled || false,
    mselenMerchantId: settings?.mselenConfig?.merchantId || '',
    mselenApiKey: settings?.mselenConfig?.apiKey || '',
    mselenApiUrl: settings?.mselenConfig?.apiUrl || '',
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updates = {
        storeName: form.storeName,
        contactPhone: form.contactPhone,
        currency: form.currency,
        openingHours: {
          isOpen: form.isOpen,
          open: form.openTime,
          close: form.closeTime,
        },
        onlinePaymentDiscount: {
          enabled: form.onlineDiscountEnabled,
          type: form.onlineDiscountType,
          value: Number(form.onlineDiscountValue),
        },
        mselenConfig: {
          enabled: form.mselenEnabled,
          merchantId: form.mselenMerchantId,
          apiKey: form.mselenApiKey,
          apiUrl: form.mselenApiUrl,
        },
      };
      await updateSettings(updates);
      setSettings(p => ({ ...p, ...updates }));
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  }

  const inp = "w-full bg-bg-warm border border-orange-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary";

  return (
    <div className="space-y-5">
      {/* Store info */}
      <div className="bg-white rounded-2xl p-4 shadow-card space-y-3">
        <h3 className="font-display font-bold text-secondary">🏪 Store Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-text-muted mb-1 block">Store Name</label>
            <input value={form.storeName} onChange={e => setForm(p=>({...p,storeName:e.target.value}))} className={inp} />
          </div>
          <div>
            <label className="text-xs font-bold text-text-muted mb-1 block">Contact / WhatsApp</label>
            <input value={form.contactPhone} onChange={e => setForm(p=>({...p,contactPhone:e.target.value}))} className={inp} />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-text-muted mb-1 block">Currency</label>
          <input value={form.currency} onChange={e => setForm(p=>({...p,currency:e.target.value}))} className={inp} placeholder="SBD" />
        </div>
      </div>

      {/* Opening hours */}
      <div className="bg-white rounded-2xl p-4 shadow-card space-y-3">
        <h3 className="font-display font-bold text-secondary">⏰ Opening Hours</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isOpen} onChange={e => setForm(p=>({...p,isOpen:e.target.checked}))} className="w-4 h-4 accent-primary" />
          <span className={`font-bold text-sm ${form.isOpen ? 'text-green-600' : 'text-red-500'}`}>
            {form.isOpen ? '🟢 Kitchen is Open' : '🔴 Kitchen is Closed'}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-text-muted mb-1 block">Open Time</label>
            <input type="time" value={form.openTime} onChange={e => setForm(p=>({...p,openTime:e.target.value}))} className={inp} />
          </div>
          <div>
            <label className="text-xs font-bold text-text-muted mb-1 block">Close Time</label>
            <input type="time" value={form.closeTime} onChange={e => setForm(p=>({...p,closeTime:e.target.value}))} className={inp} />
          </div>
        </div>
      </div>

      {/* Online payment discount */}
      <div className="bg-white rounded-2xl p-4 shadow-card space-y-3">
        <h3 className="font-display font-bold text-secondary">💳 Online Payment Discount</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.onlineDiscountEnabled} onChange={e => setForm(p=>({...p,onlineDiscountEnabled:e.target.checked}))} className="w-4 h-4 accent-primary" />
          <span className="text-sm font-semibold text-text-main">Enable discount for M-SELEN payments</span>
        </label>
        {form.onlineDiscountEnabled && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-text-muted mb-1 block">Discount Type</label>
              <select value={form.onlineDiscountType} onChange={e => setForm(p=>({...p,onlineDiscountType:e.target.value}))} className={inp}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ({form.currency || 'SBD'})</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted mb-1 block">
                Value ({form.onlineDiscountType === 'percentage' ? '%' : form.currency || 'SBD'})
              </label>
              <input type="number" min="0" value={form.onlineDiscountValue} onChange={e => setForm(p=>({...p,onlineDiscountValue:e.target.value}))} className={inp} />
            </div>
          </div>
        )}
      </div>

      {/* M-SELEN config */}
      <div className="bg-white rounded-2xl p-4 shadow-card space-y-3">
        <h3 className="font-display font-bold text-secondary">📱 M-SELEN Configuration</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.mselenEnabled} onChange={e => setForm(p=>({...p,mselenEnabled:e.target.checked}))} className="w-4 h-4 accent-primary" />
          <span className="text-sm font-semibold text-text-main">Enable M-SELEN payments</span>
        </label>
        {form.mselenEnabled && (
          <div className="space-y-2">
            <div>
              <label className="text-xs font-bold text-text-muted mb-1 block">Merchant ID</label>
              <input value={form.mselenMerchantId} onChange={e => setForm(p=>({...p,mselenMerchantId:e.target.value}))} className={inp} placeholder="Your M-SELEN merchant ID" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted mb-1 block">API Key</label>
              <input type="password" value={form.mselenApiKey} onChange={e => setForm(p=>({...p,mselenApiKey:e.target.value}))} className={inp} placeholder="API key (keep secret)" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted mb-1 block">API URL</label>
              <input value={form.mselenApiUrl} onChange={e => setForm(p=>({...p,mselenApiUrl:e.target.value}))} className={inp} placeholder="https://api.mselen.com" />
            </div>
          </div>
        )}
      </div>

      <button onClick={save} disabled={saving} className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2">
        {saving ? <div className="spinner w-4 h-4" /> : <FiSave size={16} />}
        Save All Settings
      </button>
    </div>
  );
}

// ─── REPORTS TAB ───────────────────────────────────────────────────────────
function ReportsTab({ orders, currency, menuItems }) {
  const [period, setPeriod] = useState('today');

  function getFilteredOrders() {
    const now = new Date();
    return orders.filter(o => {
      if (!o.createdAt) return false;
      const date = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      if (period === 'today') return date.toDateString() === now.toDateString();
      if (period === 'week') return date >= new Date(now - 7 * 24 * 60 * 60 * 1000);
      if (period === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      return true;
    });
  }

  const filtered = getFilteredOrders();
  const delivered = filtered.filter(o => o.status === 'delivered');
  const rejected = filtered.filter(o => o.status === 'rejected');
  const totalRevenue = delivered.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = filtered.length;
  const deliveredCount = delivered.length;
  const rejectedCount = rejected.length;
  const avgOrder = deliveredCount > 0 ? totalRevenue / deliveredCount : 0;

  const codOrders = delivered.filter(o => o.paymentMethod === 'cod').length;
  const mselenOrders = delivered.filter(o => o.paymentMethod === 'mselen').length;
  const deliveryOrders = filtered.filter(o => o.orderType === 'delivery').length;
  const pickupOrders = filtered.filter(o => o.orderType === 'pickup').length;

  // Top selling items
  const itemCounts = {};
  delivered.forEach(o => {
    o.items?.forEach(item => {
      if (!itemCounts[item.name]) itemCounts[item.name] = { qty: 0, revenue: 0 };
      itemCounts[item.name].qty += item.quantity;
      itemCounts[item.name].revenue += (item.discountedPrice || item.price) * item.quantity;
    });
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  // Recent orders
  const recentOrders = [...filtered].sort((a, b) => {
    const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return db - da;
  }).slice(0, 5);

  const STATUS_COLORS = {
    pending: 'status-pending', accepted: 'status-accepted', preparing: 'status-preparing',
    ready: 'status-ready', out_for_delivery: 'status-out_for_delivery',
    delivered: 'status-delivered', rejected: 'status-rejected',
  };

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex gap-2">
        {[
          { id: 'today', label: 'Today' },
          { id: 'week',  label: 'This Week' },
          { id: 'month', label: 'This Month' },
          { id: 'all',   label: 'All Time' },
        ].map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              period === p.id ? 'bg-primary text-white' : 'bg-white text-text-muted hover:bg-orange-50'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: `${currency} ${totalRevenue.toFixed(0)}`, color: 'text-primary', bg: 'bg-orange-50' },
          { label: 'Total Orders', value: totalOrders, color: 'text-secondary', bg: 'bg-amber-50' },
          { label: 'Delivered', value: deliveredCount, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Rejected/Cancelled', value: rejectedCount, color: 'text-red-700', bg: 'bg-red-50' },
        ].map((card, i) => (
          <div key={i} className={`${card.bg} rounded-2xl p-3 sm:p-4`}>
            <p className="text-text-muted text-xs font-semibold mb-1">{card.label}</p>
            <p className={`font-black text-lg sm:text-xl ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Avg order value */}
      <div className="bg-blue-50 rounded-2xl p-3 sm:p-4">
        <p className="text-text-muted text-xs font-semibold mb-1">Average Order Value</p>
        <p className="font-black text-lg sm:text-xl text-blue-700">{currency} {avgOrder.toFixed(0)}</p>
      </div>

      {/* Order type + Payment breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <h3 className="font-display font-bold text-secondary mb-3 text-sm">🛵 Order Type</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">Delivery</span>
              <span className="font-bold text-secondary text-sm">{deliveryOrders} orders</span>
            </div>
            <div className="w-full bg-orange-100 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all"
                style={{width: totalOrders > 0 ? `${(deliveryOrders/totalOrders)*100}%` : '0%'}} />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-text-muted">Pickup</span>
              <span className="font-bold text-secondary text-sm">{pickupOrders} orders</span>
            </div>
            <div className="w-full bg-orange-100 rounded-full h-2">
              <div className="bg-accent h-2 rounded-full transition-all"
                style={{width: totalOrders > 0 ? `${(pickupOrders/totalOrders)*100}%` : '0%'}} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-card">
          <h3 className="font-display font-bold text-secondary mb-3 text-sm">💳 Payment Method</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">💵 Cash on Delivery</span>
              <span className="font-bold text-secondary text-sm">{codOrders} orders</span>
            </div>
            <div className="w-full bg-orange-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all"
                style={{width: deliveredCount > 0 ? `${(codOrders/deliveredCount)*100}%` : '0%'}} />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-text-muted">📱 M-SELEN</span>
              <span className="font-bold text-secondary text-sm">{mselenOrders} orders</span>
            </div>
            <div className="w-full bg-orange-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all"
                style={{width: deliveredCount > 0 ? `${(mselenOrders/deliveredCount)*100}%` : '0%'}} />
            </div>
          </div>
        </div>
      </div>

      {/* Top selling items */}
      <div className="bg-white rounded-2xl p-4 shadow-card">
        <h3 className="font-display font-bold text-secondary mb-3 text-sm">🏆 Top Selling Items</h3>
        {topItems.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-4">No data for this period</p>
        ) : (
          <div className="space-y-2.5">
            {topItems.map(([name, data], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-primary text-xs font-black flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-secondary truncate">{name}</span>
                    <span className="text-xs text-text-muted flex-shrink-0 ml-2">{data.qty} sold</span>
                  </div>
                  <div className="w-full bg-orange-100 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full"
                      style={{width: `${(data.qty / (topItems[0]?.[1]?.qty || 1)) * 100}%`}} />
                  </div>
                </div>
                <span className="text-xs font-bold text-primary flex-shrink-0">{currency} {data.revenue.toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl p-4 shadow-card">
        <h3 className="font-display font-bold text-secondary mb-3 text-sm">🕐 Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-4">No orders for this period</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map(order => {
              const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || 0);
              return (
                <div key={order.id} className="flex items-center justify-between gap-2 py-2 border-b border-orange-50 last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-secondary text-sm">{order.orderNumber}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                        {order.status?.replace('_',' ')}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {order.customer?.name} · {date.toLocaleDateString()} {date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                    </p>
                  </div>
                  <span className="font-black text-primary text-sm flex-shrink-0">{currency} {order.total?.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rejected / Cancelled orders */}
      <div className="bg-white rounded-2xl p-4 shadow-card">
        <h3 className="font-display font-bold text-secondary mb-3 text-sm">❌ Rejected & Cancelled Orders</h3>
        {rejected.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-4">No rejected orders for this period</p>
        ) : (
          <div className="space-y-2">
            {rejected.map(order => {
              const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || 0);
              return (
                <div key={order.id} className="bg-red-50 rounded-xl p-3 border border-red-100">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-secondary text-sm">{order.orderNumber}</span>
                        {order.cancelledAfterAccept && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Cancelled</span>
                        )}
                        {!order.cancelledAfterAccept && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Rejected</span>
                        )}
                        <span className="text-xs text-text-muted">{order.orderType === 'pickup' ? '🏃 Pickup' : '🛵 Delivery'}</span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {order.customer?.name} · {order.customer?.phone} · {date.toLocaleDateString()} {date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                      </p>
                      {order.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1 font-semibold">Reason: {order.rejectionReason}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-secondary flex-shrink-0">{currency} {order.total?.toFixed(0)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {order.items?.map((item, i) => (
                      <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {item.name} ×{item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ORDER SEARCH TAB ──────────────────────────────────────────────────────
function OrderSearchTab({ orders, currency }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  function handleSearch() {
    if (!query.trim()) return;
    setSearched(true);
    const q = query.trim().toUpperCase();
    const found = orders.find(o =>
      o.orderNumber?.toUpperCase() === q ||
      o.id?.toLowerCase() === query.trim().toLowerCase()
    );
    setResult(found || null);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-card">
        <h3 className="font-display font-bold text-secondary mb-1 text-sm">🔍 Search Order by ID</h3>
        <p className="text-text-muted text-xs mb-3">Enter the order number (e.g. QB-123456) to find full order details for customer support.</p>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setSearched(false); }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. QB-123456"
            className="flex-1 bg-bg-warm border border-orange-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          <button onClick={handleSearch} className="btn-primary px-5 py-2.5 rounded-xl text-sm">
            Search
          </button>
        </div>
      </div>

      {/* No result */}
      {searched && !result && (
        <div className="bg-white rounded-2xl p-6 shadow-card text-center">
          <p className="text-3xl mb-2">😕</p>
          <p className="font-semibold text-secondary">No order found</p>
          <p className="text-text-muted text-xs mt-1">Check the order number and try again</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-2xl p-4 shadow-card space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-orange-100 flex-wrap">
            <div>
              <h3 className="font-display font-bold text-secondary text-lg">{result.orderNumber}</h3>
              <p className="text-text-muted text-xs">Order ID: {result.id}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[result.status]}`}>
              {result.status?.replace('_',' ').toUpperCase()}
            </span>
          </div>

          {/* Customer details */}
          <div>
            <p className="text-xs font-bold text-text-muted mb-2">👤 CUSTOMER DETAILS</p>
            <div className="bg-orange-50 rounded-xl p-3 space-y-1 text-sm">
              <p><span className="text-text-muted">Name:</span> <span className="font-semibold">{result.customer?.name}</span></p>
              <p><span className="text-text-muted">Phone:</span> <span className="font-semibold">{result.customer?.phone}</span></p>
              {result.customer?.email && <p><span className="text-text-muted">Email:</span> <span className="font-semibold">{result.customer.email}</span></p>}
              {result.customer?.address && <p><span className="text-text-muted">Address:</span> <span className="font-semibold">{result.customer.address}{result.customer.unit ? `, ${result.customer.unit}` : ''}</span></p>}
              {result.deliveryArea && <p><span className="text-text-muted">Area:</span> <span className="font-semibold">{result.deliveryArea}</span></p>}
              {result.customer?.notes && <p><span className="text-text-muted">Notes:</span> <span className="font-semibold">{result.customer.notes}</span></p>}
            </div>
          </div>

          {/* Order items */}
          <div>
            <p className="text-xs font-bold text-text-muted mb-2">🍛 ORDER ITEMS</p>
            <div className="space-y-1.5">
              {result.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-text-main">{item.name} <span className="text-text-muted">×{item.quantity}</span></span>
                  <span className="font-semibold">{currency} {(item.discountedPrice * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & totals */}
          <div>
            <p className="text-xs font-bold text-text-muted mb-2">💳 PAYMENT & TOTALS</p>
            <div className="bg-orange-50 rounded-xl p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Subtotal</span><span>{currency} {result.subtotal?.toFixed(0)}</span></div>
              <div className="flex justify-between">
                <span className="text-text-muted">Delivery</span>
                <span>{result.orderType === 'pickup' ? 'Pickup' : result.deliveryWaived ? '🎁 Waived' : result.deliveryFee === 0 ? 'FREE' : `${currency} ${result.deliveryFee}`}</span>
              </div>
              {result.onlineDiscount > 0 && (
                <div className="flex justify-between text-green-600"><span>Online Discount</span><span>− {currency} {result.onlineDiscount?.toFixed(0)}</span></div>
              )}
              <div className="flex justify-between font-black text-base pt-1 border-t border-orange-100">
                <span>Total</span>
                <span className="text-primary">{currency} {(
                  (result.subtotal || 0) +
                  (result.deliveryWaived ? 0 : (result.deliveryFee || 0)) -
                  (result.onlineDiscount || 0)
                ).toFixed(0)}</span>
              </div>
              <div className="pt-1 border-t border-orange-100">
                <p><span className="text-text-muted">Payment:</span> <span className="font-semibold">{result.paymentMethod === 'cod' ? 'Cash on Delivery' : 'M-SELEN'}</span></p>
                <p><span className="text-text-muted">Type:</span> <span className="font-semibold">{result.orderType === 'pickup' ? '🏃 Pickup' : '🛵 Delivery'}</span></p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <p className="text-xs font-bold text-text-muted mb-2">⏱ TIMESTAMPS</p>
            <div className="bg-orange-50 rounded-xl p-3 space-y-1 text-sm">
              {result.createdAt && (
                <p><span className="text-text-muted">Ordered:</span> <span className="font-semibold">
                  {(result.createdAt.toDate ? result.createdAt.toDate() : new Date(result.createdAt)).toLocaleString()}
                </span></p>
              )}
              {result.updatedAt && (
                <p><span className="text-text-muted">Last Updated:</span> <span className="font-semibold">
                  {(result.updatedAt.toDate ? result.updatedAt.toDate() : new Date(result.updatedAt)).toLocaleString()}
                </span></p>
              )}
              {result.estimatedTime && (
                <p><span className="text-text-muted">Est. Delivery:</span> <span className="font-semibold">
                  {new Date(result.estimatedTime).toLocaleTimeString()}
                </span></p>
              )}
            </div>
          </div>

          {/* Rejection reason if rejected */}
          {result.status === 'rejected' && result.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-bold text-red-700 mb-1">
                {result.cancelledAfterAccept ? '⚠️ CANCELLATION REASON' : '❌ REJECTION REASON'}
              </p>
              <p className="text-sm text-red-800">{result.rejectionReason}</p>
            </div>
          )}

          {/* Contact customer */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-orange-100">
            <a href={`https://wa.me/677${result.customer?.phone}?text=${encodeURIComponent(`Hi ${result.customer?.name}, regarding your QuikBites order ${result.orderNumber}`)}`}
              target="_blank" rel="noreferrer"
              className="flex flex-col items-center gap-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-800 font-bold text-xs py-2.5 rounded-xl">
              <span style={{fontSize:'18px'}}>💬</span> WhatsApp
            </a>
            <a href={`sms:${result.customer?.phone}`}
              className="flex flex-col items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xs py-2.5 rounded-xl">
              <span style={{fontSize:'18px'}}>📱</span> SMS
            </a>
            <a href={`tel:${result.customer?.phone}`}
              className="flex flex-col items-center gap-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-primary font-bold text-xs py-2.5 rounded-xl">
              <span style={{fontSize:'18px'}}>📞</span> Call
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PLACE ORDER TAB (on behalf of customer) ───────────────────────────────
function PlaceOrderTab({ settings, categories, menuItems }) {
  const [cart, setCart] = useState({});
  const [orderType, setOrderType] = useState('delivery');
  const [selectedArea, setSelectedArea] = useState(settings?.deliveryAreas?.[0]?.id || '');
  const [form, setForm] = useState({ name: '', phone: '', address: '', email: '', notes: '', unit: '' });
  const [placing, setPlacing] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const currency = settings?.currency || 'SBD';
  const freeThreshold = settings?.freeDeliveryThreshold || 100;
  const area = settings?.deliveryAreas?.find(a => a.id === selectedArea);
  const subtotal = Object.entries(cart).reduce((s, [id, qty]) => {
    const item = menuItems.find(m => m.id === id);
    if (!item) return s;
    const price = item.discountPercent > 0 ? item.price - item.price * item.discountPercent / 100 : item.price;
    return s + price * qty;
  }, 0);
  const deliveryFee = orderType === 'pickup' ? 0 : (subtotal >= freeThreshold ? 0 : (area?.fee || settings?.defaultDeliveryFee || 10));
  const total = subtotal + deliveryFee;
  const itemCount = Object.values(cart).reduce((s, q) => s + q, 0);

  function changeQty(id, delta) {
    setCart(prev => {
      const newQty = Math.max(0, (prev[id] || 0) + delta);
      if (newQty === 0) { const n = {...prev}; delete n[id]; return n; }
      return { ...prev, [id]: newQty };
    });
  }

  async function handlePlace() {
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return; }
    if (Object.keys(cart).length === 0) { toast.error('Please add items to the order'); return; }
    setPlacing(true);
    try {
      const { createOrder: placeOrder } = await import('../lib/firebaseHelpers');
      const items = Object.entries(cart).map(([id, qty]) => {
        const item = menuItems.find(m => m.id === id);
        const discountedPrice = item.discountPercent > 0 ? item.price - item.price * item.discountPercent / 100 : item.price;
        return { id, name: item.name, price: item.price, discountPercent: item.discountPercent || 0, discountedPrice, quantity: qty };
      });
      const orderData = {
        items, customer: { ...form },
        orderType, paymentMethod: 'cod',
        deliveryArea: orderType === 'delivery' ? (area?.name || '') : '',
        subtotal, deliveryFee, onlineDiscount: 0, total, currency,
        placedByAdmin: true,
      };
      const { id, orderNumber } = await placeOrder(orderData);
      setSuccessOrder({ id, orderNumber, phone: form.phone, name: form.name });
      setCart({}); setForm({ name: '', phone: '', address: '', email: '', notes: '', unit: '' });
      toast.success(`Order ${orderNumber} placed!`);
    } catch (err) {
      console.error(err); toast.error('Failed to place order');
    } finally { setPlacing(false); }
  }

  const inp = "w-full bg-bg-warm border border-orange-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary";
  const activeCats = categories.filter(c => c.active);

  return (
    <div className="space-y-4">
      {/* Success */}
      {successOrder && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
          <p className="font-bold text-green-800 text-base mb-1">✅ Order {successOrder.orderNumber} placed!</p>
          <p className="text-green-700 text-sm mb-3">Share the tracking link with {successOrder.name}:</p>
          <div className="flex gap-2 flex-wrap">
            <a href={`https://wa.me/677${successOrder.phone}?text=${encodeURIComponent(`Hi ${successOrder.name}, your QuikBites order ${successOrder.orderNumber} has been placed! Track it here: ${typeof window !== 'undefined' ? window.location.origin : ''}/track/${successOrder.id}`)}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 bg-green-600 text-white font-bold text-xs px-3 py-2 rounded-xl">
              💬 Send via WhatsApp
            </a>
            <a href={`sms:${successOrder.phone}?body=${encodeURIComponent(`Your QuikBites order ${successOrder.orderNumber} is placed! Track: ${typeof window !== 'undefined' ? window.location.origin : ''}/track/${successOrder.id}`)}`}
              className="flex items-center gap-1.5 bg-blue-600 text-white font-bold text-xs px-3 py-2 rounded-xl">
              📱 Send via SMS
            </a>
            <button onClick={() => { navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/track/${successOrder.id}`); toast.success('Link copied!'); }}
              className="flex items-center gap-1.5 bg-secondary text-white font-bold text-xs px-3 py-2 rounded-xl">
              🔗 Copy Link
            </button>
          </div>
          <button onClick={() => setSuccessOrder(null)} className="mt-3 text-xs text-green-700 hover:underline">
            Place another order
          </button>
        </div>
      )}

      {/* Customer details */}
      <div className="bg-white rounded-2xl p-4 shadow-card space-y-3">
        <h3 className="font-display font-bold text-secondary text-sm">👤 Customer Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div><label className="text-xs font-bold text-text-muted mb-1 block">Name *</label><input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Customer name" className={inp} /></div>
          <div><label className="text-xs font-bold text-text-muted mb-1 block">Phone *</label><input value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} placeholder="Phone number" className={inp} /></div>
        </div>

        {/* Order type */}
        <div className="grid grid-cols-2 gap-2">
          {['delivery','pickup'].map(t => (
            <button key={t} type="button" onClick={() => setOrderType(t)}
              className={`p-2.5 rounded-xl border-2 text-sm font-bold transition-all capitalize ${orderType === t ? 'border-primary bg-orange-50 text-secondary' : 'border-orange-100 text-text-muted'}`}>
              {t === 'delivery' ? '🛵 Delivery' : '🏃 Pickup'}
            </button>
          ))}
        </div>

        {orderType === 'delivery' && (
          <>
            <div><label className="text-xs font-bold text-text-muted mb-1 block">Delivery Area</label>
              <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} className={inp}>
                {settings?.deliveryAreas?.map(a => <option key={a.id} value={a.id}>{a.name} — {currency} {a.fee}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-bold text-text-muted mb-1 block">Address</label><input value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} placeholder="Delivery address" className={inp} /></div>
          </>
        )}
        <div><label className="text-xs font-bold text-text-muted mb-1 block">Notes (optional)</label><textarea value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} rows={2} placeholder="Special instructions..." className={`${inp} resize-none`} /></div>
      </div>

      {/* Menu items */}
      <div className="bg-white rounded-2xl p-4 shadow-card">
        <h3 className="font-display font-bold text-secondary text-sm mb-3">🍛 Select Items</h3>
        {activeCats.map(cat => {
          const catItems = menuItems.filter(i => i.categoryId === cat.id && i.available);
          if (!catItems.length) return null;
          return (
            <div key={cat.id} className="mb-4">
              <p className="text-xs font-bold text-text-muted mb-2">{cat.emoji} {cat.name}</p>
              <div className="space-y-2">
                {catItems.map(item => {
                  const qty = cart[item.id] || 0;
                  const price = item.discountPercent > 0 ? item.price - item.price * item.discountPercent / 100 : item.price;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-orange-50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-secondary truncate">{item.name}</p>
                        <p className="text-xs text-primary font-bold">{currency} {price.toFixed(0)}</p>
                      </div>
                      {qty === 0 ? (
                        <button onClick={() => changeQty(item.id, 1)} className="btn-primary px-3 py-1.5 rounded-xl text-xs flex-shrink-0">+ Add</button>
                      ) : (
                        <div className="flex items-center gap-1 bg-primary/10 rounded-xl overflow-hidden flex-shrink-0">
                          <button onClick={() => changeQty(item.id, -1)} className="p-1.5 hover:bg-primary/20 text-primary text-sm">−</button>
                          <span className="font-bold text-secondary text-sm px-1 min-w-[18px] text-center">{qty}</span>
                          <button onClick={() => changeQty(item.id, 1)} className="p-1.5 hover:bg-primary/20 text-primary text-sm">+</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order summary */}
      {itemCount > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <h3 className="font-display font-bold text-secondary text-sm mb-3">🧾 Order Summary</h3>
          <div className="space-y-1 text-sm mb-3">
            <div className="flex justify-between"><span className="text-text-muted">Subtotal</span><span>{currency} {subtotal.toFixed(0)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Delivery</span><span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>{orderType === 'pickup' ? 'Pickup (Free)' : deliveryFee === 0 ? 'FREE 🎉' : `${currency} ${deliveryFee}`}</span></div>
            <div className="flex justify-between font-black text-base pt-1 border-t border-orange-100"><span>Total</span><span className="text-primary">{currency} {total.toFixed(0)}</span></div>
          </div>
          <button onClick={handlePlace} disabled={placing || !form.name || !form.phone}
            className="btn-primary w-full py-3 rounded-xl font-black text-sm disabled:opacity-50">
            {placing ? 'Placing Order...' : `📞 Place Order — ${currency} ${total.toFixed(0)}`}
          </button>
        </div>
      )}
    </div>
  );
}
