import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAdminError, useAdminLoader } from '../../hooks/useAdmin';
import { useToast } from '../../context/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatPrice } from '../../utils/format';
import { Badge, ConfirmDialog, PageHeader } from '../../components/admin/AdminUI';
import { ErrorState, PageLoader } from '../../components/ui/States';

export default function AdminProducts() {
  usePageTitle('Products');
  const { data, loading, error, reload } = useAdminLoader(() => api.products({ limit: 100, sort: 'newest' }), []);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const fail = useAdminError();

  const doDelete = async () => {
    setBusy(true);
    try { await api.admin.deleteProduct(toDelete._id); notify('Product deleted.'); setToDelete(null); reload(); }
    catch (e) { fail(e); } finally { setBusy(false); }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Products" subtitle={`${data.total} product${data.total === 1 ? '' : 's'}`} actions={<Link to="/admin/products/new" className="btn-primary btn-sm"><Plus size={16} /> Add product</Link>} />
      {data.products.length === 0 ? (
        <div className="card p-10 text-center"><p className="text-sm text-muted">No products yet.</p><Link to="/admin/products/new" className="btn-primary btn-sm mt-4">Add your first product</Link></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Types</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-line">
              {data.products.map((p) => (
                <tr key={p._id} className="hover:bg-mist">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]?.url} alt="" className="h-12 w-12 rounded bg-mist object-contain p-1" />
                      <div><p className="font-medium text-navy">{p.name}</p><div className="mt-0.5 flex gap-1.5">{p.isDemo && <Badge>Demo</Badge>}{p.featured && <Badge tone="blue">Featured</Badge>}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-navy-700">{p.category?.name || '\u2014'}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-navy-700">{p.types.length ? p.types.length : '\u2014'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/products/${p._id}`} className="grid h-9 w-9 place-items-center rounded text-navy-700 hover:bg-white" aria-label={`Edit ${p.name}`}><Pencil size={16} /></Link>
                      <button type="button" onClick={() => setToDelete(p)} className="grid h-9 w-9 place-items-center rounded text-danger hover:bg-red-50" aria-label={`Delete ${p.name}`}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toDelete && (
        <ConfirmDialog title="Delete product?" message={`\u201c${toDelete.name}\u201d will be removed from the store. Past orders keep their details.`} busy={busy} onConfirm={doDelete} onClose={() => setToDelete(null)} />
      )}
    </>
  );
}
