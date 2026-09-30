import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import Logo from './ui/Logo';
import { NAV_LINKS } from '../utils/siteConfig';

export default function MobileMenu({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-navy-900/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label="Menu" className={`absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-white shadow-xl transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Logo />
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded text-navy hover:bg-mist" aria-label="Close menu"><X size={22} /></button>
        </div>
        <nav className="flex flex-col px-5 py-4" aria-label="Mobile">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={onClose}
              className={({ isActive }) => `border-b border-line py-4 text-base font-medium ${isActive ? 'text-navy' : 'text-navy-700'}`}>
              {({ isActive }) => <span className={isActive ? 'border-b-2 border-navy pb-1' : ''}>{l.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}
