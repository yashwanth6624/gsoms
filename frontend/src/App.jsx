import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrderForm from './pages/OrderForm';
import OrderDetail from './pages/OrderDetail';
import StockScreen from './pages/StockScreen';
import InvoicePreview from './pages/InvoicePreview';
import InsightsPanel from './pages/InsightsPanel';

const AppContent = () => {
  const { user, loading, logout } = useAuth();
  // State-based routing with session persistence: 'dashboard', 'place-order', 'order-detail', 'stock', 'invoice-preview', 'insights'
  const [activePage, setActivePage] = useState(() => sessionStorage.getItem('activePage') || 'dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState(() => {
    const id = sessionStorage.getItem('selectedOrderId');
    return id ? parseInt(id, 10) : null;
  });
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('activePage', activePage);
  }, [activePage]);

  useEffect(() => {
    if (selectedOrderId !== null) {
      sessionStorage.setItem('selectedOrderId', selectedOrderId.toString());
    } else {
      sessionStorage.removeItem('selectedOrderId');
    }
  }, [selectedOrderId]);

  useEffect(() => {
    if (!user) {
      sessionStorage.removeItem('activePage');
      sessionStorage.removeItem('selectedOrderId');
    }
  }, [user]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'var(--background-color)',
        color: 'var(--primary-color)'
      }}>
        <h2>Loading session status...</h2>
      </div>
    );
  }

  // Intercept unauthenticated users
  if (!user) {
    return <Login />;
  }

  // Simple state router
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            setActivePage={setActivePage}
            setSelectedOrderId={setSelectedOrderId}
            showToast={showToast}
          />
        );
      case 'place-order':
        return (
          <OrderForm
            setActivePage={setActivePage}
            setSelectedOrderId={setSelectedOrderId}
            showToast={showToast}
          />
        );
      case 'order-detail':
        return (
          <OrderDetail
            orderId={selectedOrderId}
            user={user}
            setActivePage={setActivePage}
            setSelectedOrderId={setSelectedOrderId}
            showToast={showToast}
          />
        );
      case 'stock':
        if (user.role !== 'admin') {
          return (
            <Dashboard
              user={user}
              setActivePage={setActivePage}
              setSelectedOrderId={setSelectedOrderId}
              showToast={showToast}
            />
          );
        }
        return (
          <StockScreen
            user={user}
            setActivePage={setActivePage}
            showToast={showToast}
          />
        );
      case 'invoice-preview':
        return (
          <InvoicePreview
            orderId={selectedOrderId}
            setActivePage={setActivePage}
          />
        );
      case 'insights':
        if (user.role !== 'admin') {
          return (
            <Dashboard
              user={user}
              setActivePage={setActivePage}
              setSelectedOrderId={setSelectedOrderId}
              showToast={showToast}
            />
          );
        }
        return (
          <InsightsPanel
            user={user}
            setActivePage={setActivePage}
            showToast={showToast}
          />
        );
      default:
        return (
          <Dashboard
            user={user}
            setActivePage={setActivePage}
            setSelectedOrderId={setSelectedOrderId}
            showToast={showToast}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        user={user}
        onLogout={logout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      {sidebarOpen && <div className="sidebar-mobile-backdrop no-print" onClick={() => setSidebarOpen(false)}></div>}
      <main className="main-content">
        <header className="mobile-header no-print">
          <button className="mobile-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Toggle sidebar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <span className="mobile-brand">Manikanta Enterprises</span>
        </header>
        {renderPage()}
      </main>
      
      {/* Dynamic Toast Notifications (PART 2 Micro-interactions) */}
      <div className="toast-container no-print">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-dot">●</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
