import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Link2, ShoppingCart } from 'lucide-react';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';
import { cartItemFromProduct, useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import ImageGallery from '../components/ImageGallery';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import QuantityStepper from '../components/ui/QuantityStepper';
import TrustStrip from '../components/TrustStrip';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/ui/SectionHeading';
import { EmptyState, ErrorState, InlineAlert, Skeleton } from '../components/ui/States';

function DetailSkeleton() {
  return (
    <div className="page grid gap-10 py-10 md:grid-cols-2" aria-busy="true">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4"><Skeleton className="h-9 w-3/4" /><Skeleton className="h-4 w-1/4" /><Skeleton className="h-7 w-1/5" /><Skeleton className="h-24 w-full" /><Skeleton className="h-12 w-full" /></div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { data: product, loading, error, reload } = useAsync((signal) => api.product(slug, signal), [slug]);
  const related = useAsync(
    async (signal) => (product ? (await api.products({ category: product.category?.slug, exclude: product.slug, limit: 5 }, signal)).products : []),
    [product?._id],
  );

  const [type, setType] = useState('');
  const [qty, setQty] = useState(1);
  const [typeError, setTypeError] = useState(false);
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef();
  usePageTitle(product?.name);

  useEffect(() => { setType(''); setQty(1); setTypeError(false); setAdded(false); }, [slug]);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (loading) return <DetailSkeleton />;
  if (error?.status === 404) {
    return <div className="page py-10"><EmptyState title="Product not found" message="This product may have been removed or the link is incorrect." action={<Link to="/products" className="btn-primary">Browse all products</Link>} /></div>;
  }
  if (error) return <div className="page py-10"><ErrorState title="We couldn\u2019t load this product" message={error.message} onRetry={reload} /></div>;

  const hasTypes = product.types.length > 0;

  const addToCart = () => {
    if (hasTypes && !type) { setTypeError(true); return false; }
    add(cartItemFromProduct(product, type), qty);
    return true;
  };
  const onAdd = () => {
    if (!addToCart()) return;
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2000);
  };
  const onBuyNow = () => { if (addToCart()) navigate('/checkout'); };
  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    } catch { /* user cancelled */ }
  };

  return (
    <>
      <div className="page pt-6 lg:pt-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: product.category?.name || 'Shop', to: product.category ? `/products?category=${product.category.slug}` : '/products' }, { label: product.name }]} />

        <div className="mt-5 grid gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
          <ImageGallery images={product.images} alt={product.name} />

          <div>
            <h1 className="heading-serif text-[1.75rem] leading-tight sm:text-4xl">{product.name}</h1>
            {product.category && <p className="mt-2 text-sm text-muted">{product.category.name}</p>}
            <p className="mt-3 font-serif text-2xl font-bold text-navy">{formatPrice(product.price)}</p>

            <p className="mt-4 line-clamp-4 whitespace-pre-line text-[15px] leading-relaxed text-navy-700">{product.description}</p>

            {hasTypes && (
              <fieldset className="mt-6">
                <legend className="text-sm font-medium text-ink">Type{type && <span className="ml-1.5 font-normal text-muted">&mdash; {type}</span>}</legend>
                <div className="mt-2.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Product type">
                  {product.types.map((t) => (
                    <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => { setType(t); setTypeError(false); }}
                      className={`h-10 rounded border px-4 text-sm transition-colors ${type === t ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy-700 hover:border-navy'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {typeError && <p className="field-error" role="alert">Please choose a type before adding to cart.</p>}
              </fieldset>
            )}

            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-ink">Quantity</p>
              <QuantityStepper value={qty} onChange={setQty} />
            </div>

            <div className="mt-6 space-y-3">
              <button type="button" onClick={onAdd} className="btn-primary h-12 w-full text-[15px]" aria-live="polite">
                {added ? <><Check size={18} /> Added to cart</> : <><ShoppingCart size={18} /> Add to Cart</>}
              </button>
              <button type="button" onClick={onBuyNow} className="btn-outline h-12 w-full text-[15px]">Buy Now</button>
              {added && <InlineAlert tone="success">Added to your cart. <Link to="/cart" className="font-semibold underline">View cart</Link></InlineAlert>}
            </div>

            <button type="button" onClick={onShare} className="mt-5 inline-flex items-center gap-2 text-sm text-navy-700 hover:underline">
              <Link2 size={16} /> {copied ? 'Link copied' : 'Share'}
            </button>
          </div>
        </div>
      </div>

      <div className="page mt-12"><TrustStrip variant="boxed" /></div>

      <section className="page mt-12" aria-labelledby="desc-heading">
        <div className="border-b border-line"><h2 id="desc-heading" className="inline-block border-b-2 border-navy pb-3 text-[15px] font-semibold text-navy">Description</h2></div>
        <div className="card mt-0 rounded-t-none border-t-0 p-6 sm:p-8">
          <h3 className="heading-serif text-xl">Product Description</h3>
          <p className="mt-3 max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-navy-700">{product.description}</p>
        </div>
      </section>

      {related.data?.length > 0 && (
        <section className="page my-14" aria-labelledby="rel-heading">
          <SectionHeading title="Related Products" plain to={product.category ? `/products?category=${product.category.slug}` : '/products'} />
          <span id="rel-heading" className="sr-only">Related products</span>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {related.data.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
