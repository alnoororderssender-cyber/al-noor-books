import { useRef, useState } from 'react';
import { ImagePlus, Loader2, RefreshCw, Star, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { validateImageFile } from '../../utils/validation';

/**
 * Upload / preview / remove / replace for 1..max images. The first image is the primary one.
 * `images` = [{ url, publicId }]
 */
export default function ImageUploader({ images, onChange, max = 4, kind = 'product', error }) {
  const addRef = useRef(null);
  const replaceRef = useRef(null);
  const replaceIndex = useRef(-1);
  const [busy, setBusy] = useState(null); // { index|'new', progress }
  const [localError, setLocalError] = useState('');

  const upload = async (file, index) => {
    const msg = validateImageFile(file);
    if (msg) { setLocalError(`${file.name}: ${msg}`); return null; }
    setBusy({ index, progress: 0 });
    try {
      return await api.admin.uploadImage(file, kind, (progress) => setBusy({ index, progress }));
    } catch (e) {
      setLocalError(e.message || 'The image could not be uploaded.');
      return null;
    } finally {
      setBusy(null);
    }
  };

  const onAdd = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    setLocalError('');
    let next = [...images];
    for (const file of files.slice(0, max - images.length)) {
      // eslint-disable-next-line no-await-in-loop
      const res = await upload(file, 'new');
      if (res) { next = [...next, res]; onChange(next); }
    }
    if (files.length > max - images.length) setLocalError(`You can add up to ${max} image${max === 1 ? '' : 's'}.`);
  };

  const onReplace = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const i = replaceIndex.current;
    if (!file || i < 0) return;
    setLocalError('');
    const res = await upload(file, i);
    if (res) onChange(images.map((img, idx) => (idx === i ? res : img)));
  };

  const makePrimary = (i) => onChange([images[i], ...images.filter((_, idx) => idx !== i)]);
  const remove = (i) => onChange(images.filter((_, idx) => idx !== i));
  const shown = localError || error;
  const canAdd = images.length < max && !busy;

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <li key={img.url} className="card overflow-hidden">
            <div className="relative grid aspect-square place-items-center bg-mist">
              <img src={img.url} alt={`Image ${i + 1}`} className="h-full w-full object-contain p-2" />
              {i === 0 && max > 1 && <span className="absolute left-1.5 top-1.5 rounded bg-navy px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Primary</span>}
              {busy?.index === i && (
                <div className="absolute inset-0 grid place-items-center bg-white/80 text-sm text-navy"><span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {busy.progress}%</span></div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-line px-1 py-1">
              {i > 0 && max > 1 ? (
                <button type="button" className="grid h-8 w-8 place-items-center rounded text-navy-700 hover:bg-mist" onClick={() => makePrimary(i)} title="Make primary" aria-label={`Make image ${i + 1} primary`}><Star size={15} /></button>
              ) : <span className="h-8 w-8" />}
              <button type="button" className="grid h-8 w-8 place-items-center rounded text-navy-700 hover:bg-mist disabled:opacity-40" disabled={!!busy} onClick={() => { replaceIndex.current = i; replaceRef.current?.click(); }} title="Replace" aria-label={`Replace image ${i + 1}`}><RefreshCw size={15} /></button>
              <button type="button" className="grid h-8 w-8 place-items-center rounded text-danger hover:bg-red-50" onClick={() => remove(i)} title="Remove" aria-label={`Remove image ${i + 1}`}><Trash2 size={15} /></button>
            </div>
          </li>
        ))}
        {busy?.index === 'new' && (
          <li className="card grid aspect-square place-items-center bg-mist text-sm text-navy"><span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {busy.progress}%</span></li>
        )}
        {canAdd && (
          <li>
            <button type="button" onClick={() => addRef.current?.click()} className={`grid aspect-square w-full place-items-center rounded border border-dashed bg-white text-center text-navy-700 hover:bg-mist ${shown ? 'border-danger' : 'border-navy/40'}`}>
              <span className="flex flex-col items-center gap-1.5 px-2 text-xs"><ImagePlus size={24} strokeWidth={1.4} />Add image<span className="text-muted">{images.length}/{max}</span></span>
            </button>
          </li>
        )}
      </ul>
      <input ref={addRef} type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1} className="sr-only" onChange={onAdd} />
      <input ref={replaceRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onReplace} />
      <p className="mt-2 text-xs text-muted">JPG, PNG or WebP, up to 5 MB each.{max > 1 ? ` Up to ${max} images; the first is the primary image.` : ''}</p>
      {shown && <p className="field-error" role="alert">{shown}</p>}
    </div>
  );
}
