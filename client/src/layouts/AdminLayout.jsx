import { useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { CreditCard, LayoutDashboard, LogOut, Megaphone, Menu, Package, ShoppingBag, Store, Tags, Truck, X } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ToastProvider } from '../context/ToastContext';
import { PageLoader } from '../components/ui/States';
import Logo from '../components/ui/Logo';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/announcement', label: 'Announcement', icon: Megaphone },
  { to: '/admin/delivery', label: 'Delivery Settings', icon: Truck },
  { to: '/admin/payment', label: 'Payment Settings', icon: CreditCard },
  { to: '/admin/store', label: 'Store Info', icon: Store },
];

export default function AdminLayout() {
  const { admin, loading, logout } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  const sidebar = (
    <nav className="flex h-full flex-col bg-navy text-white" aria-label="Admin">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Logo light compact to="/admin" />
        <button type="button" className="text-white/80 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button>
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded px-3 py-2.5 text-sm ${isActive ? 'bg-white/10 font-semibold' : 'text-white/75 hover:bg-white/5 hover:text-white'}`}>
              <Icon size={18} strokeWidth={1.6} /> {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-t border-white/10 p-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className="block rounded px-3 py-2 text-sm text-white/75 hover:text-white">View store &rarr;</a>
        <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"><LogOut size={18} strokeWidth={1.6} /> Logout</button>
      </div>
    </nav>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-mist lg:grid lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-0 h-screen">{sidebar}</div></aside>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-navy-900/50" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 shadow-xl">{sidebar}</div>
          </div>
        )}
        <div className="min-w-0">
          <div className="flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
            <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded text-navy" aria-label="Open menu"><Menu size={22} /></button>
            <span className="font-serif text-base font-bold text-navy">Admin</span>
            <span className="w-10" />
          </div>
          <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><Outlet /></main>
        </div>
      </div>
    </ToastProvider>
  );
}
