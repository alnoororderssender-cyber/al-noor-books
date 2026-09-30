import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cartItemFromProduct, useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const hasTypes = product.types?.length > 0;
  const to = `/products/${product.slug}`;

  const onAdd = () => {
    if (hasTypes) {
      navigate(to); // the customer must choose a type first
      return;
    }
    add(cartItemFromProduct(product), 1);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="card flex h-full flex-col p-3 sm:p-3.5">
      <Link to={to} className="block" aria-label={product.name}>
        <div className="grid aspect-[5/4] place-items-center overflow-hidden bg-mist">
          <img src={product.images[0]?.url} alt={product.name} loading="lazy" className="h-full w-full object-contain p-2" />
        </div>
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="text-[13px] font-semibold leading-snug text-navy sm:text-sm">
          <Link to={to} className="hover:underline">{product.name}</Link>
        </h3>
        {product.category?.name && <p className="mt-1 text-xs text-muted">{product.category.name}</p>}
        <div className="mt-auto pt-2">
          <p className="text-sm font-bold text-navy">{formatPrice(product.price)}</p>
          <button type="button" onClick={onAdd} className="btn-primary btn-sm mt-3 w-full" aria-live="polite">
            {added ? <><Check size={15} /> Added</> : hasTypes ? 'Select Options' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
