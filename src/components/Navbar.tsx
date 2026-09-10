import React from 'react';
import { Share2, QrCode, Lock, LogOut, UploadCloud, LayoutDashboard } from 'lucide-react';
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
  // Unauthenticated users are strictly senders
  const isSender = !isAuthenticated;

  return (
    <header className="navbar">
      <div
        className="nav-brand"
        role="button"
        onClick={() => {
          if (isAuthenticated) {
            onNavigate('receiver');
          }
        }}
        style={{ cursor: isAuthenticated ? 'pointer' : 'default' }}
      >
        <div className="brand-icon">
          <Share2 size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-title">Office File Drop</span>
            <span className="nav-badge">{isSender ? 'Drop' : 'Station'}</span>
          </div>
        </div>
      </div>

      <div className="nav-actions">
        {/* Realtime Live Indicator */}
        <div className="status-pill" title={realtimeConnected ? 'Connected to desk receiver' : 'Connecting...'}>
          <span
            className="status-dot"
            style={{ backgroundColor: realtimeConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}
          ></span>
          <span style={{ fontSize: '0.8rem' }} className="hide-mobile">
            {realtimeConnected ? 'Live' : 'Connecting'}
          </span>
        </div>

        {/* Sender Mode: Clean, zero-clutter navigation - NO receiver switcher or QR button */}
        {isSender ? (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenAuth}
            title="Desk Owner Sign In"
            aria-label="Desk Owner Sign In"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-muted)',
            }}
          >
            <Lock size={13} />
            <span className="hide-mobile">Desk Owner</span>
          </button>
        ) : (
          /* Receiver / Desk Owner Mode: Full Station Controls */
          <>
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '3px',
                borderRadius: 'var(--radius-md)',
                gap: '3px',
              }}
            >
              <button
                className={`btn btn-sm ${currentView === 'receiver' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onNavigate('receiver')}
                title="Receiver Dashboard"
                aria-label="Receiver Dashboard"
              >
                <LayoutDashboard size={15} />
                <span className="hide-mobile">Station</span>
              </button>
              <button
                className={`btn btn-sm ${currentView === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onNavigate('upload')}
                title="Sender Drop Page"
                aria-label="Sender Drop Page"
              >
                <UploadCloud size={15} />
                <span className="hide-mobile">Drop Page</span>
              </button>
            </div>

            {/* QR Code Standee Button (Only visible to authenticated desk owner) */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenQR}
              title="View & Print Desk QR Code Standee"
              aria-label="Desk QR"
            >
              <QrCode size={15} />
              <span className="hide-mobile">Desk QR</span>
            </button>

            {/* Sign Out Button */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={onSignOut}
              title="Sign Out of Receiver Mode"
              aria-label="Sign Out"
            >
              <LogOut size={15} />
              <span className="hide-mobile">Sign Out</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
