import { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, Search, ShoppingCart } from 'lucide-react';
import Logo from './ui/Logo';
import { useCart } from '../context/CartContext';
import SearchOverlay from './SearchOverlay';
import MobileMenu from './MobileMenu';
import { NAV_LINKS } from '../utils/siteConfig';

export default function Header() {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [location.pathname]);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="page flex h-16 items-center justify-between lg:h-[84px]">
        <Logo />

        <nav className="hidden items-center gap-9 md:flex lg:gap-12" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              className={({ isActive }) => `relative py-2 text-[15px] transition-colors ${isActive ? 'font-semibold text-navy' : 'text-navy-700 hover:text-navy'}`}>
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && <span className="absolute inset-x-0 -bottom-[13px] h-0.5 bg-navy lg:-bottom-[29px]" aria-hidden="true" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={() => setSearchOpen((v) => !v)} className="grid h-11 w-11 place-items-center rounded text-navy hover:bg-mist" aria-label="Search" aria-expanded={searchOpen}>
            <Search size={22} strokeWidth={1.7} />
          </button>
          <NavLink to="/cart" className="relative grid h-11 w-11 place-items-center rounded text-navy hover:bg-mist" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
            <ShoppingCart size={22} strokeWidth={1.7} />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-navy px-1 text-[10px] font-bold leading-none text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </NavLink>
          <button type="button" onClick={() => setMenuOpen(true)} className="grid h-11 w-11 place-items-center rounded text-navy hover:bg-mist md:hidden" aria-label="Open menu">
            <Menu size={24} strokeWidth={1.7} />
          </button>
        </div>
      </div>
      {searchOpen && <SearchOverlay onClose={closeSearch} />}
      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </header>
  );
}
