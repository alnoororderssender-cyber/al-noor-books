import { Truck } from 'lucide-react';
import SettingsPage from './SettingsPage';

export const AnnouncementSettings = () => (
  <SettingsPage title="Announcement" subtitle="The message shown in the bar at the very top of every page."
    fields={[{ name: 'announcement', label: 'Announcement text', required: true, max: 160, help: 'Example: FREE DELIVERY ON ORDERS ABOVE RS. 3,000 or BACK TO SCHOOL COLLECTION NOW AVAILABLE' }]}
    preview={(v) => (
      <div><p className="label">Preview</p>
        <div className="flex items-center justify-center gap-2 rounded bg-navy px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-white"><Truck size={15} /> {v.announcement || '\u2026'}</div>
      </div>
    )} />
);

export const DeliverySettings = () => (
  <SettingsPage title="Delivery Settings" subtitle="Used on the cart, checkout and when orders are priced."
    fields={[
      { name: 'deliveryCharge', label: 'Standard delivery charge (Rs.)', type: 'number', help: 'Charged when the subtotal is below the free delivery threshold.' },
      { name: 'freeDeliveryThreshold', label: 'Free delivery threshold (Rs.)', type: 'number', help: 'Orders with a subtotal at or above this amount get free delivery.' },
    ]} />
);

export const PaymentSettings = () => (
  <SettingsPage title="Payment Settings" group="payment" subtitle="Shown to customers who choose Online Payment at checkout."
    notice="Leave every field empty to turn Online Payment off; customers will then only see Cash on Delivery."
    fields={[
      { name: 'jazzCashTitle', label: 'JazzCash account title', max: 100 },
      { name: 'jazzCashNumber', label: 'JazzCash number', max: 40, placeholder: '03XX XXXXXXX' },
      { name: 'bankTitle', label: 'Bank account title', max: 100 },
      { name: 'bankName', label: 'Bank name', max: 100 },
      { name: 'accountNumber', label: 'Account number', max: 60 },
      { name: 'iban', label: 'IBAN', max: 60, placeholder: 'PK00 XXXX 0000 0000 0000 0000' },
    ]} />
);

export const StoreSettings = () => (
  <SettingsPage title="Store Info" group="store" subtitle="Shown in the footer, on the Contact page and in the WhatsApp banner."
    fields={[
      { name: 'phone', label: 'Phone number', max: 40 },
      { name: 'whatsapp', label: 'WhatsApp number', max: 40, help: 'International format without + or spaces, e.g. 923001234567. Enables the "Chat on WhatsApp" banner and buttons.' },
      { name: 'email', label: 'Email', max: 120 },
      { name: 'address', label: 'Store address', type: 'textarea', max: 300 },
      { name: 'hours', label: 'Opening hours', max: 200, placeholder: 'Mon\u2013Sat, 10:00 AM \u2013 8:00 PM' },
      { name: 'facebook', label: 'Facebook page URL', max: 300 },
      { name: 'instagram', label: 'Instagram URL', max: 300 },
    ]} />
);
