import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { siteConfig } from '../utils/siteConfig';

export default function ContinueShoppingBanner() {
  return (
    <section className="relative overflow-hidden rounded border border-navy/10 bg-tint" aria-labelledby="continue-heading">
      <img src={siteConfig.bannerImage} alt="" className="absolute inset-y-0 right-0 hidden h-full w-3/5 object-cover object-right sm:block" />
      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        <h2 id="continue-heading" className="heading-serif text-2xl sm:text-3xl">Continue Shopping</h2>
        <p className="mt-2 max-w-sm text-sm text-navy-700 sm:text-[15px]">Discover more stationery, books and essentials for your everyday needs.</p>
        <Link to="/products" className="btn-primary btn-sm mt-5">Shop All Products <ArrowRight size={15} /></Link>
      </div>
    </section>
  );
}
