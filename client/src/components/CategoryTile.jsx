import { Link } from 'react-router-dom';

export default function CategoryTile({ category }) {
  return (
    <Link to={`/products?category=${category.slug}`} className="card group block overflow-hidden transition-shadow hover:shadow-md">
      <div className="grid aspect-[1/0.92] place-items-center bg-mist">
        <img src={category.image?.url} alt="" loading="lazy" className="h-full w-full object-contain p-3" />
      </div>
      <p className="border-t border-line px-2 py-3 text-center text-[13px] font-semibold text-navy sm:text-sm">{category.name}</p>
    </Link>
  );
}
