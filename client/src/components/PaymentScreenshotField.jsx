import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { validateImageFile } from '../utils/validation';

/** Required payment-proof upload. Mobile users can pick from the gallery or take a photo. */
export default function PaymentScreenshotField({ file, onChange, error }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!file) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f) => {
    if (!f) return;
    const msg = validateImageFile(f);
    setLocalError(msg);
    onChange(msg ? null : f);
    if (inputRef.current) inputRef.current.value = '';
  };
  const shown = localError || error;

  return (
    <div>
      <label htmlFor="screenshot" className="label">Payment Screenshot <span className="text-danger">*</span></label>
      {file ? (
        <div className="flex items-center gap-4 rounded border border-line bg-white p-3">
          <img src={preview} alt="Payment screenshot preview" className="h-20 w-20 rounded bg-mist object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-navy">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</p>
            <button type="button" className="mt-1 text-[13px] text-navy-700 underline" onClick={() => inputRef.current?.click()}>Replace</button>
          </div>
          <button type="button" onClick={() => { onChange(null); setLocalError(''); }} className="grid h-9 w-9 place-items-center rounded text-navy-700 hover:bg-mist" aria-label="Remove screenshot"><X size={18} /></button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded border border-dashed bg-white px-4 py-8 text-center hover:bg-mist ${shown ? 'border-danger' : 'border-navy/40'}`}>
          <ImagePlus size={30} strokeWidth={1.4} className="text-navy-700" />
          <span className="text-sm font-medium text-navy">Tap to upload your payment screenshot</span>
          <span className="text-xs text-muted">JPG, PNG or WebP, up to 5 MB</span>
        </button>
      )}
      <input id="screenshot" ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      {shown && <p className="field-error" role="alert">{shown}</p>}
    </div>
  );
}
