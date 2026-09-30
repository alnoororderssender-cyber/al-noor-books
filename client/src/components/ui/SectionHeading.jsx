import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SectionHeading({ title, to, linkLabel = 'View All', as: Tag = 'h2', plain = false, className = '' }) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <Tag className={`font-serif text-xl font-bold text-navy sm:text-2xl ${plain ? '' : 'uppercase tracking-wide'}`}>{title}</Tag>
      {to && (
        <Link to={to} className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-navy-700 hover:underline">
          {linkLabel} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
