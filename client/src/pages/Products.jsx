import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';
import { siteConfig } from '../utils/siteConfig';
import ProductCard from '../components/ProductCard';
import TrustStrip from '../components/TrustStrip';
import Pagination from '../components/ui/Pagination';
import { EmptyState, ErrorState, ProductGridSkeleton } from '../components/ui/States';

const PAGE_SIZE = 16;
const PRICE_RANGES = [
  { value: '0-500', label: 'Under Rs. 500' },
  { value: '500-1000', label: 'Rs. 500 \u2013 Rs. 1,000' },
  { value: '1000-1500', label: 'Rs. 1,000 \u2013 Rs. 1,500' },
  { value: '1500-2500', label: 'Rs. 1,500 \u2013 Rs. 2,500' },
  { value: '2500-', label: 'Above Rs. 2,500' },
];
const SORTS = [
  { value: 'default', label: 'Default' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

const splitParam = (v) => (v ? v.split(',').filter(Boolean) : []);

function Checkbox({ checked, onChange, label, count }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[13.5px] text-navy-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 shrink-0 rounded-sm border-line accent-navy" />
      <span>{label}{count !== undefined && <span className="ml-1 text-muted">({count})</span>}</span>
    </label>
  );
}

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const selectedCats = splitParam(params.get('category'));
  const selectedPrices = splitParam(params.get('price'));
  const sort = params.get('sort') || 'default';
  const q = params.get('q') || '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  const cats = useAsync((signal) => api.categories(signal), []);
  const list = useAsync(
    (signal) => api.products({ category: selectedCats.join(','), price: selectedPrices.join(','), sort, q, page, limit: PAGE_SIZE }, signal),
    [selectedCats.join(','), selectedPrices.join(','), sort, q, page],
  );

  const categories = cats.data?.categories || [];
  const unknownCategory = useMemo(
    () => cats.data && selectedCats.length === 1 && !categories.some((c) => c.slug === selectedCats[0]),
    [cats.data, categories, selectedCats],
  );
  const activeCategory = selectedCats.length === 1 ? categories.find((c) => c.slug === selectedCats[0]) : null;
  usePageTitle(activeCategory?.name || (q ? `Search: ${q}` : 'Shop'));

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined || (Array.isArray(v) && v.length === 0)) next.delete(k);
      else next.set(k, Array.isArray(v) ? v.join(',') : v);
    });
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: false });
  };
  const toggle = (list_, value) => (list_.includes(value) ? list_.filter((v) => v !== value) : [...list_, value]);
  const hasFilters = selectedCats.length || selectedPrices.length || q;

  if (unknownCategory) {
    return (
      <div className="page py-10">
        <EmptyState title="Category not found" message="We couldn\u2019t find that category. It may have been renamed or removed."
          action={<Link to="/products" className="btn-primary">Browse all products</Link>} />
      </div>
    );
  }

  const filters = (
    <div className="space-y-7">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-navy">Category</h3>
        {cats.loading ? <p className="text-sm text-muted">Loading&hellip;</p> : categories.map((c) => (
          <Checkbox key={c._id} label={c.name} count={c.productCount} checked={selectedCats.includes(c.slug)} onChange={() => update({ category: toggle(selectedCats, c.slug) })} />
        ))}
      </div>
      <div className="border-t border-line pt-6">
        <h3 className="mb-2 text-sm font-semibold text-navy">Price Range</h3>
        {PRICE_RANGES.map((r) => (
          <Checkbox key={r.value} label={r.label} checked={selectedPrices.includes(r.value)} onChange={() => update({ price: toggle(selectedPrices, r.value) })} />
        ))}
      </div>
    </div>
  );

  const total = list.data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);

  return (
    <>
      {/* Page hero */}
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="page relative z-10 py-10 sm:py-14 lg:py-[68px]">
          <div className="max-w-[34rem]">
            <p className="eyebrow">Shop</p>
            <h1 className="heading-serif mt-3 text-[1.9rem] leading-[1.2] sm:text-4xl lg:text-[2.6rem]">
              {activeCategory ? activeCategory.name : q ? `Results for \u201c${q}\u201d` : 'Books, Stationery & More \u2014 All in One Place'}
            </h1>
            <p className="mt-3 text-[15px] text-navy-700 sm:text-base">Quality products for your study, work and everyday needs.</p>
          </div>
        </div>
        <img src={siteConfig.heroImage} alt="" className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover object-left lg:block" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-r from-white via-white/0 to-transparent lg:block" aria-hidden="true" />
      </section>

      <div className="page grid gap-8 py-8 lg:grid-cols-[200px_1fr] lg:gap-8 lg:py-10 xl:grid-cols-[220px_1fr]">
        {/* Filters */}
        <aside aria-label="Filters" className="lg:self-start">
          <button type="button" className="btn-outline btn-sm w-full justify-between lg:hidden" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}>
            <span className="inline-flex items-center gap-2"><SlidersHorizontal size={16} /> Filters {hasFilters ? '(active)' : ''}</span>
            <ChevronDown size={16} className={filtersOpen ? 'rotate-180' : ''} />
          </button>
          <div className={`${filtersOpen ? 'mt-4 block' : 'hidden'} rounded border border-line bg-mist/60 p-5 lg:mt-0 lg:block`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-navy">Filters</h2>
              {hasFilters ? <button type="button" onClick={() => setParams({})} className="text-xs text-navy-700 hover:underline">Clear All</button> : null}
            </div>
            {filters}
          </div>
        </aside>

        {/* Results */}
        <section aria-live="polite">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">{list.loading ? 'Loading products\u2026' : total === 0 ? 'No products' : `Showing ${from}\u2013${to} of ${total} product${total === 1 ? '' : 's'}`}</p>
            <label className="flex items-center gap-2 text-sm text-muted">
              Sort by:
              <select value={sort} onChange={(e) => update({ sort: e.target.value === 'default' ? '' : e.target.value })} className="h-10 rounded border border-line bg-white px-3 text-sm text-navy focus:border-navy-700 focus:outline-none">
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
          </div>

          {q && (
            <p className="mb-4 flex items-center gap-2 text-sm text-navy-700">
              Searching for &ldquo;{q}&rdquo;
              <button type="button" onClick={() => update({ q: '' })} className="inline-flex items-center gap-1 rounded border border-line px-2 py-0.5 text-xs hover:bg-mist"><X size={12} /> Clear</button>
            </p>
          )}

          {list.error ? (
            <ErrorState title="We couldn\u2019t load the products" message={list.error.message} onRetry={list.reload} />
          ) : list.loading ? (
            <ProductGridSkeleton count={8} />
          ) : list.data.products.length === 0 ? (
            <EmptyState title="No products found" message={hasFilters ? 'Try removing a filter or searching for something else.' : 'Products will appear here soon.'}
              action={hasFilters ? <button type="button" className="btn-primary" onClick={() => setParams({})}>Clear filters</button> : null} />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4 xl:grid-cols-4">
              {list.data.products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}

          {list.data && <Pagination page={list.data.page} pages={list.data.pages} onChange={(n) => { update({ page: n === 1 ? '' : String(n) }); window.scrollTo({ top: 0 }); }} />}
        </section>
      </div>

      <TrustStrip />
    </>
  );
}
