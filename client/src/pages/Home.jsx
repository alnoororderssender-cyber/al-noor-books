import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';
import { siteConfig } from '../utils/siteConfig';
import TrustStrip from '../components/TrustStrip';
import SectionHeading from '../components/ui/SectionHeading';
import CategoryTile from '../components/CategoryTile';
import ProductCard from '../components/ProductCard';
import WhatsAppBanner from '../components/WhatsAppBanner';
import { ProductGridSkeleton, Skeleton } from '../components/ui/States';

export default function Home() {
  usePageTitle('');
  const cats = useAsync((signal) => api.categories(signal), []);
  const best = useAsync(async (signal) => {
    const featured = await api.products({ featured: 'true', limit: 6 }, signal);
    if (featured.products.length > 0) return featured.products;
    return (await api.products({ sort: 'newest', limit: 6 }, signal)).products;
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="page relative z-10 grid lg:min-h-[470px] lg:grid-cols-2">
          <div className="flex flex-col justify-center py-10 sm:py-14 lg:py-16 lg:pr-8">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-navy-700">Al Noor Books</p>
            <h1 className="mt-4 font-sans text-[2.5rem] font-bold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-[3.4rem]">
              Everything you need, all in one place.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-navy-700 sm:text-lg">
              Quality stationery, books and everyday essentials from Al Noor Books.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="btn-primary h-12 px-7 text-[13px] uppercase tracking-wider">Shop Now <ArrowRight size={16} /></Link>
              <Link to="/contact#visit" className="btn-outline h-12 px-7 text-[13px] uppercase tracking-wider">Visit Our Store</Link>
            </div>
          </div>
        </div>
        <img src={siteConfig.heroImage} alt="" className="h-64 w-full object-cover sm:h-80 lg:absolute lg:inset-y-0 lg:right-0 lg:h-full lg:w-1/2" />
      </section>

      <TrustStrip />

      {/* Categories */}
      <section className="page py-12 lg:py-16" aria-labelledby="cat-heading">
        <SectionHeading title="Shop by Category" to="/products" as="h2" />
        <span id="cat-heading" className="sr-only">Shop by category</span>
        {cats.loading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[1/1.1]" />)}
          </div>
        ) : cats.error ? (
          <p className="mt-6 text-sm text-muted">Categories couldn&rsquo;t be loaded right now.</p>
        ) : cats.data.categories.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Categories will appear here soon.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {cats.data.categories.slice(0, 12).map((c) => <CategoryTile key={c._id} category={c} />)}
          </div>
        )}
      </section>

      {/* Best sellers */}
      <section className="page pb-12 lg:pb-16" aria-labelledby="best-heading">
        <SectionHeading title="Best Sellers" to="/products" />
        <span id="best-heading" className="sr-only">Best sellers</span>
        <div className="mt-6">
          {best.loading ? (
            <ProductGridSkeleton count={6} cols="grid-cols-2 md:grid-cols-3 lg:grid-cols-6" />
          ) : best.error ? (
            <p className="text-sm text-muted">Products couldn&rsquo;t be loaded right now. Please refresh the page.</p>
          ) : best.data.length === 0 ? (
            <p className="text-sm text-muted">Products will appear here soon.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 lg:gap-4">
              {best.data.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Physical store */}
      <section className="grid bg-tint/70 md:grid-cols-[1fr_1.15fr]" aria-labelledby="store-heading">
        <div className="flex items-center px-5 py-12 md:px-8 lg:pl-[max(3rem,calc((100vw-1320px)/2+3rem))] lg:pr-12">
          <div>
            <div className="mb-5 h-0.5 w-10 bg-navy" aria-hidden="true" />
            <h2 id="store-heading" className="font-serif text-3xl font-bold uppercase leading-tight tracking-wide text-navy lg:text-4xl">A store you<br />already know.</h2>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-navy-700">From everyday stationery to school and office essentials, Al Noor Books brings the familiar store experience online.</p>
            <Link to="/contact#visit" className="btn-primary btn-sm mt-6 uppercase tracking-wider">Visit Our Store <ArrowRight size={15} /></Link>
          </div>
        </div>
        <img src={siteConfig.storeImage} alt="" className="h-64 w-full object-cover md:h-full md:min-h-[300px]" loading="lazy" />
      </section>

      <WhatsAppBanner />
    </>
  );
}
