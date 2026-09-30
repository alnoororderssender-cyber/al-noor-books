import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, Box, CheckCircle2, CreditCard, Home as HomeIcon, MapPin, Truck } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatDate, formatPrice } from '../utils/format';
import { useSettings } from '../context/SettingsContext';
import TrustStrip from '../components/TrustStrip';
import ContinueShoppingBanner from '../components/ContinueShoppingBanner';
import { TotalsRows } from '../components/OrderSummaryExtras';

function loadOrder(orderId, fromState) {
  if (fromState?.orderId === orderId) return fromState;
  try {
    const saved = JSON.parse(sessionStorage.getItem('anb-last-order'));
    if (saved?.orderId === orderId) return saved;
  } catch { /* ignore */ }
  return null;
}

const STEPS = [
  { icon: CheckCircle2, title: 'Order Confirmed', text: 'We\u2019ve received your order and will confirm it shortly.' },
  { icon: Box, title: 'Preparing Your Items', text: 'We\u2019ll pack your order with care.' },
  { icon: Truck, title: 'Out for Delivery', text: 'Your order will be on its way to you.' },
  { icon: HomeIcon, title: 'Delivered', text: 'Your order will arrive at your address.' },
];

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const location = useLocation();
  const { settings } = useSettings();
  usePageTitle('Order received');
  const order = loadOrder(orderId, location.state?.order);
  const isOnline = order?.payment.method === 'online';

  return (
    <>
      <div className="page py-10 lg:py-14">
        <header className="mx-auto max-w-2xl text-center">
          <CheckCircle2 className="mx-auto text-navy" size={54} strokeWidth={1.3} />
          <p className="eyebrow mt-5">Order Received</p>
          <h1 className="heading-serif mt-2 text-3xl sm:text-[2.6rem]">Thank you for your order!</h1>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-navy-700">
            Thank you for shopping with Al Noor Books. Your order has been received and will be processed shortly.
          </p>

          <div className="mx-auto mt-8 flex max-w-md items-center justify-between rounded border border-navy/15 bg-tint/60 px-5 py-4 text-left">
            <div>
              <p className="text-xs text-navy-700">Order ID</p>
              <p className="mt-0.5 text-lg font-bold tracking-wide text-navy" data-testid="order-id">#{orderId}</p>
            </div>
            {order && <div className="text-right"><p className="text-xs text-navy-700">Order Date</p><p className="mt-0.5 text-sm font-medium text-navy">{formatDate(order.createdAt)}</p></div>}
          </div>
          <div className="mx-auto mt-5 max-w-md">
            <Link to="/products" className="btn-primary h-12 w-full uppercase tracking-wider">Continue Shopping <ArrowRight size={16} /></Link>
          </div>
        </header>

        {order ? (
          <>
            <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted">
              Please keep your order ID handy. {order.customer.name}, we&rsquo;ll contact you on {order.customer.phone} if we need anything.
            </p>
            <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
              <section className="card self-start p-5 sm:p-6" aria-labelledby="items-h">
                <h2 id="items-h" className="heading-serif text-2xl">Order Items</h2>
                <p className="mt-1 text-sm text-muted">{order.items.reduce((n, i) => n + i.quantity, 0)} items</p>
                <ul className="mt-4 divide-y divide-line border-t border-line">
                  {order.items.map((i, idx) => (
                    <li key={idx} className="flex items-center gap-4 py-4">
                      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded bg-mist"><img src={i.image} alt="" className="h-full w-full object-contain p-1" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-navy">{i.name}</p>
                        {i.selectedType && <p className="mt-0.5 text-xs text-muted">Type: {i.selectedType}</p>}
                      </div>
                      <div className="text-right"><p className="text-sm font-medium text-navy">{formatPrice(i.subtotal)}</p><p className="mt-0.5 text-xs text-muted">Qty: {i.quantity}</p></div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="card p-5 sm:p-6" aria-labelledby="sum-h">
                <h2 id="sum-h" className="heading-serif text-2xl">Order Summary</h2>
                <div className="mt-4">
                  <TotalsRows count={order.items.reduce((n, i) => n + i.quantity, 0)} subtotal={order.pricing.subtotal} deliveryCharge={order.pricing.deliveryCharge} threshold={settings?.freeDeliveryThreshold} total={order.pricing.total} />
                </div>
                <div className="mt-5 flex items-start gap-3 rounded bg-tint/70 p-4">
                  <Truck size={26} strokeWidth={1.4} className="mt-0.5 shrink-0 text-navy-700" />
                  <div><p className="text-sm font-semibold text-navy">Your order is being prepared</p><p className="text-[13px] text-navy-700">We&rsquo;ll be in touch if we need anything.</p></div>
                </div>
                <div className="mt-5 border-t border-line pt-5">
                  <p className="flex items-center gap-2.5 text-sm font-semibold text-navy"><MapPin size={20} strokeWidth={1.5} className="text-navy-700" /> Shipping Address</p>
                  <address className="mt-2 pl-[30px] text-[13px] not-italic leading-relaxed text-navy-700">{order.customer.name}<br />{order.customer.address}<br />{order.customer.cityArea}</address>
                </div>
                <div className="mt-5 border-t border-line pt-5">
                  <p className="flex items-center gap-2.5 text-sm font-semibold text-navy"><CreditCard size={20} strokeWidth={1.5} className="text-navy-700" /> Payment Method</p>
                  <p className="mt-2 pl-[30px] text-[13px] leading-relaxed text-navy-700">
                    {isOnline ? <>Online Payment<br />We&rsquo;ve received your payment screenshot and will verify it shortly.</> : <>Cash on Delivery<br />Pay when your order arrives.</>}
                  </p>
                </div>
              </section>
            </div>

            <section className="card mt-6 p-5 sm:p-6" aria-labelledby="next-h">
              <h2 id="next-h" className="heading-serif text-2xl">What Happens Next?</h2>
              <ol className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
                {STEPS.map(({ icon: Icon, title, text }, i) => (
                  <li key={title} className={`lg:px-6 ${i > 0 ? 'lg:border-l lg:border-line' : 'lg:pl-0'}`}>
                    <Icon size={26} strokeWidth={1.4} className="text-navy-700" />
                    <p className="mt-2 text-sm font-semibold text-navy">{title}</p>
                    <p className="mt-1 text-[13px] text-muted">{text}</p>
                  </li>
                ))}
              </ol>
            </section>
          </>
        ) : (
          <p className="mx-auto mt-8 max-w-lg rounded border border-line bg-mist p-4 text-center text-sm text-navy-700">
            The order details aren&rsquo;t available on this device, but your order is safely placed. Keep your order ID <strong>#{orderId}</strong> for reference.
          </p>
        )}

        <div className="mt-8"><ContinueShoppingBanner /></div>
      </div>
      <TrustStrip />
    </>
  );
}
