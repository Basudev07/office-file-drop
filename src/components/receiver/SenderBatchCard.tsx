import React from 'react';
import { SenderBatch, OfficeFile } from '../../types';
import { formatBytes, formatTimeAgo } from '../../utils/formatters';
import { FileRow } from './FileRow';
import { FolderDown, Trash2 } from 'lucide-react';

interface SenderBatchCardProps {
  batch: SenderBatch;
  isDownloadingZip: boolean;
  downloadingFileId: string | null;
  printingId: string | null;
  onDownloadZip: (batch: SenderBatch) => void;
  onDeleteBatch: (files: OfficeFile[]) => void;
  onDownloadFile: (file: OfficeFile) => void;
  onPrintFile: (file: OfficeFile) => void;
  onPreviewFile: (file: OfficeFile) => void;
  onDeleteFile: (file: OfficeFile) => void;
}

export const SenderBatchCard: React.FC<SenderBatchCardProps> = ({
  batch,
  isDownloadingZip,
  downloadingFileId,
  printingId,
  onDownloadZip,
  onDeleteBatch,
  onDownloadFile,
  onPrintFile,
  onPreviewFile,
  onDeleteFile,
}) => {
  const initial = (batch.sender_name[0] || 'U').toUpperCase();

  return (
    <div className="sender-batch-card">
      <div className="sender-header">
        <div className="sender-profile">
          <div className="sender-avatar">{initial}</div>
          <div>
            <div className="sender-name">{batch.sender_name}</div>
            <div className="sender-time">
              {batch.files.length} file{batch.files.length > 1 ? 's' : ''} • {formatBytes(batch.totalSize)} • {formatTimeAgo(batch.timestamp)}
            </div>
          </div>
        </div>

        <div className="sender-batch-actions">
          {batch.files.length > 1 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onDownloadZip(batch)}
              disabled={isDownloadingZip}
              title={`Download all ${batch.files.length} files from ${batch.sender_name} as a single .ZIP`}
            >
              <FolderDown size={14} className={isDownloadingZip ? 'spin' : ''} />
              <span>{isDownloadingZip ? 'Zipping...' : 'Download All (.ZIP)'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-danger btn-sm touch-target"
            onClick={() => onDeleteBatch(batch.files)}
            title={`Delete all files dropped by ${batch.sender_name}`}
            aria-label="Delete all files in batch"
          >
            <Trash2 size={14} />
            <span className="hide-mobile">Delete Batch</span>
          </button>
        </div>
      </div>

      <div className="sender-files-list">
        {batch.files.map((file) => (
          <FileRow
            key={file.id}
            file={file}
            isDownloading={downloadingFileId === file.id}
            isPrinting={printingId === file.id}
            onDownload={onDownloadFile}
            onPrint={onPrintFile}
            onPreview={onPreviewFile}
            onDelete={onDeleteFile}
          />
        ))}
      </div>
    </div>
  );
};
