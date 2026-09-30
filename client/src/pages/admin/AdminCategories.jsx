import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAdminError, useAdminLoader } from '../../hooks/useAdmin';
import { useToast } from '../../context/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import ImageUploader from '../../components/admin/ImageUploader';
import { Badge, ConfirmDialog, Modal, PageHeader } from '../../components/admin/AdminUI';
import { ErrorState, InlineAlert, PageLoader, Spinner } from '../../components/ui/States';

function CategoryModal({ category, onClose, onSaved }) {
  const isNew = !category;
  const [name, setName] = useState(category?.name || '');
  const [images, setImages] = useState(category?.image ? [category.image] : []);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const fail = useAdminError();

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const errs = {};
    if (name.trim().length < 2) errs.name = 'Enter a category name.';
    if (images.length < 1) errs.image = 'Add an image.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setFormError('');
    try {
      const body = { name: name.trim(), image: images[0] };
      if (isNew) await api.admin.createCategory(body); else await api.admin.updateCategory(category._id, body);
      onSaved(isNew ? 'Category created.' : 'Category updated.');
    } catch (err) {
      if (err.status === 401) { fail(err); return; }
      setFormError(err.message); setErrors(err.errors || {}); setSaving(false);
    }
  };

  return (
    <Modal title={isNew ? 'Add category' : 'Edit category'} onClose={onClose} wide>
      <form onSubmit={submit} noValidate className="space-y-5">
        {formError && <InlineAlert>{formError}</InlineAlert>}
        <div>
          <label htmlFor="cname" className="label">Name <span className="text-danger">*</span></label>
          <input id="cname" className={`input ${errors.name ? 'input-error' : ''}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <span className="label">Image <span className="text-danger">*</span></span>
          <div className="max-w-[10rem]"><ImageUploader images={images} onChange={setImages} max={1} kind="category" error={errors.image} /></div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary btn-sm min-w-[110px]" disabled={saving}>{saving ? <Spinner /> : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminCategories() {
  usePageTitle('Categories');
  const { data, loading, error, reload } = useAdminLoader((s) => api.categories(s), []);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [deleting, setDeleting] = useState(null);
  const [blocked, setBlocked] = useState(null); // { message, productCount }
  const [moveTo, setMoveTo] = useState('');
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const fail = useAdminError();

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  const { categories, max } = data;
  const atLimit = categories.length >= max;

  const tryDelete = async () => {
    setBusy(true);
    try {
      await api.admin.deleteCategory(deleting._id);
      notify('Category deleted.'); setDeleting(null); reload();
    } catch (e) {
      if (e.status === 409) { setBlocked({ message: e.message, productCount: e.data?.productCount || 0 }); }
      else fail(e);
    } finally { setBusy(false); }
  };

  const moveAndDelete = async () => {
    if (!moveTo) return;
    setBusy(true);
    try {
      await api.admin.deleteCategory(deleting._id, moveTo);
      notify('Products moved and category deleted.'); setDeleting(null); setBlocked(null); setMoveTo(''); reload();
    } catch (e) { fail(e); } finally { setBusy(false); }
  };

  const closeDelete = () => { setDeleting(null); setBlocked(null); setMoveTo(''); };
  const others = categories.filter((c) => c._id !== deleting?._id);

  return (
    <>
      <PageHeader title="Categories" subtitle={`${categories.length} of ${max} used`}
        actions={<button type="button" className="btn-primary btn-sm" onClick={() => setEditing(null)} disabled={atLimit} title={atLimit ? `Maximum of ${max} categories reached` : undefined}><Plus size={16} /> Add category</button>} />
      {atLimit && <InlineAlert tone="info" className="mb-5">You&rsquo;ve reached the maximum of {max} categories. Delete one to add another.</InlineAlert>}

      {categories.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">No categories yet. Add your first one to start organising products.</div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c._id} className="card flex items-center gap-4 p-4">
              <img src={c.image?.url} alt="" className="h-16 w-16 shrink-0 rounded bg-mist object-contain p-1" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-navy">{c.name}</p>
                <p className="text-xs text-muted">{c.productCount} product{c.productCount === 1 ? '' : 's'}</p>
                {c.isDemo && <Badge>Demo</Badge>}
              </div>
              <button type="button" className="grid h-9 w-9 place-items-center rounded text-navy-700 hover:bg-mist" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}><Pencil size={16} /></button>
              <button type="button" className="grid h-9 w-9 place-items-center rounded text-danger hover:bg-red-50" onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`}><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}

      {editing !== undefined && <CategoryModal category={editing} onClose={() => setEditing(undefined)} onSaved={(m) => { notify(m); setEditing(undefined); reload(); }} />}

      {deleting && !blocked && (
        <ConfirmDialog title="Delete category?" message={`\u201c${deleting.name}\u201d will be deleted.`} busy={busy} onConfirm={tryDelete} onClose={closeDelete} />
      )}
      {deleting && blocked && (
        <Modal title="Category has products" onClose={closeDelete}>
          <p className="text-sm text-navy-700">{blocked.message}</p>
          <p className="mt-3 text-sm text-navy-700">Move them to another category to continue, or cancel and reassign them yourself.</p>
          {others.length === 0 ? (
            <InlineAlert tone="info" className="mt-4">Create another category first, then you can move these products.</InlineAlert>
          ) : (
            <div className="mt-4">
              <label htmlFor="moveTo" className="label">Move products to</label>
              <select id="moveTo" className="input" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                <option value="">Select category</option>
                {others.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className="btn-outline btn-sm" onClick={closeDelete} disabled={busy}>Cancel</button>
            <button type="button" className="btn-primary btn-sm !bg-danger" onClick={moveAndDelete} disabled={busy || !moveTo}>{busy ? 'Working\u2026' : 'Move products & delete'}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
