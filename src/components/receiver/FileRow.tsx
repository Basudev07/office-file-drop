import React from 'react';
import { OfficeFile } from '../../types';
import { formatBytes, formatTimeAgo, getFileCategory, isPrintable } from '../../utils/formatters';
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  Download,
  Printer,
  Eye,
  Trash2,
} from 'lucide-react';

interface FileRowProps {
  file: OfficeFile;
  isDownloading: boolean;
  isPrinting: boolean;
  onDownload: (file: OfficeFile) => void;
  onPrint: (file: OfficeFile) => void;
  onPreview: (file: OfficeFile) => void;
  onDelete: (file: OfficeFile) => void;
}

export const FileRow: React.FC<FileRowProps> = ({
  file,
  isDownloading,
  isPrinting,
  onDownload,
  onPrint,
  onPreview,
  onDelete,
}) => {
  const cat = getFileCategory(file.mime_type, file.file_name);
  const printable = isPrintable(file.mime_type, file.file_name);

  const renderIcon = () => {
    switch (cat) {
      case 'image':
        return <ImageIcon size={18} />;
      case 'spreadsheet':
        return <FileSpreadsheet size={18} />;
      case 'archive':
        return <FileArchive size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  return (
    <div className="file-row">
      <div className="file-info-group">
        <div className="file-type-icon">{renderIcon()}</div>
        <div className="file-details">
          <div className="file-name" title={file.file_name}>
            {file.file_name}
          </div>
          <div className="file-meta">
            <span>{formatBytes(file.file_size)}</span>
            <span>•</span>
            <span>{formatTimeAgo(file.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="file-actions">
        {/* Instant Direct Download */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onDownload(file)}
          disabled={isDownloading}
          title="Instant direct download to Downloads folder"
        >
          <Download size={14} className={isDownloading ? 'spin' : ''} />
          <span>{isDownloading ? 'Saving...' : 'Download'}</span>
        </button>

        {/* 1-Click Print */}
        {printable && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onPrint(file)}
            disabled={isPrinting}
            title="Print directly to office printer"
          >
            <Printer size={14} className={isPrinting ? 'spin' : ''} />
            <span className="hide-mobile">{isPrinting ? 'Printing...' : 'Print'}</span>
          </button>
        )}

        {/* Preview Modal */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPreview(file)}
          title="Preview file"
        >
          <Eye size={14} />
          <span className="hide-mobile">Preview</span>
        </button>

        {/* Delete */}
        <button
          type="button"
          className="btn btn-danger btn-sm touch-target"
          onClick={() => onDelete(file)}
          title="Delete this file"
          aria-label="Delete file"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
