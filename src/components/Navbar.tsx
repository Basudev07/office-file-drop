import React from 'react';
import { Share2, QrCode, LogOut, UploadCloud, LayoutDashboard } from 'lucide-react';
import { AppView } from '../types';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenQR: () => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  onSignOut: () => void;
  realtimeConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenQR,
  isAuthenticated,
  onOpenAuth,
  onSignOut,
  realtimeConnected,
}) => {
  // Triple-click on logo allows desk owner to open auth modal discreetly if not signed in
  const [logoClickCount, setLogoClickCount] = React.useState(0);

  const handleBrandClick = () => {
    if (isAuthenticated) {
      onNavigate('station');
    } else {
      const newCount = logoClickCount + 1;
      setLogoClickCount(newCount);
      if (newCount >= 3) {
        setLogoClickCount(0);
        onOpenAuth();
      } else {
        setTimeout(() => setLogoClickCount(0), 1500);
      }
    }
  };

  return (
    <header className="navbar">
      <div
        className="nav-brand"
        role="button"
        tabIndex={0}
        onClick={handleBrandClick}
        style={{ cursor: isAuthenticated ? 'pointer' : 'default' }}
        title={isAuthenticated ? 'Go to Station' : 'Office File Drop'}
      >
        <div className="brand-icon">
          <Share2 size={22} />
        </div>
        <div className="brand-text-wrap">
          <span className="brand-title">Office File Drop</span>
          <span className="nav-badge">{isAuthenticated && currentView === 'station' ? 'Station' : 'Drop'}</span>
        </div>
      </div>

      <div className="nav-actions">
        {/* Realtime Live Indicator */}
        <div
          className="status-pill"
          title={realtimeConnected ? 'Connected to desk receiver' : 'Connecting...'}
        >
          <span
            className="status-dot"
            style={{ backgroundColor: realtimeConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}
          />
          <span className="status-label hide-mobile">
            {realtimeConnected ? 'Live' : 'Connecting'}
          </span>
        </div>

        {/* Receiver Desk Owner Mode: Full Station Controls */}
        {isAuthenticated ? (
          <>
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`btn btn-sm ${currentView === 'station' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onNavigate('station')}
                title="Receiver Dashboard"
                aria-label="Receiver Dashboard"
              >
                <LayoutDashboard size={15} />
                <span className="hide-mobile">Station</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${currentView === 'drop' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onNavigate('drop')}
                title="Sender Drop Page"
                aria-label="Sender Drop Page"
              >
                <UploadCloud size={15} />
                <span className="hide-mobile">Drop</span>
              </button>
            </div>

            {/* QR Code Standee Button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenQR}
              title="Print Desk QR Code Standee"
              aria-label="Desk QR"
            >
              <QrCode size={15} />
              <span className="hide-mobile">Desk QR</span>
            </button>

            {/* Sign Out Button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onSignOut}
              title="Sign Out of Receiver Station"
              aria-label="Sign Out"
            >
              <LogOut size={15} />
              <span className="hide-mobile">Sign Out</span>
            </button>
          </>
        ) : (
          /* Sender Mode: Clean, zero-clutter navigation - NO receiver switcher or QR button */
          <button
            type="button"
            className="btn btn-secondary btn-sm desk-owner-subtle-btn"
            onClick={onOpenAuth}
            title="Desk Owner Portal"
            aria-label="Desk Owner Portal"
          >
            <span className="hide-mobile">Desk Owner</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
