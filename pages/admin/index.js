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
  { id: 'orders',   label: 'Orders',    icon: '📋' },
  { id: 'menu',     label: 'Menu',      icon: '🍛' },
  { id: 'delivery', label: 'Delivery',  icon: '🛵' },
  { id: 'settings', label: 'Settings',  icon: '⚙️' },
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
