import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { api } from '../services/api';

const STORAGE_KEY = 'anb-cart-v1';
const MAX_QTY = 99;

export const lineKey = (productId, type) => `${productId}::${type || ''}`;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(raw)) return raw.filter((i) => i && i.productId && i.quantity > 0);
  } catch {
    /* corrupted or unavailable storage: start with an empty cart */
  }
  return [];
}

function reducer(items, action) {
  switch (action.type) {
    case 'add': {
      const { item, quantity } = action;
      const key = lineKey(item.productId, item.type);
      const existing = items.find((i) => i.key === key);
      if (existing) {
        return items.map((i) => (i.key === key ? { ...i, ...item, key, quantity: Math.min(MAX_QTY, i.quantity + quantity) } : i));
      }
      return [...items, { ...item, key, quantity: Math.min(MAX_QTY, quantity) }];
    }
    case 'setQty':
      return items.map((i) => (i.key === action.key ? { ...i, quantity: Math.max(1, Math.min(MAX_QTY, action.quantity)) } : i));
    case 'remove':
      return items.filter((i) => i.key !== action.key);
    case 'clear':
      return [];
    case 'sync':
      return action.items;
    default:
      return items;
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full / blocked: cart still works for this session */
    }
  }, [items]);

  // Keep several open tabs in step.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) dispatch({ type: 'sync', items: load() });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  /**
   * Re-reads product data so the cart never shows stale prices. Lines whose product
   * (or selected type) no longer exists are flagged `unavailable`.
   */
  const refresh = useCallback(async () => {
    const current = itemsRef.current;
    if (!current.length) return;
    const ids = [...new Set(current.map((i) => i.productId))];
    try {
      const { products } = await api.products({ ids: ids.join(','), limit: 100 });
      const byId = new Map(products.map((p) => [p._id, p]));
      const next = itemsRef.current.map((i) => {
        const p = byId.get(i.productId);
        const typeOk = p && (p.types.length === 0 ? !i.type : p.types.includes(i.type));
        if (!p || !typeOk) return { ...i, unavailable: true };
        return {
          ...i,
          unavailable: false,
          name: p.name,
          slug: p.slug,
          image: p.images[0]?.url || i.image,
          category: p.category?.name || i.category,
          price: p.price,
          type: p.types.length ? i.type : '',
        };
      });
      dispatch({ type: 'sync', items: next });
    } catch {
      /* offline: keep what we have; the server validates again at checkout */
    }
  }, []);

  const value = useMemo(() => {
    const payable = items.filter((i) => !i.unavailable);
    return {
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: payable.reduce((n, i) => n + i.price * i.quantity, 0),
      hasUnavailable: items.some((i) => i.unavailable),
      add: (item, quantity = 1) => dispatch({ type: 'add', item, quantity }),
      setQty: (key, quantity) => dispatch({ type: 'setQty', key, quantity }),
      remove: (key) => dispatch({ type: 'remove', key }),
      clear: () => dispatch({ type: 'clear' }),
      refresh,
    };
  }, [items, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);

/** Builds a cart line from a product document. */
export function cartItemFromProduct(product, type = '') {
  return {
    productId: product._id,
    slug: product.slug,
    name: product.name,
    image: product.images[0]?.url || '',
    category: product.category?.name || '',
    price: product.price,
    type,
  };
}
