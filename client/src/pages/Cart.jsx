import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, ShoppingCart, Trash2, X } from 'lucide-react';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { calcDelivery } from '../utils/delivery';
import { formatPrice } from '../utils/format';
import QuantityStepper from '../components/ui/QuantityStepper';
import { EmptyState, InlineAlert } from '../components/ui/States';
import { SummaryAssurances, TotalsRows } from '../components/OrderSummaryExtras';
import ContinueShoppingBanner from '../components/ContinueShoppingBanner';
import SectionHeading from '../components/ui/SectionHeading';
import { ArrowRight as Arrow } from 'lucide-react';

export default function Cart() {
  usePageTitle('Cart');
  const navigate = useNavigate();
  const { items, count, subtotal, hasUnavailable, setQty, remove, clear, refresh } = useCart();
  const { settings } = useSettings();
  const cats = useAsync((signal) => api.categories(signal), []);
  const d = calcDelivery(subtotal, settings);

  useEffect(() => { refresh(); }, [refresh]);

  if (items.length === 0) {
    return (
      <div className="page py-10">
        <EmptyState title="Your cart is empty" message="Browse our books and stationery and add something you like."
          action={<Link to="/products" className="btn-primary">Start shopping</Link>} />
      </div>
    );
  }

  return (
    <div className="page pb-16 pt-10 lg:pt-12">
      <p className="eyebrow">Your Cart</p>
      <h1 className="heading-serif mt-2 text-4xl sm:text-[2.6rem]">Shopping Cart</h1>
      <p className="mt-2 text-[15px] text-navy-700">Review your items and proceed to checkout when you&rsquo;re ready.</p>

      {hasUnavailable && (
        <InlineAlert className="mt-6">Some items are no longer available or have changed. Please remove the highlighted items to continue.</InlineAlert>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_360px]">
        <section aria-label="Cart items" className="card self-start">
          <div className="hidden grid-cols-[minmax(0,1fr)_100px_130px_100px_32px] gap-4 border-b border-line px-6 py-4 text-sm font-medium text-navy-700 md:grid">
            <span>Item</span><span>Price</span><span>Quantity</span><span>Total</span><span />
          </div>
          <ul>
            {items.map((i) => (
              <li key={i.key} className={`grid gap-x-4 gap-y-3 border-b border-line px-4 py-5 last:border-b-0 sm:px-6 md:grid-cols-[minmax(0,1fr)_100px_130px_100px_32px] md:items-center ${i.unavailable ? 'bg-red-50/60' : ''}`}>
                <div className="flex items-center gap-4">
                  <Link to={`/products/${i.slug}`} className="grid h-[84px] w-[72px] shrink-0 place-items-center overflow-hidden rounded bg-mist sm:h-[92px] sm:w-[80px]">
                    <img src={i.image} alt="" className="h-full w-full object-contain p-1.5" />
                  </Link>
                  <div className="min-w-0">
                    <Link to={`/products/${i.slug}`} className="text-sm font-medium text-navy hover:underline">{i.name}</Link>
                    {i.category && <p className="mt-1 text-xs text-muted">{i.category}</p>}
                    {i.type && <p className="mt-0.5 text-xs text-muted">Type: {i.type}</p>}
                    {i.unavailable && <p className="mt-1 text-xs font-medium text-danger">No longer available</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between md:contents">
                  <span className="text-sm text-navy md:order-none">{i.unavailable ? '\u2014' : formatPrice(i.price)}</span>
                  {i.unavailable ? <span /> : <QuantityStepper size="sm" value={i.quantity} onChange={(q) => setQty(i.key, q)} label={`Quantity for ${i.name}`} />}
                  <span className="text-sm font-semibold text-navy">{i.unavailable ? '\u2014' : formatPrice(i.price * i.quantity)}</span>
                  <button type="button" onClick={() => remove(i.key)} className="grid h-8 w-8 place-items-center rounded text-navy-700 hover:bg-mist" aria-label={`Remove ${i.name}`}><X size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="card self-start p-6 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="heading-serif text-2xl">Order Summary</h2>
          <div className="mt-4">
            <TotalsRows count={count} subtotal={subtotal} deliveryCharge={d.deliveryCharge} threshold={settings?.freeDeliveryThreshold} total={subtotal + d.deliveryCharge} ready={d.ready} />
          </div>
          {d.ready && !d.isFree && subtotal > 0 && (
            <p className="mt-3 rounded bg-tint px-3 py-2 text-[13px] text-navy-700" role="status">
              Add <strong>{formatPrice(d.remainingForFree)}</strong> more for FREE DELIVERY
            </p>
          )}
          <button type="button" className="btn-primary mt-5 h-12 w-full" disabled={hasUnavailable || subtotal === 0} onClick={() => navigate('/checkout')}>
            <Lock size={16} /> Proceed to Checkout <ArrowRight size={16} />
          </button>
          <Link to="/products" className="btn-outline mt-3 h-12 w-full">Continue Shopping</Link>
          <div className="mt-6 border-t border-line pt-6"><SummaryAssurances /></div>
        </aside>
      </div>

      <button type="button" className="mt-5 inline-flex items-center gap-2 text-sm text-navy-700 hover:underline"
        onClick={() => { if (window.confirm('Remove everything from your cart?')) clear(); }}>
        <Trash2 size={16} /> Clear Cart
      </button>

      <div className="mt-12"><ContinueShoppingBanner /></div>

      {cats.data?.categories.length > 0 && (
        <section className="mt-12" aria-labelledby="cart-cats">
          <SectionHeading title="Shop by Category" to="/products" plain />
          <span id="cart-cats" className="sr-only">Shop by category</span>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {cats.data.categories.slice(0, 6).map((c) => (
              <Link key={c._id} to={`/products?category=${c.slug}`} className="card flex flex-col overflow-hidden hover:shadow-md">
                <div className="grid aspect-[16/9] place-items-center bg-mist"><img src={c.image?.url} alt="" className="h-full w-full object-contain p-2" loading="lazy" /></div>
                <span className="flex items-center justify-between px-3 py-2.5 text-xs font-medium text-navy">{c.name}<Arrow size={14} className="text-navy-700" /></span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
