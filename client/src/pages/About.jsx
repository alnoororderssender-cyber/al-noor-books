import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useSettings } from '../context/SettingsContext';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { formatPrice } from '../utils/format';
import { siteConfig } from '../utils/siteConfig';
import TrustStrip from '../components/TrustStrip';

export default function About() {
  usePageTitle('About');
  const { settings } = useSettings();
  const cats = useAsync((s) => api.categories(s), []);
  const pay = useAsync((s) => api.paymentInfo(s), []);
  const online = pay.data && (pay.data.jazzCashNumber || pay.data.accountNumber || pay.data.iban);

  return (
    <>
      <section className="border-b border-line">
        <div className="page grid items-center gap-8 py-12 lg:grid-cols-2 lg:py-16">
          <div>
            <p className="eyebrow">About</p>
            <h1 className="heading-serif mt-3 text-3xl leading-tight sm:text-4xl lg:text-[2.6rem]">A store you already know, now online.</h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-navy-700">
              Al Noor Books is a local stationery and bookstore. This website brings the familiar store experience online, so you can browse our range, order in minutes and have your everyday essentials delivered.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/products" className="btn-primary">Shop Now</Link>
              <Link to="/contact#visit" className="btn-outline">Visit Our Store</Link>
            </div>
          </div>
          <img src={siteConfig.storeImage} alt="" className="h-64 w-full rounded object-cover sm:h-80" />
        </div>
      </section>

      {cats.data?.categories.length > 0 && (
        <section className="page py-12">
          <h2 className="heading-serif text-2xl">What we offer</h2>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {cats.data.categories.map((c) => (
              <li key={c._id}><Link to={`/products?category=${c.slug}`} className="inline-block rounded border border-line px-4 py-2 text-sm text-navy-700 hover:border-navy hover:text-navy">{c.name}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <div className="page grid gap-6 pb-14 md:grid-cols-2">
        <section id="delivery" className="card scroll-mt-32 p-6">
          <h2 className="heading-serif text-2xl">Delivery Information</h2>
          {settings ? (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] text-navy-700">
              <li>Standard delivery charge: <strong>{formatPrice(settings.deliveryCharge)}</strong>.</li>
              <li><strong>Free delivery</strong> on orders of {formatPrice(settings.freeDeliveryThreshold)} or more.</li>
              <li>We&rsquo;ll contact you on the phone number you give at checkout if we need to confirm anything.</li>
            </ul>
          ) : <p className="mt-4 text-sm text-muted">Loading&hellip;</p>}
        </section>
        <section id="payment" className="card scroll-mt-32 p-6">
          <h2 className="heading-serif text-2xl">Payment Information</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] text-navy-700">
            <li><strong>Cash on Delivery</strong> &mdash; pay when your order arrives.</li>
            {online && <li><strong>Online Payment</strong> &mdash; pay by JazzCash or bank transfer, then upload a screenshot of your payment at checkout.</li>}
          </ul>
        </section>
      </div>
      <TrustStrip />
    </>
  );
}
