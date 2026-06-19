import React, { useState } from 'react';
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
  // State-based routing: 'dashboard', 'place-order', 'order-detail', 'stock', 'invoice-preview', 'insights'
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [toasts, setToasts] = useState([]);

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
      />
      <main className="main-content">
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
