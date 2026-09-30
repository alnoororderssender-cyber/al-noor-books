import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

function Row({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard unavailable */ }
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="break-all text-sm font-medium text-navy">{value}</dd>
      </div>
      <button type="button" onClick={copy} className="inline-flex shrink-0 items-center gap-1 rounded border border-line px-2.5 py-1.5 text-xs text-navy-700 hover:bg-mist" aria-label={`Copy ${label}`}>
        {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
      </button>
    </div>
  );
}

/** Payment account details configured by the admin (never hardcoded). */
export default function PaymentDetails({ info }) {
  const jazz = info.jazzCashNumber || info.jazzCashTitle;
  const bank = info.accountNumber || info.iban || info.bankName;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {jazz && (
        <div className="rounded border border-line bg-white p-4">
          <h4 className="font-serif text-base font-bold text-navy">JazzCash</h4>
          <dl className="mt-1 divide-y divide-line">
            <Row label="Account title" value={info.jazzCashTitle} />
            <Row label="Number" value={info.jazzCashNumber} />
          </dl>
        </div>
      )}
      {bank && (
        <div className="rounded border border-line bg-white p-4">
          <h4 className="font-serif text-base font-bold text-navy">Bank Transfer</h4>
          <dl className="mt-1 divide-y divide-line">
            <Row label="Account title" value={info.bankTitle} />
            <Row label="Bank" value={info.bankName} />
            <Row label="Account number" value={info.accountNumber} />
            <Row label="IBAN" value={info.iban} />
          </dl>
        </div>
      )}
    </div>
  );
}
