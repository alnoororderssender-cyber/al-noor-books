import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import StoreLayout from './layouts/StoreLayout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { PageLoader } from './components/ui/States';

// The admin area is only downloaded when it is visited.
const AdminRoutes = lazy(() => import('./pages/admin/AdminRoutes'));

function CategoryRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/products?category=${encodeURIComponent(slug)}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:slug" element={<ProductDetail />} />
        <Route path="category/:slug" element={<CategoryRedirect />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="admin/*" element={
        <AdminAuthProvider><Suspense fallback={<PageLoader />}><AdminRoutes /></Suspense></AdminAuthProvider>
      } />
    </Routes>
  );
}
