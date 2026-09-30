import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1);
  const box = 'grid h-9 min-w-9 place-items-center rounded border px-2 text-sm';
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      {page > 1 && (
        <button type="button" className={`${box} border-line text-navy-700 hover:border-navy`} onClick={() => onChange(page - 1)} aria-label="Previous page"><ArrowLeft size={16} /></button>
      )}
      {nums.map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}
          className={`${box} ${n === page ? 'border-navy bg-navy font-semibold text-white' : 'border-transparent text-navy-700 hover:border-line'}`}>
          {n}
        </button>
      ))}
      {page < pages && (
        <button type="button" className={`${box} border-line text-navy-700 hover:border-navy`} onClick={() => onChange(page + 1)} aria-label="Next page"><ArrowRight size={16} /></button>
      )}
    </nav>
  );
}
