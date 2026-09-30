import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] text-navy-700">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="text-muted">/</span>}
            {item.to ? <Link to={item.to} className="hover:underline">{item.label}</Link> : <span className="text-muted" aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
