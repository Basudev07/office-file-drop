import React from 'react';
import { SelectedFileItem } from '../../types';
import { formatBytes, getFileCategory } from '../../utils/formatters';
import {
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface UploadQueueProps {
  files: SelectedFileItem[];
  isUploading: boolean;
  onRemoveFile: (id: string) => void;
  onClearQueue: () => void;
  onUploadAll: () => void;
}

export const UploadQueue: React.FC<UploadQueueProps> = ({
  files,
  isUploading,
  onRemoveFile,
  onClearQueue,
  onUploadAll,
}) => {
  if (files.length === 0) return null;

  const totalBytes = files.reduce((acc, curr) => acc + curr.file.size, 0);
  const completedCount = files.filter((f) => f.status === 'completed').length;

  return (
    <div className="upload-list-container">
      {/* Queue Header */}
      <div className="upload-list-header">
        <span className="upload-list-stats">
          Queued ({files.length}) • {formatBytes(totalBytes)}
        </span>
        {!isUploading && (
          <button
            type="button"
            className="btn-link"
            onClick={onClearQueue}
            title="Clear all queued files"
          >
            Clear all
          </button>
        )}
      </div>

      {/* File Items */}
      <div className="upload-items-scroll">
        {files.map((item) => {
          const cat = getFileCategory(item.file.type, item.file.name);
          return (
            <div key={item.id} className="upload-item">
              <div className="upload-item-info">
                <div className="upload-item-icon">
                  {cat === 'image' ? <ImageIcon size={18} /> : <FileText size={18} />}
                </div>

                <div className="upload-item-text">
                  <div className="upload-item-name" title={item.file.name}>
                    {item.file.name}
                  </div>
                  <div className="upload-item-size">{formatBytes(item.file.size)}</div>

                  {item.status === 'uploading' && (
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {item.status === 'error' && (
                    <div className="upload-item-error">{item.errorMessage}</div>
                  )}
                </div>
              </div>

              {item.status === 'completed' && (
                <CheckCircle2 size={18} color="var(--accent-emerald)" />
              )}

              {item.status === 'pending' && !isUploading && (
                <button
                  type="button"
                  className="btn-icon touch-target"
                  onClick={() => onRemoveFile(item.id)}
                  title="Remove from queue"
                  aria-label={`Remove ${item.file.name}`}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <button
        type="button"
        className="btn btn-primary btn-upload-main"
        onClick={onUploadAll}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <div className="status-dot" style={{ backgroundColor: '#fff' }} />
            <span>
              Uploading to Desk ({completedCount}/{files.length})...
            </span>
          </>
        ) : (
          <>
            <Sparkles size={18} />
            <span>
              Drop {files.length} File{files.length > 1 ? 's' : ''} Now
            </span>
            <ArrowRight size={18} />
          </>
        )}
      </button>

      {/* Mobile Sticky Bar: ensures one-tap access on long file lists */}
      <div className="mobile-sticky-bar">
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', minHeight: '48px', fontSize: '1rem' }}
          onClick={onUploadAll}
          disabled={isUploading}
        >
          {isUploading ? (
            <span>Uploading ({completedCount}/{files.length})...</span>
          ) : (
            <span>Drop {files.length} File{files.length > 1 ? 's' : ''} Now</span>
          )}
        </button>
      </div>
    </div>
  );
};
