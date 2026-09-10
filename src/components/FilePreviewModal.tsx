import React, { useState, useEffect } from 'react';
import { OfficeFile } from '../types';
import { getFileCategory, formatBytes, isPrintable } from '../utils/formatters';
import { printRemoteFile } from '../utils/printHelper';
import { downloadFileInstantly } from '../utils/downloadHelper';
import { X, Download, Printer, Trash2, ExternalLink, FileText, Copy, Check } from 'lucide-react';

interface FilePreviewModalProps {
  file: OfficeFile | null;
  onClose: () => void;
  onDelete: (file: OfficeFile) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose, onDelete }) => {
  if (!file) return null;

  const category = getFileCategory(file.mime_type, file.file_name);
  const printable = isPrintable(file.mime_type, file.file_name);
  const fileUrl = file.public_url || '';

  const isText =
    (file.mime_type && (file.mime_type.startsWith('text/') || file.mime_type.includes('json') || file.mime_type.includes('javascript'))) ||
    /\.(txt|md|log|json|csv|py|js|ts|tsx|jsx|html|css|sql|sh|env|xml|yaml|yml)$/i.test(file.file_name);

  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isText && fileUrl) {
      setLoadingText(true);
      fetch(fileUrl)
        .then((res) => res.text())
        .then((t) => setTextContent(t))
        .catch((err) => {
          console.error('Error fetching text preview:', err);
          setTextContent(null);
        })
        .finally(() => setLoadingText(false));
    } else {
      setTextContent(null);
    }
  }, [fileUrl, isText]);

  const handlePrint = () => {
    if (fileUrl) {
      printRemoteFile(fileUrl, file.file_name);
    }
  };

  const handleDownload = async () => {
    if (!fileUrl) return;
    await downloadFileInstantly(fileUrl, file.file_name, setIsDownloading);
  };

  const handleCopyText = async () => {
    if (!textContent) return;
    try {
      await navigator.clipboard.writeText(textContent);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: '1 1 200px' }}>
            <h2
              className="modal-title"
              style={{ fontSize: '1.05rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {file.file_name}
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              From <strong style={{ color: 'var(--text-main)' }}>{file.sender_name}</strong> • {formatBytes(file.file_size)}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {isText && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyText}
                title="Copy full raw text to clipboard"
                aria-label="Copy Raw Text"
              >
                {copiedText ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
              </button>
            )}

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleDownload}
              disabled={isDownloading}
              title="Download file instantly"
              aria-label="Download"
            >
              <Download size={14} />
              <span className="hide-mobile">{isDownloading ? 'Downloading...' : 'Download'}</span>
            </button>

            {printable && (
              <button className="btn btn-secondary btn-sm" onClick={handlePrint} title="Print" aria-label="Print">
                <Printer size={14} />
                <span className="hide-mobile">Print</span>
              </button>
            )}

            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                onDelete(file);
                onClose();
              }}
              title="Delete File"
              aria-label="Delete File"
            >
              <Trash2 size={14} />
            </button>

            <button className="modal-close" onClick={onClose} style={{ marginLeft: '4px' }} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview Content Area */}
        <div
          style={{
            flex: 1,
            minHeight: '320px',
            maxHeight: '65vh',
            background: 'rgba(0, 0, 0, 0.45)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {category === 'image' && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
              <img
                src={fileUrl}
                alt={file.file_name}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
              />
            </div>
          )}

          {category === 'pdf' && (
            <iframe
              src={`${fileUrl}#toolbar=1`}
              title={file.file_name}
              style={{ width: '100%', height: '60vh', border: 'none' }}
            />
          )}

          {/* Raw Text Viewer with 100% exact formatting preservation */}
          {isText && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                  color: 'var(--text-dim)',
                }}
              >
                <span>
                  {textContent ? `${textContent.length.toLocaleString()} characters • ${textContent.split('\n').length} lines` : 'Loading raw text...'}
                </span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Raw Exact Format</span>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                {loadingText ? (
                  <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', padding: '20px' }}>
                    Loading text content...
                  </div>
                ) : (
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.88rem',
                      lineHeight: '1.6',
                      color: '#e2e8f0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      tabSize: 2,
                    }}
                  >
                    {textContent}
                  </pre>
                )}
              </div>
            </div>
          )}

          {!isText && category !== 'image' && category !== 'pdf' && (
            <div style={{ textAlign: 'center', padding: '40px 20px', alignSelf: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--text-muted)',
                }}
              >
                <FileText size={32} />
              </div>
              <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '6px' }}>Binary / Archive File</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                This file format ({file.mime_type || 'binary'}) is best viewed by downloading.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={handleDownload}>
                  <Download size={16} />
                  <span>Download to View</span>
                </button>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  <ExternalLink size={16} />
                  <span>Open Raw in New Tab</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
