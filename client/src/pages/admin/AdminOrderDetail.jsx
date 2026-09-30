import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAdminError, useAdminLoader } from '../../hooks/useAdmin';
import { useToast } from '../../context/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDateTime, formatPrice } from '../../utils/format';
import { Badge, ConfirmDialog, PageHeader, orderTone } from '../../components/admin/AdminUI';
import { ErrorState, PageLoader } from '../../components/ui/States';

function Block({ title, children }) {
  return <section className="card p-5"><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>{children}</section>;
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAdminLoader(() => api.admin.order(id), [id]);
  const [order, setOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();
  const { notify } = useToast();
  const fail = useAdminError();
  usePageTitle(order ? `Order ${order.orderId}` : 'Order');

  useEffect(() => { if (data) setOrder(data); }, [data]);

  if (loading && !order) return <PageLoader />;
  if (error?.status === 404) return <ErrorState title="Order not found" message="This order doesn\u2019t exist." />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!order) return null;

  const update = async (changes) => {
    setSaving(true);
    try { setOrder(await api.admin.updateOrder(order._id, changes)); notify('Order updated.'); }
    catch (e) { fail(e); } finally { setSaving(false); }
  };
  const doDelete = async () => {
    setSaving(true);
    try { await api.admin.deleteOrder(order._id); notify(`Order #${order.orderId} deleted.`); navigate('/admin/orders', { replace: true }); }
    catch (e) { fail(e); setSaving(false); }
  };
  const p = order.payment;

  return (
    <>
      <PageHeader title={`Order #${order.orderId}`} subtitle={formatDateTime(order.createdAt)} actions={<><Link to="/admin/orders" className="btn-outline btn-sm">All orders</Link><button type="button" className="btn-danger btn-sm" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Delete order</button></>} />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Block title="Items">
            <ul className="divide-y divide-line">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  {i.image && <img src={i.image} alt="" className="h-14 w-14 rounded bg-mist object-contain p-1" />}
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium text-navy">{i.productNameSnapshot}</p>{i.selectedType && <p className="text-xs text-muted">Type: {i.selectedType}</p>}<p className="text-xs text-muted">{i.quantity} &times; {formatPrice(i.unitPrice)}</p></div>
                  <p className="text-sm font-medium">{formatPrice(i.subtotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.pricing.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.pricing.deliveryCharge === 0 ? 'FREE' : formatPrice(order.pricing.deliveryCharge)}</dd></div>
              <div className="flex justify-between font-serif text-lg font-bold text-navy"><dt>Total</dt><dd>{formatPrice(order.pricing.total)}</dd></div>
            </dl>
          </Block>

          <Block title="Payment">
            <p className="text-sm text-navy">{p.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
            {p.method === 'online' && (
              p.screenshotUrl ? (
                <div className="mt-3">
                  <a href={p.screenshotUrl} target="_blank" rel="noopener noreferrer" className="block max-w-xs overflow-hidden rounded border border-line bg-mist">
                    <img src={p.screenshotUrl} alt="Customer payment screenshot" className="max-h-96 w-full object-contain" />
                  </a>
                  <a href={p.screenshotUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-navy-700 hover:underline">Open full size <ExternalLink size={14} /></a>
                  <p className="mt-1 text-xs text-muted">Private link &mdash; it expires after a few minutes. Reload to get a fresh one.</p>
                </div>
              ) : <p className="mt-2 text-sm text-muted">No screenshot on file.</p>
            )}
          </Block>
        </div>

        <div className="space-y-5">
          <Block title="Status">
            <div className="space-y-4">
              <div>
                <label htmlFor="ostatus" className="label">Order status</label>
                <select id="ostatus" className="input" value={order.status} disabled={saving} onChange={(e) => update({ status: e.target.value })}>
                  {['pending', 'confirmed', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="pstatus" className="label">Payment status</label>
                <select id="pstatus" className="input" value={p.status} disabled={saving} onChange={(e) => update({ paymentStatus: e.target.value })}>
                  <option value="pending">Pending</option><option value="submitted">Screenshot received</option><option value="paid">Paid</option>
                </select>
              </div>
              <p className="text-xs text-muted">Owner notification: <Badge tone={order.notification?.status === 'failed' ? 'red' : 'gray'}>{order.notification?.status || 'pending'}</Badge>{order.notification?.error && <span className="mt-1 block">{order.notification.error}</span>}</p>
            </div>
          </Block>

          <Block title="Customer">
            <p className="text-sm font-medium text-navy">{order.customer.name}</p>
            <p className="mt-1 text-sm"><a className="link" href={`tel:${order.customer.phone}`}>{order.customer.phone}</a></p>
            <p className="mt-3 text-sm text-navy-700">{order.customer.cityArea}</p>
            <p className="text-sm text-navy-700">{order.customer.address}</p>
            {order.customer.note && <div className="mt-3 rounded bg-mist p-3 text-sm text-navy-700"><span className="block text-xs font-medium text-muted">Customer note</span>{order.customer.note}</div>}
          </Block>
          <p className="text-xs text-muted">Order status: <Badge tone={orderTone[order.status]}>{order.status}</Badge></p>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog title="Delete this order?" message={`Order #${order.orderId} will be permanently deleted, including its payment screenshot. This can't be undone.`} confirmLabel="Delete order" busy={saving} onConfirm={doDelete} onClose={() => setConfirmDelete(false)} />
      )}
    </>
  );
}
