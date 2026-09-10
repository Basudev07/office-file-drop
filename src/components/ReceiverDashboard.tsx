import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import { OfficeFile, SenderBatch } from '../types';
import { formatBytes, formatTimeAgo, getFileCategory, isPrintable } from '../utils/formatters';
import { printRemoteFile } from '../utils/printHelper';
import { downloadFileInstantly } from '../utils/downloadHelper';
import {
  Download,
  Printer,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  FolderDown,
  FileText,
  Image as ImageIcon,
  HardDrive,
  Users,
  Clock,
  QrCode,
  Sparkles,
  Layers,
  Code,
  FileSpreadsheet,
  FileArchive,
  Lock,
} from 'lucide-react';

interface ReceiverDashboardProps {
  files: OfficeFile[];
  loading: boolean;
  onRefresh: () => void;
  onDeleteFile: (file: OfficeFile) => void;
  onDeleteBatch: (files: OfficeFile[]) => void;
  onPreviewFile: (file: OfficeFile) => void;
  onOpenQR: () => void;
  onCleanupExpired: () => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
}

export const ReceiverDashboard: React.FC<ReceiverDashboardProps> = ({
  files,
  loading,
  onRefresh,
  onDeleteFile,
  onDeleteBatch,
  onPreviewFile,
  onOpenQR,
  onCleanupExpired,
  isAuthenticated,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [downloadingZipSender, setDownloadingZipSender] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  // Group files by Sender Name (and time batch)
  const groupedBatches = useMemo(() => {
    let filtered = files;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) => f.sender_name.toLowerCase().includes(q) || f.file_name.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((f) => getFileCategory(f.mime_type, f.file_name) === categoryFilter);
    }

    const groups: { [key: string]: OfficeFile[] } = {};
    filtered.forEach((file) => {
      const key = file.sender_name.trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(file);
    });

    const batches: SenderBatch[] = Object.entries(groups).map(([sender_name, senderFiles]) => {
      // Find latest timestamp
      const sorted = [...senderFiles].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const totalSize = senderFiles.reduce((acc, f) => acc + f.file_size, 0);
      return {
        sender_name,
        timestamp: sorted[0]?.created_at || new Date().toISOString(),
        files: sorted,
        totalSize,
      };
    });

    // Sort batches by latest drop first
    return batches.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [files, searchQuery, categoryFilter]);

  // Overall statistics
  const totalStorage = useMemo(() => files.reduce((acc, f) => acc + f.file_size, 0), [files]);
  const uniqueSenders = useMemo(() => new Set(files.map((f) => f.sender_name.toLowerCase().trim())).size, [files]);

  // Handle Download All as ZIP for a sender
  const handleDownloadSenderZip = async (batch: SenderBatch) => {
    try {
      setDownloadingZipSender(batch.sender_name);
      const zip = new JSZip();

      // Fetch each file as blob and add to zip
      const fetchPromises = batch.files.map(async (f) => {
        if (!f.public_url) return;
        try {
          const res = await fetch(f.public_url);
          const blob = await res.blob();
          zip.file(f.file_name, blob);
        } catch (err) {
          console.error(`Failed to fetch file ${f.file_name} for zip:`, err);
        }
      });

      await Promise.all(fetchPromises);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${batch.sender_name.replace(/\s+/g, '_')}_files_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating zip:', err);
      alert('Could not download zip. You can download individual files.');
    } finally {
      setDownloadingZipSender(null);
    }
  };

  // Handle One-Click Print
  const handlePrint = async (file: OfficeFile) => {
    if (!file.public_url) return;
    setPrintingId(file.id);
    try {
      await printRemoteFile(file.public_url, file.file_name);
    } finally {
      setTimeout(() => setPrintingId(null), 1500);
    }
  };

  // Handle Instant Direct Download of single file
  const handleDownload = async (file: OfficeFile) => {
    if (!file.public_url) return;
    await downloadFileInstantly(file.public_url, file.file_name, (isDownloading) => {
      setDownloadingFileId(isDownloading ? file.id : null);
    });
  };

  return (
    <div>
      {/* Header & Quick Action */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>Receiver Station</h1>
          <p>Files dropped from colleagues appear here instantly in real time.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={onOpenQR} title="Open permanent QR standee">
            <QrCode size={15} />
            <span className="hide-mobile">Show Permanent QR</span>
            <span className="show-mobile">Desk QR</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={loading} title="Refresh Feed">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Sync</span>
          </button>

          {isAuthenticated && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onCleanupExpired}
              title="Delete files older than 24h"
            >
              <Clock size={15} />
              <span className="hide-mobile">Purge Expired</span>
              <span className="show-mobile">Purge</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice if Receiver is not logged in */}
      {!isAuthenticated && (
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.2)',
                color: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Receiver Security Mode</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Sign in to delete files, print securely, and purge storage.
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
            <span>Sign In to Unlock Management</span>
          </button>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
            <Layers size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-val">{files.length}</span>
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

      {/* Search & Category Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '400px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)',
            }}
          />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '36px', paddingRight: '12px' }}
            placeholder="Search by sender or file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'all', label: 'All Files' },
            { id: 'image', label: 'Images' },
            { id: 'pdf', label: 'PDFs' },
            { id: 'document', label: 'Docs' },
            { id: 'spreadsheet', label: 'Sheets' },
            { id: 'archive', label: 'Zip' },
          ].map((cat) => (
            <button
              key={cat.id}
              className={`btn btn-sm ${categoryFilter === cat.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incoming Drops Grouped by Sender */}
      {groupedBatches.length === 0 ? (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-light)',
              marginBottom: '18px',
            }}
          >
            <Sparkles size={36} />
          </div>

          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
            {searchQuery || categoryFilter !== 'all' ? 'No matching files found' : 'Waiting for Incoming File Drops'}
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '440px', marginBottom: '24px' }}>
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your search query or switching filters.'
              : 'Print your Permanent QR Standee or send the drop link to your colleagues. Transferred files will appear here automatically.'}
          </p>

          <button className="btn btn-primary" onClick={onOpenQR}>
            <QrCode size={16} />
            <span>Open Desk QR Standee</span>
          </button>
        </div>
      ) : (
        <div>
          {groupedBatches.map((batch) => {
            const initials = batch.sender_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'OF';

            return (
              <div key={batch.sender_name} className="sender-group-card">
                {/* Sender Group Header */}
                <div className="sender-header">
                  <div className="sender-profile">
                    <div className="sender-avatar">{initials}</div>
                    <div>
                      <div className="sender-name">{batch.sender_name}</div>
                      <div className="sender-meta">
                        <span>{batch.files.length} file{batch.files.length > 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{formatBytes(batch.totalSize)}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(batch.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Batch Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownloadSenderZip(batch)}
                      disabled={downloadingZipSender === batch.sender_name}
                      title="Download all files in this batch as a single ZIP"
                    >
                      <FolderDown size={14} />
                      <span>{downloadingZipSender === batch.sender_name ? 'Zipping...' : 'Download ZIP'}</span>
                    </button>

                    {isAuthenticated && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (confirm(`Delete all ${batch.files.length} files from ${batch.sender_name}?`)) {
                            onDeleteBatch(batch.files);
                          }
                        }}
                        title="Delete entire sender batch"
                      >
                        <Trash2 size={14} />
                        <span className="hide-mobile">Delete Batch</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* File Rows */}
                <div className="files-table">
                  {batch.files.map((file) => {
                    const category = getFileCategory(file.mime_type, file.file_name);
                    const printable = isPrintable(file.mime_type, file.file_name);

                    // Category icons
                    let CategoryIcon = FileText;
                    let iconBg = 'rgba(99, 102, 241, 0.15)';
                    let iconColor = 'var(--primary-light)';

                    if (category === 'image') {
                      CategoryIcon = ImageIcon;
                      iconBg = 'rgba(6, 182, 212, 0.15)';
                      iconColor = 'var(--accent-cyan)';
                    } else if (category === 'pdf') {
                      CategoryIcon = FileText;
                      iconBg = 'rgba(244, 63, 94, 0.15)';
                      iconColor = 'var(--accent-rose)';
                    } else if (category === 'spreadsheet') {
                      CategoryIcon = FileSpreadsheet;
                      iconBg = 'rgba(16, 185, 129, 0.15)';
                      iconColor = 'var(--accent-emerald)';
                    } else if (category === 'code') {
                      CategoryIcon = Code;
                      iconBg = 'rgba(245, 158, 11, 0.15)';
                      iconColor = 'var(--accent-amber)';
                    } else if (category === 'archive') {
                      CategoryIcon = FileArchive;
                      iconBg = 'rgba(168, 85, 247, 0.15)';
                      iconColor = '#a855f7';
                    }

                    return (
                      <div key={file.id} className="file-row">
                        <div className="file-details">
                          <div className="file-type-icon" style={{ background: iconBg, color: iconColor }}>
                            <CategoryIcon size={18} />
                          </div>

                          <div className="file-title-block">
                            <div
                              className="file-title"
                              onClick={() => onPreviewFile(file)}
                              style={{ cursor: 'pointer' }}
                              title="Click to preview file"
                            >
                              {file.file_name}
                            </div>
                            <div className="file-specs">
                              <span>{formatBytes(file.file_size)}</span>
                              <span> • </span>
                              <span>{formatTimeAgo(file.created_at)}</span>
                              {(file.mime_type?.startsWith('text/') || file.file_name.toLowerCase().endsWith('.txt')) && (
                                <>
                                  <span> • </span>
                                  <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Raw Text</span>
                                </>
                              )}
                              {printable && (
                                <>
                                  <span> • </span>
                                  <span style={{ color: 'var(--accent-cyan)' }}>Printable</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* File Actions */}
                        <div className="file-actions">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onPreviewFile(file)}
                            title="Preview file"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>

                          {printable && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handlePrint(file)}
                              disabled={printingId === file.id}
                              title="Print directly to office printer"
                            >
                              <Printer size={14} />
                              <span>
                                {printingId === file.id ? 'Printing...' : 'Print'}
                              </span>
                            </button>
                          )}

                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDownload(file)}
                            disabled={downloadingFileId === file.id}
                            title="Download file instantly"
                          >
                            <Download size={14} />
                            <span>{downloadingFileId === file.id ? 'Downloading...' : 'Download'}</span>
                          </button>

                          {isAuthenticated && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                if (confirm(`Delete "${file.file_name}"?`)) {
                                  onDeleteFile(file);
                                }
                              }}
                              title="Delete file"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
