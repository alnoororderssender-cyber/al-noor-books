import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md', label = 'Quantity' }) {
  const h = size === 'sm' ? 'h-9' : 'h-11';
  return (
    <div className={`inline-flex ${h} items-center rounded border border-line bg-white`} role="group" aria-label={label}>
      <button type="button" className="grid h-full w-9 place-items-center text-navy-700 hover:bg-mist disabled:opacity-40" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease quantity">
        <Minus size={15} />
      </button>
      <span className="w-9 select-none text-center text-sm font-medium" aria-live="polite">{value}</span>
      <button type="button" className="grid h-full w-9 place-items-center text-navy-700 hover:bg-mist disabled:opacity-40" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase quantity">
        <Plus size={15} />
      </button>
    </div>
  );
}
