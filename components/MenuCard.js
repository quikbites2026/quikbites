import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { FiPlus, FiMinus, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function MenuCard({ item, currency = 'SBD' }) {
  const { addItem, items, updateQuantity } = useCart();
  const [adding, setAdding] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const cartItem = items.find(i => i.id === item.id);
  const qty = cartItem?.quantity || 0;
  const hasDiscount = item.discountPercent > 0;
  const discountedPrice = hasDiscount
    ? item.price - (item.price * item.discountPercent) / 100
    : item.price;

  // Check if description is long enough to need truncation
  const isLongDesc = item.description && item.description.length > 60;

  async function handleAdd() {
    setAdding(true);
    addItem(item);
    setTimeout(() => setAdding(false), 300);
  }

  return (
    <div className={`menu-card bg-bg-card rounded-2xl overflow-hidden shadow-card border border-orange-100/60 flex flex-col h-full ${!item.available ? 'opacity-50' : ''}`}>
      {/* Image area */}
      <div className="relative w-full bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden" style={{aspectRatio:'4/3'}}>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl sm:text-5xl select-none">{getCategoryEmoji(item.categoryId)}</span>
          </div>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full shadow">Unavailable</span>
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 right-2 badge-discount text-xs">
            {item.discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-text-main text-xs sm:text-sm leading-snug mb-1">
          {item.name}
        </h3>

        {/* Description with Read more / Show less */}
        {item.description && (
          <div className="mb-2 flex-1">
            <p className={`text-text-muted text-xs leading-relaxed ${!showFullDesc ? 'line-clamp-2' : ''}`}>
              {item.description}
            </p>
            {isLongDesc && (
              <button
                onClick={() => setShowFullDesc(p => !p)}
                className="flex items-center gap-0.5 text-primary text-xs font-bold mt-0.5 hover:underline"
              >
                {showFullDesc ? (
                  <><FiChevronUp size={11} /> Show less</>
                ) : (
                  <><FiChevronDown size={11} /> Read more</>
                )}
              </button>
            )}
          </div>
        )}

        {/* Price + Add */}
        <div className="flex items-center justify-between gap-1 mt-auto">
          <div className="min-w-0">
            <span className="font-black text-secondary text-sm sm:text-base">
              {currency} {discountedPrice.toFixed(0)}
            </span>
            {hasDiscount && (
              <span className="text-text-muted text-xs line-through ml-1 hidden xs:inline">
                {currency} {item.price}
              </span>
            )}
          </div>

          {item.available && (
            qty === 0 ? (
              <button
                onClick={handleAdd}
                disabled={adding}
                className="btn-primary rounded-xl px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm flex items-center gap-1 flex-shrink-0"
              >
                <FiPlus size={13} />
                <span>Add</span>
              </button>
            ) : (
              <div className="flex items-center gap-0.5 sm:gap-1 bg-primary/10 rounded-xl overflow-hidden flex-shrink-0">
                <button
                  onClick={() => updateQuantity(item.id, qty - 1)}
                  className="p-1.5 hover:bg-primary/20 transition-colors text-primary"
                >
                  <FiMinus size={12} />
                </button>
                <span className="font-bold text-secondary text-sm px-1 min-w-[18px] text-center">
                  {qty}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, qty + 1)}
                  className="p-1.5 hover:bg-primary/20 transition-colors text-primary"
                >
                  <FiPlus size={12} />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryEmoji(categoryId) {
  const map = {
    'biryani-rice': '🍚', 'curries-mains': '🍛', 'baked-pasta': '🥘',
    'wraps-rolls': '🌯', 'breads': '🫓', 'snacks-starters': '🥟',
    'sweets-desserts': '🍮', 'drinks': '☕',
  };
  return map[categoryId] || '🍽️';
}
