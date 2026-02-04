import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import Robux from './pages/Robux';
import GameItems from './pages/GameItems';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Profile from './pages/Profile';
import MyOrders from './pages/MyOrders';
import Settings from './pages/Settings';
import Reviews from './pages/Reviews';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import './App.css';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Layout component without sidebar
const Layout = ({ children }) => {
  return (
    <main className="main-content full-width">
      {children}
    </main>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AdminAuthProvider>
          <Router>
            <ScrollToTop />
            <div className="app">
              <Header />
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalogo" element={<Catalogo />} />
                  <Route path="/robux" element={<Robux />} />
                  <Route path="/game/:gameSlug" element={<GameItems />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/orders" element={<MyOrders />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </Layout>
              <ChatWidget />
              <Footer />
            </div>
          </Router>
        </AdminAuthProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
