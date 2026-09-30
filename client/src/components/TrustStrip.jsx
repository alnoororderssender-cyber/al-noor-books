import { MapPin, ShieldCheck, Store, Truck } from 'lucide-react';

const ITEMS = [
  { icon: ShieldCheck, title: 'Quality Products', text: 'Carefully selected stationery.' },
  { icon: Truck, title: 'Easy Ordering', text: 'Order online in minutes.' },
  { icon: MapPin, title: 'Local Service', text: 'Familiar service from Al Noor Books.' },
  { icon: Store, title: 'Visit Our Store', text: 'Shop with us in person.' },
];

/** variant "band": full-width strip (home, shop, checkout). "boxed": bordered card (product page). */
export default function TrustStrip({ variant = 'band' }) {
  const grid = (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 py-6 lg:grid-cols-4 lg:gap-0 lg:py-7">
      {ITEMS.map(({ icon: Icon, title, text }, i) => (
        <li key={title} className={`flex items-center gap-3.5 lg:px-6 ${i > 0 ? 'lg:border-l lg:border-line' : 'lg:pl-0'}`}>
          <Icon className="shrink-0 text-navy-700" size={34} strokeWidth={1.4} />
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-navy-700 sm:text-sm">{title}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-muted sm:text-[13px]">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
  if (variant === 'boxed') {
    return <div className="card px-4 sm:px-6">{grid}</div>;
  }
  return (
    <section className="border-y border-line bg-mist/70" aria-label="Why shop with us">
      <div className="page">{grid}</div>
    </section>
  );
}
