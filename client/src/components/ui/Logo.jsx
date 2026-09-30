import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function Logo({ className = '', to = '/', light = false, compact = false }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 sm:gap-2.5 ${className}`} aria-label="Al Noor Books - home">
      <BookOpen className={`${compact ? 'h-6 w-6' : 'h-7 w-7 sm:h-[34px] sm:w-[34px]'} shrink-0 ${light ? 'text-white' : 'text-navy'}`} strokeWidth={1.6} />
      <span className={`whitespace-nowrap font-serif font-bold leading-none tracking-tight ${compact ? 'text-base' : 'text-[1.1rem] sm:text-[1.6rem]'} ${light ? 'text-white' : 'text-navy'}`}>
        AL NOOR BOOKS
      </span>
    </Link>
  );
}
