import { useEffect } from 'react';
import { X } from 'lucide-react';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl font-bold text-navy sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const TONES = {
  gray: 'bg-slate-100 text-slate-700',
  blue: 'bg-tint text-navy-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-danger',
};
export function Badge({ tone = 'gray', children }) {
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}

export const orderTone = { pending: 'amber', confirmed: 'blue', completed: 'green', cancelled: 'red' };
export const payTone = { pending: 'amber', submitted: 'blue', paid: 'green' };
export const payLabel = { pending: 'Pending', submitted: 'Screenshot received', paid: 'Paid' };

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy-900/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'} rounded bg-white p-6 shadow-xl`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-serif text-xl font-bold text-navy">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded text-navy-700 hover:bg-mist" aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', busy, onConfirm, onClose, children }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-navy-700">{message}</p>
      {children}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn-outline btn-sm" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className="btn-primary btn-sm !bg-danger hover:!bg-danger/90" onClick={onConfirm} disabled={busy}>{busy ? 'Working\u2026' : confirmLabel}</button>
      </div>
    </Modal>
  );
}
