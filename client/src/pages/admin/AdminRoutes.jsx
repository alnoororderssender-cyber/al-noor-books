import { Route, Routes } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import AdminLogin from './AdminLogin';
import Dashboard from './Dashboard';
import AdminProducts from './AdminProducts';
import ProductForm from './ProductForm';
import AdminCategories from './AdminCategories';
import AdminOrders from './AdminOrders';
import AdminOrderDetail from './AdminOrderDetail';
import { AnnouncementSettings, DeliverySettings, PaymentSettings, StoreSettings } from './SettingsPages';
import NotFound from '../NotFound';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="announcement" element={<AnnouncementSettings />} />
        <Route path="delivery" element={<DeliverySettings />} />
        <Route path="payment" element={<PaymentSettings />} />
        <Route path="store" element={<StoreSettings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
