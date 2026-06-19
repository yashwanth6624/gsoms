import React from 'react';

const Sidebar = ({ activePage, setActivePage, user, onLogout, isOpen, setIsOpen }) => {
  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const handleNavigate = (page) => {
    setActivePage(page);
    if (setIsOpen) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <button className="sidebar-close-btn no-print" onClick={() => setIsOpen(false)} aria-label="Close sidebar">✕</button>
      
      <div className="sidebar-brand">
        Manikanta Enterprises
        <span className="sidebar-brand-sub">Order & Supply Portal</span>
      </div>
      
      <ul className="sidebar-menu">
        {/* Dashboard Link for everyone */}
        <li className="sidebar-item">
          <a
            onClick={() => handleNavigate('dashboard')}
            className={`sidebar-link ${activePage === 'dashboard' || activePage === 'order-detail' || activePage === 'invoice-preview' ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            Dashboard
          </a>
        </li>

        {/* Customer Only Links */}
        {!isAdmin && (
          <li className="sidebar-item">
            <a
              onClick={() => handleNavigate('place-order')}
              className={`sidebar-link ${activePage === 'place-order' ? 'active' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Place Order
            </a>
          </li>
        )}

        {/* Admin Only Links */}
        {isAdmin && (
          <>
            <li className="sidebar-item">
              <a
                onClick={() => handleNavigate('stock')}
                className={`sidebar-link ${activePage === 'stock' ? 'active' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1M18.75 3v18M7.5 12h-.008v-.008H7.5V12Zm3 0h-.008v-.008H10.5V12Zm-3 3h-.008v-.008H7.5V15Zm3 0h-.008v-.008H10.5V15Z" />
                </svg>
                Warehouse Stock
              </a>
            </li>
            
            <li className="sidebar-item">
              <a
                onClick={() => handleNavigate('insights')}
                className={`sidebar-link ${activePage === 'insights' ? 'active' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                </svg>
                Insights Panel
              </a>
            </li>
          </>
        )}
      </ul>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="sidebar-user-name">{user.name}</span>
          <span className="sidebar-user-role">{user.role}</span>
        </div>
        <a onClick={onLogout} className="sidebar-link" style={{ marginTop: '0.5rem', color: '#FCA5A5' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          Logout
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
