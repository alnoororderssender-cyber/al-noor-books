import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAdminError, useAdminLoader } from '../../hooks/useAdmin';
import { useToast } from '../../context/ToastContext';
import { useDebounced } from '../../hooks/useDebounced';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDate, formatPrice } from '../../utils/format';
import { Badge, ConfirmDialog, PageHeader, orderTone, payLabel, payTone } from '../../components/admin/AdminUI';
import Pagination from '../../components/ui/Pagination';
import { ErrorState, PageLoader } from '../../components/ui/States';

export default function AdminOrders() {
  usePageTitle('Orders');
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim(), 300);
  const { data, loading, error, reload } = useAdminLoader(() => api.admin.orders({ page, q: dq, limit: 20 }), [page, dq]);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const fail = useAdminError();

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.admin.deleteOrder(toDelete._id);
      notify(`Order #${toDelete.orderId} deleted.`);
      setToDelete(null);
      if (data.orders.length === 1 && page > 1) setParams(page - 1 === 1 ? {} : { page: String(page - 1) });
      else reload();
    } catch (e) { fail(e); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Orders" subtitle={data ? `${data.total} order${data.total === 1 ? '' : 's'}` : ''} />
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input className="input pl-9" placeholder="Search by order ID, name or phone" value={q} onChange={(e) => { setQ(e.target.value); setParams({}); }} aria-label="Search orders" />
      </div>
      {error ? <ErrorState message={error.message} onRetry={reload} /> : loading && !data ? <PageLoader /> : data.orders.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">{dq ? 'No orders match your search.' : 'No orders yet. New orders will appear here.'}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted"><tr>
              <th className="px-4 py-3">Order</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {data.orders.map((o) => (
                <tr key={o._id} className="hover:bg-mist">
                  <td className="px-4 py-3 font-medium"><Link to={`/admin/orders/${o._id}`} className="text-navy hover:underline">#{o.orderId}</Link></td>
                  <td className="px-4 py-3 text-navy-700">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-navy-700">{o.customer.name}</td>
                  <td className="px-4 py-3 text-navy-700">{o.customer.phone}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(o.pricing.total)}</td>
                  <td className="px-4 py-3"><span className="text-navy-700">{o.payment.method === 'cod' ? 'COD' : 'Online'}</span> <Badge tone={payTone[o.payment.status]}>{payLabel[o.payment.status]}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={orderTone[o.status]}>{o.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setToDelete(o)} className="grid h-9 w-9 place-items-center rounded text-danger hover:bg-red-50" aria-label={`Delete order ${o.orderId}`}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toDelete && (
        <ConfirmDialog title="Delete this order?" message={`Order #${toDelete.orderId} from ${toDelete.customer.name} will be permanently deleted, including its payment screenshot. This can't be undone.`} confirmLabel="Delete order" busy={busy} onConfirm={doDelete} onClose={() => setToDelete(null)} />
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => setParams(n === 1 ? {} : { page: String(n) })} />}
    </>
  );
}
