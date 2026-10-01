import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useSettings } from '../context/SettingsContext';
import WhatsAppIcon from '../components/ui/WhatsAppIcon';
import { waLink } from '../components/WhatsAppBanner';
import TrustStrip from '../components/TrustStrip';

function Item({ icon: Icon, title, children }) {
  return (
    <div className="card flex gap-4 p-5">
      <Icon size={26} strokeWidth={1.4} className="mt-0.5 shrink-0 text-navy-700" />
      <div><h3 className="text-sm font-semibold text-navy">{title}</h3><div className="mt-1 text-[15px] text-navy-700">{children}</div></div>
    </div>
  );
}

export default function Contact() {
  usePageTitle('Contact');
  const { settings, loading } = useSettings();
  const s = settings?.store || {};
  const wa = waLink(s.whatsapp, 'Hello Al Noor Books,');
  const hasAny = s.phone || s.whatsapp || s.email || s.address || s.hours;

  return (
    <>
      <section className="page py-12 lg:py-16">
        <p className="eyebrow">Contact</p>
        <h1 className="heading-serif mt-3 text-3xl sm:text-4xl">We&rsquo;d love to hear from you</h1>
        <p className="mt-3 max-w-xl text-[15px] text-navy-700">Questions about an order, a product or a bulk quote? Reach out or visit the store.</p>

        <div id="visit" className="mt-9 grid scroll-mt-32 gap-4 sm:grid-cols-2">
          {loading ? null : !hasAny ? (
            <p className="text-sm text-muted sm:col-span-2">Store contact details will be available here soon.</p>
          ) : (
            <>
{s.address && (
  <Item icon={MapPin} title="Visit our store">
    <span className="whitespace-pre-line">
      {s.address} -{' '}
      <a
        className="underline"
        href="https://maps.app.goo.gl/AHrJCzFetqnxvBp87?g_st=ic"
        target="_blank"
        rel="noopener noreferrer"
      >
        View on Google Maps
      </a>
    </span>
  </Item>
)}              {s.hours && <Item icon={Clock} title="Opening hours">{s.hours}</Item>}
              {s.phone && <Item icon={Phone} title="Phone"><a className="link" href={`tel:${s.phone.replace(/[^\d+]/g, '')}`}>{s.phone}</a></Item>}
              {s.email && <Item icon={Mail} title="Email"><a className="link" href={`mailto:${s.email}`}>{s.email}</a></Item>}
            </>
          )}
        </div>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary mt-7 inline-flex bg-whatsapp hover:bg-whatsapp/90">
            <WhatsAppIcon size={18} /> Chat on WhatsApp
          </a>
        )}
      </section>
      <TrustStrip />
    </>
  );
}
