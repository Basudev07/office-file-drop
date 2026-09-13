import React from 'react';
import { QrCode, RefreshCw, Clock } from 'lucide-react';

interface StationHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onOpenQR: () => void;
  onCleanupExpired: () => void;
}

export const StationHeader: React.FC<StationHeaderProps> = ({
  loading,
  onRefresh,
  onOpenQR,
  onCleanupExpired,
}) => {
  return (
    <div className="dashboard-header">
      <div className="dashboard-title-group">
        <h1>Receiver Station</h1>
        <p>Files dropped from colleagues appear here instantly in real time.</p>
      </div>

      <div className="station-actions-toolbar">
        <button
          type="button"
          className="btn btn-secondary btn-touch"
          onClick={onOpenQR}
          title="Open printable permanent QR standee"
        >
          <QrCode size={15} />
          <span className="hide-mobile">Show Desk QR Standee</span>
          <span className="show-mobile">Desk QR</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-touch"
          onClick={onRefresh}
          disabled={loading}
          title="Synchronize file list from database"
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Sync</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-touch"
          onClick={onCleanupExpired}
          title="Purge dropped files older than 24 hours"
        >
          <Clock size={15} />
          <span className="hide-mobile">Purge Expired</span>
          <span className="show-mobile">Purge</span>
        </button>
      </div>
    </div>
  );
};
