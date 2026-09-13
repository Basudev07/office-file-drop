import React from 'react';
import { Layers, Users, HardDrive, Clock } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

interface StatsBarProps {
  totalFiles: number;
  uniqueSenders: number;
  totalStorage: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  totalFiles,
  uniqueSenders,
  totalStorage,
}) => {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
          <Layers size={22} />
        </div>
        <div className="stat-content">
          <span className="stat-val">{totalFiles}</span>
          <span className="stat-lbl">Active Dropped Files</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
          <Users size={22} />
        </div>
        <div className="stat-content">
          <span className="stat-val">{uniqueSenders}</span>
          <span className="stat-lbl">Unique Senders</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
          <HardDrive size={22} />
        </div>
        <div className="stat-content">
          <span className="stat-val">{formatBytes(totalStorage)}</span>
          <span className="stat-lbl">Total Storage Used</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
          <Clock size={22} />
        </div>
        <div className="stat-content">
          <span className="stat-val">24 Hours</span>
          <span className="stat-lbl">Auto-Purge TTL</span>
        </div>
      </div>
    </div>
  );
};
