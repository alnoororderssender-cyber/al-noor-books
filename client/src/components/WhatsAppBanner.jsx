import { ArrowRight } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import WhatsAppIcon from './ui/WhatsAppIcon';

export const waLink = (number, text = '') => {
  const digits = String(number || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}` : null;
};

/** Green bulk-order banner. Hidden until the owner adds a WhatsApp number in Admin > Store Info. */
export default function WhatsAppBanner() {
  const { settings } = useSettings();
  const link = waLink(settings?.store?.whatsapp, 'Hello Al Noor Books, I would like to ask about a bulk order.');
  if (!link) return null;
  return (
    <section className="bg-whatsapp text-white" aria-label="WhatsApp">
      <div className="page flex flex-col items-start gap-5 py-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <WhatsAppIcon size={52} strokeWidth={1.4} className="shrink-0" />
          <div className="hidden h-12 w-px bg-white/40 sm:block" />
          <div>
            <p className="text-lg font-semibold sm:text-xl">For bulk orders or quotes, contact us on WhatsApp.</p>
            <p className="mt-0.5 text-sm text-white/85">Get the best deals and personalized assistance.</p>
          </div>
        </div>
        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-whatsapp hover:bg-white/90">
          <WhatsAppIcon size={17} /> Chat on WhatsApp <ArrowRight size={15} />
        </a>
      </div>
    </section>
  );
}
