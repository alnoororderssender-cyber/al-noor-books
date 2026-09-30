import { Link } from 'react-router-dom';
import { AlertCircle, Loader2, PackageOpen } from 'lucide-react';

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin ${className}`} size={18} aria-hidden="true" />;
}

export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="grid min-h-[40vh] place-items-center text-navy-700" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm"><Spinner /> {label}&hellip;</div>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-200/70 ${className}`} aria-hidden="true" />;
}

export function ProductGridSkeleton({ count = 8, cols = 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' }) {
  return (
    <div className={`grid gap-4 ${cols}`} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-3">
          <Skeleton className="aspect-[5/4] w-full" />
          <Skeleton className="mt-3 h-3.5 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/3" />
          <Skeleton className="mt-3 h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = PackageOpen, title, message, action }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <Icon className="mx-auto text-navy-700/70" size={44} strokeWidth={1.4} />
      <h2 className="heading-serif mt-5 text-2xl">{title}</h2>
      {message && <p className="mt-2 text-sm text-muted">{message}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, homeLink = false }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center" role="alert">
      <AlertCircle className="mx-auto text-danger" size={40} strokeWidth={1.5} />
      <h2 className="heading-serif mt-5 text-2xl">{title}</h2>
      <p className="mt-2 text-sm text-muted">{message || 'Please try again in a moment.'}</p>
      <div className="mt-6 flex justify-center gap-3">
        {onRetry && <button type="button" className="btn-primary" onClick={onRetry}>Try again</button>}
        {homeLink && <Link to="/" className="btn-outline">Back to home</Link>}
      </div>
    </div>
  );
}

export function InlineAlert({ children, tone = 'error', className = '' }) {
  const tones = {
    error: 'border-danger/30 bg-red-50 text-danger',
    info: 'border-navy/15 bg-tint text-navy-700',
    success: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded border px-4 py-3 text-sm ${tones[tone]} ${className}`}>
      {children}
    </div>
  );
}
