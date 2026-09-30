import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Banknote, CreditCard, Lock, Smartphone } from 'lucide-react';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { calcDelivery } from '../utils/delivery';
import { formatPrice } from '../utils/format';
import { PK_CITIES } from '../utils/siteConfig';
import { normalizePkPhone } from '../utils/validation';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import TrustStrip from '../components/TrustStrip';
import PaymentDetails from '../components/PaymentDetails';
import PaymentScreenshotField from '../components/PaymentScreenshotField';
import { SummaryAssurances, TotalsRows } from '../components/OrderSummaryExtras';
import { InlineAlert, Spinner } from '../components/ui/States';

const newKey = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

function StepHeading({ n, children }) {
  return (
    <h2 className="flex items-center gap-3 font-serif text-xl font-bold text-navy">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-navy font-sans text-[13px] font-semibold text-white" aria-hidden="true">{n}</span>
      {children}
    </h2>
  );
}

function Field({ id, label, required, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}{required && <span className="text-danger"> *</span>}</label>
      {children}
      {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}

function PayOption({ value, current, onSelect, icon: Icon, title, text, disabled }) {
  const selected = current === value;
  return (
    <label className={`flex cursor-pointer items-center gap-4 rounded border px-4 py-4 transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${selected ? 'border-navy bg-tint/50' : 'border-line bg-white hover:border-navy/40'}`}>
      <input type="radio" name="payment" value={value} checked={selected} onChange={() => onSelect(value)} disabled={disabled} className="sr-only" />
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selected ? 'border-navy' : 'border-slate-300'}`} aria-hidden="true">
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-navy" />}
      </span>
      <Icon size={26} strokeWidth={1.4} className="shrink-0 text-navy-700" />
      <span><span className="block text-sm font-semibold text-navy">{title}</span><span className="block text-[13px] text-muted">{text}</span></span>
    </label>
  );
}

export default function Checkout() {
  usePageTitle('Checkout');
  const navigate = useNavigate();
  const { items, count, subtotal, hasUnavailable, clear, refresh } = useCart();
  const { settings } = useSettings();
  const payInfo = useAsync((signal) => api.paymentInfo(signal), []);

  const [form, setForm] = useState({ name: '', phone: '', city: '', area: '', address: '', note: '' });
  const [method, setMethod] = useState('cod');
  const [screenshot, setScreenshot] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const keyRef = useRef(newKey());
  const alertRef = useRef(null);

  useEffect(() => { refresh(); }, [refresh]);

  const d = calcDelivery(subtotal, settings);
  const total = subtotal + d.deliveryCharge;
  const onlineAvailable = Boolean(payInfo.data && (payInfo.data.jazzCashNumber || payInfo.data.accountNumber || payInfo.data.iban));

  useEffect(() => { if (!onlineAvailable && method === 'online' && !payInfo.loading) setMethod('cod'); }, [onlineAvailable, method, payInfo.loading]);

  if (items.length === 0 && !submitting) return <Navigate to="/cart" replace />;

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); if (errors[k]) setErrors((x) => ({ ...x, [k]: '' })); };
  const inputCls = (k) => `input ${errors[k] ? 'input-error' : ''}`;

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Please enter your full name.';
    if (!normalizePkPhone(form.phone.trim())) e.phone = 'Enter a valid phone number, e.g. 03XX XXXXXXX.';
    if (!form.address.trim() || form.address.trim().length < 5) e.address = 'Please enter your complete delivery address.';
    if (!form.city) e.city = 'Please select your city.';
    if (!form.area.trim()) e.area = 'Please enter your area or locality.';
    if (method === 'online' && !screenshot) e.screenshot = 'Please upload your payment screenshot to continue.';
    return e;
  };

  const focusFirst = (e) => {
    const order = ['name', 'phone', 'address', 'city', 'area', 'screenshot'];
    const first = order.find((k) => e[k]);
    if (first) document.getElementById(first)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (submittingRef.current) return; // duplicate-click guard
    setFormError('');
    if (hasUnavailable) { setFormError('Some items in your cart are no longer available. Please review your cart.'); return; }
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { focusFirst(e); return; }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const cityArea = form.city === 'Other' ? form.area.trim() : `${form.area.trim()}, ${form.city}`;
      const payload = {
        idempotencyKey: keyRef.current,
        paymentMethod: method,
        customer: { name: form.name.trim(), phone: form.phone.trim(), cityArea, address: form.address.trim(), note: form.note.trim() },
        items: items.map((i) => ({ productId: i.productId, selectedType: i.type || '', quantity: i.quantity })),
      };
      const fd = new FormData();
      fd.append('payload', JSON.stringify(payload));
      if (method === 'online' && screenshot) fd.append('screenshot', screenshot);

      const order = await api.createOrder(fd);
      try { sessionStorage.setItem('anb-last-order', JSON.stringify(order)); } catch { /* ignore */ }
      clear(); // only after the order exists
      navigate(`/order-confirmation/${order.orderId}`, { replace: true, state: { order } });
    } catch (err) {
      const map = { 'customer.name': 'name', 'customer.phone': 'phone', 'customer.address': 'address', 'customer.cityArea': 'area', screenshot: 'screenshot' };
      const fieldErrors = {};
      Object.entries(err.errors || {}).forEach(([k, v]) => { if (map[k]) fieldErrors[map[k]] = v; });
      setErrors(fieldErrors);
      setFormError(err.message || 'We couldn\u2019t place your order. Please try again.');
      requestAnimationFrame(() => alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const placeBtn = (className = '') => (
    <button type="submit" form="checkout-form" disabled={submitting || items.length === 0} className={`btn-primary h-12 ${className}`}>
      {submitting ? <><Spinner /> Placing order&hellip;</> : <><Lock size={16} /> Place Order <ArrowRight size={16} /></>}
    </button>
  );

  return (
    <>
    <div className="page pb-16 pt-6 lg:pt-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Checkout' }]} />
      <h1 className="heading-serif mt-4 text-4xl sm:text-5xl">Checkout</h1>
      <p className="mt-2 text-[15px] text-navy-700">Complete your order and get your essentials delivered.</p>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_430px]">
        <form id="checkout-form" onSubmit={onSubmit} noValidate className="card space-y-9 p-5 sm:p-8" aria-busy={submitting}>
          <div ref={alertRef}>{formError && <InlineAlert>{formError}</InlineAlert>}</div>

          <section className="space-y-5" aria-labelledby="s1">
            <span id="s1" className="sr-only">Customer information</span>
            <StepHeading n={1}>Customer Information</StepHeading>
            <Field id="name" label="Full Name" required error={errors.name}>
              <input id="name" className={inputCls('name')} value={form.name} onChange={set('name')} placeholder="Enter your full name" autoComplete="name" maxLength={80} aria-invalid={!!errors.name} />
            </Field>
            <Field id="phone" label="Phone / WhatsApp Number" required error={errors.phone}>
              <input id="phone" type="tel" inputMode="tel" className={inputCls('phone')} value={form.phone} onChange={set('phone')} placeholder="03XX XXXXXXX" autoComplete="tel" maxLength={20} aria-invalid={!!errors.phone} />
            </Field>
          </section>

          <section className="space-y-5" aria-labelledby="s2">
            <span id="s2" className="sr-only">Shipping address</span>
            <StepHeading n={2}>Shipping Address</StepHeading>
            <Field id="address" label="Complete Delivery Address" required error={errors.address}>
              <input id="address" className={inputCls('address')} value={form.address} onChange={set('address')} placeholder="House / Flat / Building, Street" autoComplete="street-address" maxLength={300} aria-invalid={!!errors.address} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="city" label="City" required error={errors.city}>
                <select id="city" className={inputCls('city')} value={form.city} onChange={set('city')} aria-invalid={!!errors.city}>
                  <option value="">Select City</option>
                  {PK_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field id="area" label="Area / Locality" required error={errors.area}>
                <input id="area" className={inputCls('area')} value={form.area} onChange={set('area')} placeholder="e.g. DHA, Gulberg, etc." maxLength={100} aria-invalid={!!errors.area} />
              </Field>
            </div>
            <Field id="note" label="Order Notes (Optional)">
              <textarea id="note" rows={3} className="input" value={form.note} onChange={set('note')} placeholder="Any special instructions for your order?" maxLength={500} />
            </Field>
          </section>

          <section className="space-y-4" aria-labelledby="s3">
            <span id="s3" className="sr-only">Payment method</span>
            <StepHeading n={3}>Payment Method</StepHeading>
            <div className="space-y-3" role="radiogroup" aria-label="Payment method">
              <PayOption value="cod" current={method} onSelect={setMethod} icon={Banknote} title="Cash on Delivery" text="Pay when your order arrives." />
              <PayOption value="online" current={method} onSelect={setMethod} icon={Smartphone} title="Online Payment" disabled={!onlineAvailable}
                text={onlineAvailable ? 'Pay via JazzCash or bank transfer and upload your screenshot.' : 'Currently unavailable.'} />
            </div>

            {method === 'cod' && (
              <div className="rounded border border-line bg-mist/70 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-navy"><CreditCard size={17} /> Cash on Delivery</p>
                <p className="mt-1 text-[13px] text-navy-700">Pay when your order arrives.</p>
              </div>
            )}

            {method === 'online' && payInfo.data && (
              <div className="space-y-5 rounded border border-navy/15 bg-tint/50 p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm text-navy-700">Amount to Pay</p>
                  <p className="font-serif text-2xl font-bold text-navy" aria-live="polite">{formatPrice(total)}</p>
                </div>
                <PaymentDetails info={payInfo.data} />
                <p className="text-[13px] text-navy-700">Send the exact amount, then upload a clear screenshot of the payment confirmation below.</p>
                <PaymentScreenshotField file={screenshot} onChange={(f) => { setScreenshot(f); setErrors((x) => ({ ...x, screenshot: '' })); }} error={errors.screenshot} />
              </div>
            )}
          </section>

          <div className="flex items-center justify-between gap-4 pt-1">
            <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-navy-700 hover:underline"><ArrowLeft size={16} /> Back to Cart</Link>
            {placeBtn("min-w-[200px] flex-1 sm:flex-none sm:px-10 lg:min-w-[240px]")}
          </div>
        </form>

        <aside className="card p-5 sm:p-6 lg:sticky lg:top-28" aria-label="Order summary">
          <div className="flex items-baseline justify-between">
            <h2 className="heading-serif text-2xl">Order Summary</h2>
            <Link to="/cart" className="text-[13px] font-medium text-navy-700 hover:underline">Edit Cart</Link>
          </div>
          <ul className="mt-5 divide-y divide-line">
            {items.map((i) => (
              <li key={i.key} className="flex gap-3.5 py-3.5 first:pt-0">
                <div className="grid h-[72px] w-[64px] shrink-0 place-items-center overflow-hidden rounded bg-mist"><img src={i.image} alt="" className="h-full w-full object-contain p-1" /></div>
                <div className="flex min-w-0 flex-1 justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-navy">{i.name}</p>
                    {i.type && <p className="mt-0.5 text-xs text-muted">Type: {i.type}</p>}
                    {i.unavailable && <p className="mt-0.5 text-xs font-medium text-danger">No longer available</p>}
                  </div>
                  <div className="shrink-0 text-right"><p className="text-xs text-muted">&times; {i.quantity}</p><p className="mt-1 text-sm font-medium text-navy">{i.unavailable ? '\u2014' : formatPrice(i.price * i.quantity)}</p></div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-line pt-3">
            <TotalsRows count={count} subtotal={subtotal} deliveryCharge={d.deliveryCharge} threshold={settings?.freeDeliveryThreshold} total={total} ready={d.ready} />
          </div>
          {d.ready && !d.isFree && subtotal > 0 && (
            <p className="mt-3 rounded bg-white px-3 py-2 text-[13px] text-navy-700" role="status">Add <strong>{formatPrice(d.remainingForFree)}</strong> more for FREE DELIVERY</p>
          )}
          {placeBtn("mt-5 w-full")}
          <Link to="/products" className="btn-outline mt-3 h-12 w-full">Continue Shopping</Link>
          <div className="mt-6 rounded bg-tint/60 p-5"><SummaryAssurances /></div>
        </aside>
      </div>
    </div>
    <TrustStrip />
    </>
  );
}
