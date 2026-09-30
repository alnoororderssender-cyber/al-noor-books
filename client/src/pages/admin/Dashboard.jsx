import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAdminLoader } from '../../hooks/useAdmin';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDate, formatPrice } from '../../utils/format';
import { Badge, PageHeader, StatCard, orderTone } from '../../components/admin/AdminUI';
import { ErrorState, PageLoader } from '../../components/ui/States';

export default function Dashboard() {
  usePageTitle('Dashboard');
  const { data, loading, error, reload } = useAdminLoader(() => api.admin.stats(), []);
  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="A quick look at your store." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Products" value={data.productCount} />
        <StatCard label="Total Categories" value={data.categoryCount} hint="Maximum 15" />
        <StatCard label="Delivery Charge" value={formatPrice(data.deliveryCharge)} />
        <StatCard label="Free Delivery Threshold" value={formatPrice(data.freeDeliveryThreshold)} />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-navy">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-navy-700 hover:underline">View all ({data.orderCount})</Link>
        </div>
        {data.recentOrders.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">No orders yet. New orders will appear here.</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {data.recentOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-mist">
                    <td className="px-4 py-3 font-medium"><Link to={`/admin/orders/${o._id}`} className="text-navy hover:underline">#{o.orderId}</Link></td>
                    <td className="px-4 py-3 text-navy-700">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 text-navy-700">{o.customer.name}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(o.pricing.total)}</td>
                    <td className="px-4 py-3"><Badge tone={orderTone[o.status]}>{o.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
