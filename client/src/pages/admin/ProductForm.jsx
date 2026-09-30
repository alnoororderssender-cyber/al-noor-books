import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAdminError, useAdminLoader } from '../../hooks/useAdmin';
import { useToast } from '../../context/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import ImageUploader from '../../components/admin/ImageUploader';
import { PageHeader } from '../../components/admin/AdminUI';
import { ErrorState, InlineAlert, PageLoader, Spinner } from '../../components/ui/States';

const MAX_TYPES = 5;
const empty = { name: '', categoryId: '', price: '', description: '', images: [], types: [], featured: false };

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id;
  usePageTitle(isNew ? 'New product' : 'Edit product');
  const navigate = useNavigate();
  const { notify } = useToast();
  const fail = useAdminError();

  const cats = useAdminLoader((s) => api.categories(s), []);
  const existing = useAdminLoader(() => (isNew ? Promise.resolve(null) : api.admin.product(id)), [id]);

  const [form, setForm] = useState(empty);
  const [typeDraft, setTypeDraft] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = existing.data;
    if (p) setForm({ name: p.name, categoryId: p.category?._id || '', price: String(p.price), description: p.description, images: p.images.map((i) => ({ url: i.url, publicId: i.publicId })), types: p.types, featured: !!p.featured });
  }, [existing.data]);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };

  const addType = () => {
    const t = typeDraft.trim();
    if (!t) return;
    if (form.types.length >= MAX_TYPES) { setErrors((e) => ({ ...e, types: `You can add up to ${MAX_TYPES} types.` })); return; }
    if (form.types.some((x) => x.toLowerCase() === t.toLowerCase())) { setTypeDraft(''); return; }
    set('types', [...form.types, t]);
    setTypeDraft('');
  };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter a product name.';
    if (!form.categoryId) e.categoryId = 'Choose a category.';
    if (!/^\d+$/.test(String(form.price).trim()) || Number(form.price) < 1) e.price = 'Enter a price in whole rupees.';
    if (!form.description.trim()) e.description = 'Enter a description.';
    if (form.images.length < 1) e.images = 'Add at least 1 image.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (saving) return;
    setFormError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { setFormError('Please fix the highlighted fields.'); return; }
    setSaving(true);
    const body = { name: form.name.trim(), categoryId: form.categoryId, price: Number(form.price), description: form.description.trim(), images: form.images, types: form.types, featured: form.featured };
    try {
      if (isNew) await api.admin.createProduct(body); else await api.admin.updateProduct(id, body);
      notify(isNew ? 'Product created.' : 'Product updated.');
      navigate('/admin/products');
    } catch (err) {
      if (err.status === 401) { fail(err); return; }
      setErrors(err.errors || {});
      setFormError(err.message);
      setSaving(false);
    }
  };

  if (cats.loading || existing.loading) return <PageLoader />;
  if (existing.error?.status === 404) return <ErrorState title="Product not found" message="It may have been deleted." homeLink={false} />;
  if (cats.error || existing.error) return <ErrorState message={(cats.error || existing.error).message} onRetry={() => { cats.reload(); existing.reload(); }} />;

  const categories = cats.data.categories;
  const cls = (k) => `input ${errors[k] ? 'input-error' : ''}`;

  return (
    <>
      <PageHeader title={isNew ? 'Add product' : 'Edit product'} actions={<Link to="/admin/products" className="btn-outline btn-sm">Back to products</Link>} />
      {categories.length === 0 ? (
        <InlineAlert tone="info">Create a category first, then you can add products. <Link to="/admin/categories" className="font-semibold underline">Go to categories</Link></InlineAlert>
      ) : (
        <form onSubmit={submit} noValidate className="card max-w-3xl space-y-6 p-5 sm:p-7">
          {formError && <InlineAlert>{formError}</InlineAlert>}
          <div>
            <label htmlFor="pname" className="label">Product Name <span className="text-danger">*</span></label>
            <input id="pname" className={cls('name')} value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={120} />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="pcat" className="label">Category <span className="text-danger">*</span></label>
              <select id="pcat" className={cls('categoryId')} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="field-error">{errors.categoryId}</p>}
            </div>
            <div>
              <label htmlFor="pprice" className="label">Price (Rs.) <span className="text-danger">*</span></label>
              <input id="pprice" inputMode="numeric" className={cls('price')} value={form.price} onChange={(e) => set('price', e.target.value.replace(/[^\d]/g, ''))} placeholder="e.g. 300" />
              {errors.price && <p className="field-error">{errors.price}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="pdesc" className="label">Description <span className="text-danger">*</span></label>
            <textarea id="pdesc" rows={6} className={cls('description')} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={5000} />
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>
          <div>
            <span className="label">Images <span className="text-danger">*</span></span>
            <ImageUploader images={form.images} onChange={(imgs) => set('images', imgs)} max={4} kind="product" error={errors.images} />
          </div>
          <div>
            <label htmlFor="ptype" className="label">Types <span className="font-normal text-muted">(optional, up to {MAX_TYPES})</span></label>
            <p className="mb-2 text-xs text-muted">Options such as English, Urdu or Math. All types share the same price. Customers must choose one before adding to cart.</p>
            <div className="flex gap-2">
              <input id="ptype" className="input" value={typeDraft} maxLength={40} onChange={(e) => setTypeDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addType(); } }} placeholder="Type name" disabled={form.types.length >= MAX_TYPES} />
              <button type="button" className="btn-outline shrink-0" onClick={addType} disabled={form.types.length >= MAX_TYPES}><Plus size={16} /> Add</button>
            </div>
            {form.types.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {form.types.map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5 rounded border border-line bg-mist py-1 pl-3 pr-1 text-sm text-navy">{t}
                    <button type="button" className="grid h-6 w-6 place-items-center rounded hover:bg-white" onClick={() => set('types', form.types.filter((x) => x !== t))} aria-label={`Remove ${t}`}><X size={14} /></button>
                  </li>
                ))}
              </ul>
            )}
            {errors.types && <p className="field-error">{errors.types}</p>}
          </div>
          <label className="flex items-center gap-2.5 text-sm text-navy-700">
            <input type="checkbox" className="h-4 w-4 accent-navy" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
            Show in &ldquo;Best Sellers&rdquo; on the home page
          </label>
          <div className="flex justify-end gap-3 border-t border-line pt-5">
            <Link to="/admin/products" className="btn-outline">Cancel</Link>
            <button type="submit" className="btn-primary min-w-[140px]" disabled={saving}>{saving ? <><Spinner /> Saving&hellip;</> : isNew ? 'Create product' : 'Save changes'}</button>
          </div>
        </form>
      )}
    </>
  );
}
