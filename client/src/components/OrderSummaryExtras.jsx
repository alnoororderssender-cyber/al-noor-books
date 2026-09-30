import { ShieldCheck, Store, Truck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { formatPrice } from '../utils/format';

/** Small reassurance list under the summary. Delivery threshold comes from backend settings. */
export function SummaryAssurances() {
  const { settings } = useSettings();
  const items = [
    { icon: ShieldCheck, title: 'Secure Checkout', text: 'Your information is safe with us.' },
    { icon: Truck, title: 'Free Delivery', text: settings ? `On orders above ${formatPrice(settings.freeDeliveryThreshold)}.` : 'On qualifying orders.' },
    { icon: Store, title: 'Visit Our Store', text: 'Shop with us in person.' },
  ];
  return (
    <ul className="space-y-4">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-start gap-3.5">
          <Icon size={26} strokeWidth={1.4} className="mt-0.5 shrink-0 text-navy-700" />
          <div><p className="text-sm font-semibold text-navy">{title}</p><p className="text-[13px] text-muted">{text}</p></div>
        </li>
      ))}
    </ul>
  );
}

/** Subtotal / delivery / total rows shared by Cart, Checkout and Confirmation. */
export function TotalsRows({ count, subtotal, deliveryCharge, threshold, total, ready = true }) {
  return (
    <dl className="text-sm">
      <div className="flex items-baseline justify-between py-2">
        <dt className="text-navy-700">Subtotal{count !== undefined && ` (${count} item${count === 1 ? '' : 's'})`}</dt>
        <dd className="font-medium text-navy">{formatPrice(subtotal)}</dd>
      </div>
      <div className="flex items-start justify-between py-2">
        <dt className="text-navy-700">
          Delivery Charges
          {threshold !== undefined && <span className="mt-0.5 block text-xs text-muted">(Free delivery above {formatPrice(threshold)})</span>}
        </dt>
        <dd className="font-medium text-navy">{!ready ? '\u2014' : deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}</dd>
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
        <dt className="font-serif text-lg font-bold text-navy">Total</dt>
        <dd className="font-serif text-xl font-bold text-navy">{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}
