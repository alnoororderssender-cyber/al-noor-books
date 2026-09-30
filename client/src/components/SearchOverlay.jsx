import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { api } from '../services/api';
import { useDebounced } from '../hooks/useDebounced';
import { formatPrice } from '../utils/format';
import { Spinner } from './ui/States';

export default function SearchOverlay({ onClose }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounced(q.trim(), 250);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (debounced.length < 2) { setResults(null); return undefined; }
    const ctrl = new AbortController();
    setLoading(true);
    api.products({ q: debounced, limit: 6 }, ctrl.signal)
      .then((r) => setResults(r.products))
      .catch(() => {})
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [debounced]);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/products?q=${encodeURIComponent(q.trim())}`);
    onClose();
  };

  return (
    <div className="absolute inset-x-0 top-full z-40 border-b border-line bg-white shadow-md" role="search">
      <div className="page py-4 sm:py-5">
        <form onSubmit={submit} className="flex items-center gap-3">
          <Search size={20} className="shrink-0 text-navy-700" aria-hidden="true" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search books, notebooks, pens\u2026" aria-label="Search products" className="h-11 flex-1 bg-transparent text-base text-ink placeholder:text-slate-400 focus:outline-none" maxLength={80} />
          {loading && <Spinner className="text-navy-700" />}
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded text-navy-700 hover:bg-mist" aria-label="Close search"><X size={20} /></button>
        </form>
        {results && (
          <div className="mt-2 border-t border-line pt-2">
            {results.length === 0 ? (
              <p className="py-4 text-sm text-muted">No products found for &ldquo;{debounced}&rdquo;.</p>
            ) : (
              <ul>
                {results.map((p) => (
                  <li key={p._id}>
                    <Link to={`/products/${p.slug}`} onClick={onClose} className="flex items-center gap-3 rounded px-1 py-2 hover:bg-mist">
                      <img src={p.images[0]?.url} alt="" className="h-12 w-12 rounded bg-mist object-contain p-1" />
                      <span className="flex-1 text-sm font-medium text-navy">{p.name}</span>
                      <span className="text-sm font-semibold text-navy">{formatPrice(p.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {results.length > 0 && (
              <button type="button" onClick={submit} className="mt-1 w-full py-2 text-left text-[13px] font-medium text-navy-700 hover:underline">
                See all results for &ldquo;{debounced}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
