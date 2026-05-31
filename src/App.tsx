import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Collection from './pages/Collection';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import Contact from './pages/Contact';
import ReturnPolicy from './pages/ReturnPolicy';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import About from './pages/About';
import NotFound from './pages/NotFound';
import Account from './pages/Account';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';
import StockNotification from './components/StockNotification';
import NewsletterPopup from './components/NewsletterPopup';
import ErrorBoundary from './components/ErrorBoundary';
import { AnimatePresence } from 'motion/react';

// Admin imports
import AdminLogin from './admin/pages/AdminLogin';
import Dashboard from './admin/pages/Dashboard';
import ProductList from './admin/pages/ProductList';
import ProductForm from './admin/pages/ProductForm';
import OrderList from './admin/pages/OrderList';
import OrderDetail from './admin/pages/OrderDetail';
import PaymentList from './admin/pages/PaymentList';
import PaymentDetail from './admin/pages/PaymentDetail';
import CouponList from './admin/pages/CouponList';
import CustomerList from './admin/pages/CustomerList';
import Reports from './admin/pages/Reports';
import RefundList from './admin/pages/RefundList';
import AdminLayout from './admin/components/AdminLayout';
import AdminAuthGuard from './admin/components/AdminAuthGuard';
import { AdminAuthProvider } from './admin/context/AdminAuthContext';

/** Scroll to top on route change */
const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, search]);
  
  return null;
};

/** Storefront layout wrapper — renders Navbar and Footer around page content */
const StorefrontLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col selection:bg-accent selection:text-white">
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/about" element={<About />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<Success />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/account" element={<Account />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/return-policy" element={<ReturnPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

/** Admin routes wrapper — renders admin pages without storefront Navbar/Footer */
const AdminRoutes: React.FC = () => {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route index element={<Navigate to="/admin/login" replace />} />
        <Route
          element={
            <AdminAuthGuard>
              <AdminLayout />
            </AdminAuthGuard>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="payments" element={<PaymentList />} />
          <Route path="payments/:id" element={<PaymentDetail />} />
          <Route path="coupons" element={<CouponList />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="reports" element={<Reports />} />
          <Route path="refunds" element={<RefundList />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <RecentlyViewedProvider>
              <Router>
                <Routes>
                  {/* Admin routes — no Navbar/Footer */}
                  <Route path="/admin/*" element={<AdminRoutes />} />

                  {/* Storefront routes — with Navbar/Footer */}
                  <Route path="*" element={<StorefrontLayout />} />
                </Routes>
              </Router>
              <StockNotification />
              <NewsletterPopup />
            </RecentlyViewedProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
