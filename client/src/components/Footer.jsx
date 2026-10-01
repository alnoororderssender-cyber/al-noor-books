import { Link } from 'react-router-dom';
import { Facebook, Instagram } from 'lucide-react';
import Logo from './ui/Logo';
import WhatsAppIcon from './ui/WhatsAppIcon';
import { useSettings } from '../context/SettingsContext';
import { waLink } from './WhatsAppBanner';

const COLUMNS = [
  { title: 'Shop', links: [{ label: 'All Products', to: '/products' }, { label: 'Categories', to: '/products' }] },
  { title: 'Company', links: [{ label: 'About', to: '/about' }, { label: 'Contact', to: '/contact' }] },
  { title: 'Support', links: [{ label: 'Delivery Information', to: '/about#delivery' }, { label: 'Payment Information', to: '/about#payment' }] },
];

export default function Footer() {
  const { settings } = useSettings();
  const s = settings?.store || {};
  const wa = waLink(s.whatsapp);
  const socials = [
    s.facebook && { href: s.facebook, label: 'Facebook', icon: <Facebook size={18} /> },
    s.instagram && { href: s.instagram, label: 'Instagram', icon: <Instagram size={18} /> },
    wa && { href: wa, label: 'WhatsApp', icon: <WhatsAppIcon size={18} /> },
  ].filter(Boolean);

  return (
    <footer className="border-t border-line bg-white">
      <div className="page grid gap-10 py-10 md:grid-cols-[1.4fr_2fr] lg:py-12">
        <div>
          <Logo />
          <p className="mt-3 max-w-[15rem] text-[13px] leading-relaxed text-muted">Quality stationery, books and everyday essentials from Al Noor Books.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-navy">{c.title}</h2>
              <ul className="mt-3 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}><Link to={l.to} className="text-[13px] text-muted hover:text-navy hover:underline">{l.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="page flex items-center justify-between py-4">
          <p className="text-xs text-muted">&copy; AL NOOR BOOKS</p>
          <Link to="/admin/login" className="text-[12px] text-muted hover:text-navy">
  Admin Portal
</Link>
          <div className="flex items-center gap-3 text-navy">
            {socials.map((x) => (
              <a key={x.label} href={x.href} target="_blank" rel="noopener noreferrer" aria-label={x.label} className="grid h-8 w-8 place-items-center rounded hover:bg-mist">{x.icon}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
