import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import { OfficeFile, SenderBatch } from '../types';
import { getFileCategory } from '../utils/formatters';
import { printRemoteFile } from '../utils/printHelper';
import { downloadFileInstantly } from '../utils/downloadHelper';
import { StationHeader } from './receiver/StationHeader';
import { StatsBar } from './receiver/StatsBar';
import { FilterToolbar } from './receiver/FilterToolbar';
import { SenderBatchCard } from './receiver/SenderBatchCard';
import { Lock, Sparkles, QrCode } from 'lucide-react';

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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [downloadingZipSender, setDownloadingZipSender] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  // Group files by Sender Name with search and category filtering
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

    return batches.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [files, searchQuery, categoryFilter]);

  // Overall metrics
  const totalStorage = useMemo(() => files.reduce((acc, f) => acc + f.file_size, 0), [files]);
  const uniqueSenders = useMemo(
    () => new Set(files.map((f) => f.sender_name.toLowerCase().trim())).size,
    [files]
  );

  // Batch ZIP download for a sender
  const handleDownloadSenderZip = async (batch: SenderBatch) => {
    try {
      setDownloadingZipSender(batch.sender_name);
      const zip = new JSZip();

      const fetchPromises = batch.files.map(async (f) => {
        if (!f.public_url) return;
        try {
          const res = await fetch(f.public_url);
          const blob = await res.blob();
          zip.file(f.file_name, blob);
        } catch (err) {
          console.error(`Failed to fetch ${f.file_name} for zip:`, err);
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

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error('ZIP generation error:', err);
      alert('Could not download ZIP archive. You can download individual files.');
    } finally {
      setDownloadingZipSender(null);
    }
  };

  // Direct printing
  const handlePrint = async (file: OfficeFile) => {
    if (!file.public_url) return;
    setPrintingId(file.id);
    try {
      await printRemoteFile(file.public_url, file.file_name);
    } finally {
      setTimeout(() => setPrintingId(null), 1500);
    }
  };

  // Instant direct download
  const handleDownload = async (file: OfficeFile) => {
    if (!file.public_url) return;
    await downloadFileInstantly(file.public_url, file.file_name, (isDownloading) => {
      setDownloadingFileId(isDownloading ? file.id : null);
    });
  };

  // Strict Unauthenticated Security Gate
  if (!isAuthenticated) {
    return (
      <div className="security-gate-wrapper">
        <div className="glass-card security-gate-card">
          <div className="security-gate-icon">
            <Lock size={36} />
          </div>
          <h2 className="security-gate-title">Receiver Station Locked</h2>
          <p className="security-gate-desc">
            This dashboard is private to the desk owner. Senders cannot view or manage dropped files. Sign in with desk credentials to unlock.
          </p>
          <button type="button" className="btn btn-primary btn-touch" onClick={onOpenAuth}>
            <span>Sign In to Unlock Station</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="receiver-page-wrapper">
      <StationHeader
        loading={loading}
        onRefresh={onRefresh}
        onOpenQR={onOpenQR}
        onCleanupExpired={onCleanupExpired}
      />

      <StatsBar
        totalFiles={files.length}
        uniqueSenders={uniqueSenders}
        totalStorage={totalStorage}
      />

      <FilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />

      {/* Batches List or Empty State */}
      {groupedBatches.length === 0 ? (
        <div className="glass-card empty-state-card">
          <div className="empty-state-icon">
            <Sparkles size={36} />
          </div>
          <h3 className="empty-state-title">
            {searchQuery || categoryFilter !== 'all'
              ? 'No matching files found'
              : 'Waiting for Incoming File Drops'}
          </h3>
          <p className="empty-state-desc">
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your search query or selecting a different category filter.'
              : 'Display your Desk QR Standee at your workstation or share the drop link. Incoming transfers will appear here automatically.'}
          </p>
          <button type="button" className="btn btn-primary btn-touch" onClick={onOpenQR}>
            <QrCode size={16} />
            <span>Open Desk QR Standee</span>
          </button>
        </div>
      ) : (
        <div className="batches-grid">
          {groupedBatches.map((batch) => (
            <SenderBatchCard
              key={batch.sender_name}
              batch={batch}
              isDownloadingZip={downloadingZipSender === batch.sender_name}
              downloadingFileId={downloadingFileId}
              printingId={printingId}
              onDownloadZip={handleDownloadSenderZip}
              onDeleteBatch={onDeleteBatch}
              onDownloadFile={handleDownload}
              onPrintFile={handlePrint}
              onPreviewFile={onPreviewFile}
              onDeleteFile={onDeleteFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceiverDashboard;
