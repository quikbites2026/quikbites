import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import MenuCard from '../components/MenuCard';
import CartSidebar from '../components/CartSidebar';
import { getSettings, getCategories, getMenuItems, seedDatabase } from '../lib/firebaseHelpers';

export default function Home() {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setInstallPrompt(null);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        await seedDatabase();
        const [s, cats, items] = await Promise.all([getSettings(), getCategories(), getMenuItems()]);
        setSettings(s);
        setCategories(cats);
        setMenuItems(items);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeCats = categories.filter(c => c.active);
  const filteredItems = menuItems.filter(item => {
    const matchCat = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = activeCats.map(cat => ({
    ...cat,
    items: filteredItems.filter(i => i.categoryId === cat.id),
  })).filter(cat => cat.items.length > 0);

  const currency = settings?.currency || 'SBD';
  const isOpen = settings?.openingHours?.isOpen !== false;

  return (
    <>
      <Head>
        <title>QuikBites — South Asian Cloud Kitchen</title>
        <meta name="description" content="Order authentic South Asian food online. Delivery & pickup in Honiara." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="min-h-screen bg-bg-warm">
        <Header settings={settings} />
        <CartSidebar settings={settings} />

        {/* Hero banner */}
        <div className="bg-gradient-to-br from-secondary via-secondary to-[#5a2e10] py-6 sm:py-10 px-4 text-center">
          <h2 className="font-display font-bold text-white text-xl sm:text-3xl mb-2 leading-tight">
            Authentic South Asian Flavours
          </h2>
          <p className="text-white/60 text-sm max-w-md mx-auto">
            Freshly cooked & delivered in Honiara. Free delivery over {currency} {settings?.freeDeliveryThreshold || 100}!
          </p>
          {!isOpen && (
            <div className="mt-4 inline-block bg-red-500/20 border border-red-400/30 text-red-200 text-sm font-semibold px-4 py-2 rounded-full">
              😴 We&apos;re currently closed. Come back during opening hours!
            </div>
          )}
        </div>

        {/* PWA Install Banner */}
        {showInstallBanner && (
          <div className="bg-secondary border-b border-white/10 px-4 py-3">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl flex-shrink-0">📲</span>
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm">Add QuikBites to your home screen</p>
                  <p className="text-white/55 text-xs">Order faster — works like a real app!</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleInstall}
                  className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-4 py-2 rounded-full transition-colors whitespace-nowrap"
                >
                  Install
                </button>
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="text-white/40 hover:text-white/70 text-lg leading-none p-1 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6"
          style={{paddingBottom: 'max(80px, env(safe-area-inset-bottom, 80px))'}}>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 Search menu items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full max-w-md bg-white border border-orange-100 rounded-2xl px-4 py-2.5 text-sm font-body text-text-main placeholder-text-muted focus:outline-none focus:border-primary shadow-sm"
            />
          </div>

          {/* Category filter — horizontally scrollable on all screens */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all border ${
                activeCategory === 'all'
                  ? 'bg-primary text-white border-primary shadow-warm'
                  : 'bg-white text-text-muted border-orange-100 hover:border-primary hover:text-primary'
              }`}
            >
              All
            </button>
            {activeCats.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all border whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-primary text-white border-primary shadow-warm'
                    : 'bg-white text-text-muted border-orange-100 hover:border-primary hover:text-primary'
                }`}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="spinner" />
            </div>
          )}

          {/* Menu groups */}
          {!loading && grouped.map(cat => (
            <div key={cat.id} id={cat.id} className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">{cat.emoji}</span>
                <h2 className="font-display font-bold text-secondary text-lg sm:text-xl">{cat.name}</h2>
                <div className="flex-1 h-px bg-orange-100 ml-2" />
              </div>
              {/* Responsive grid: 2 cols on mobile, 3 on tablet, 4 on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {cat.items.map(item => (
                  <MenuCard key={item.id} item={item} currency={currency} />
                ))}
              </div>
            </div>
          ))}

          {!loading && grouped.length === 0 && !searchQuery && (
            <div className="text-center py-16 text-text-muted">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="font-semibold">Menu is being prepared...</p>
            </div>
          )}
          {!loading && grouped.length === 0 && searchQuery && (
            <div className="text-center py-16 text-text-muted">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold">No items found for &quot;{searchQuery}&quot;</p>
              <button onClick={() => setSearchQuery('')} className="mt-2 text-primary text-sm font-bold hover:underline">
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-secondary text-white/50 text-center py-6 text-xs">
          <p className="font-display text-white/70 text-base mb-1">QuikBites</p>
          <p>South Asian Cloud Kitchen · Honiara, Solomon Islands</p>
          {settings?.contactPhone && <p className="mt-1">📞 WhatsApp: {settings.contactPhone}</p>}
        </footer>
      </div>
    </>
  );
}
