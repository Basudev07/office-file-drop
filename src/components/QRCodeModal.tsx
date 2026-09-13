import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Printer, Download, Sparkles } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const receiverTitle = localStorage.getItem('office_drop_desk_title') || "Receiver's Desk";
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const customUrl = `${window.location.origin}${window.location.pathname}#drop`;

  useEffect(() => {
    QRCode.toDataURL(customUrl, {
      width: 440,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [customUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `office-drop-qr-${receiverTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrintStandee = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '380px',
          width: '92vw',
          padding: '20px',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--primary-light)" />
            <h2 className="modal-title" style={{ fontSize: '1.15rem' }}>Desk QR Code</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Minimal, Sleek White QR Card */}
        <div
          className="qr-preview-card"
          style={{
            margin: '0 0 16px',
            padding: '16px 14px 14px',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {/* Crisp Single QR Code */}
          <div
            className="qr-img-wrapper"
            style={{
              padding: '6px',
              border: 'none',
              boxShadow: 'none',
              background: 'transparent',
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Desk QR Code"
                style={{ width: '200px', height: '200px', borderRadius: '4px' }}
              />
            ) : (
              <div
                style={{
                  width: '200px',
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '0.85rem',
                }}
              >
                Generating QR...
              </div>
            )}
          </div>

          {/* Station Title */}
          <div
            className="qr-caption"
            style={{
              marginTop: '10px',
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            {receiverTitle}
          </div>

          <div
            className="qr-subcaption"
            style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}
          >
            Scan with any phone to drop files
          </div>

          <div
            className="qr-footer-tag"
            style={{
              marginTop: '8px',
              paddingTop: '8px',
              fontSize: '0.7rem',
              borderTop: '1px dashed #e2e8f0',
              color: '#94a3b8',
            }}
          >
            No account required • © BASUDEV
          </div>
        </div>

        {/* 3 Clean Action Buttons in 1 Row */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-primary"
            style={{
              flex: 1,
              minHeight: '40px',
              fontSize: '0.85rem',
              padding: '8px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={handlePrintStandee}
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          <button
            className="btn btn-secondary"
            style={{
              flex: 1,
              minHeight: '40px',
              fontSize: '0.85rem',
              padding: '8px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={handleCopy}
            title="Copy Upload Link"
          >
            {copied ? <Check size={15} color="var(--accent-emerald)" /> : <Copy size={15} />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>

          <button
            className="btn btn-secondary"
            style={{
              minHeight: '40px',
              padding: '8px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={handleDownload}
            title="Download PNG image"
            aria-label="Save QR Image"
          >
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* Hidden printable container (Completely hidden on screen, ONLY rendered during window.print()) */}
      <div className="print-standee-container" ref={printRef}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#4f46e5',
          }}
        >
          OFFICE FILE DROP
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '8px 0 2px', color: '#0f172a' }}>
          {receiverTitle}
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
          Instant file transfer directly to this receiver
        </p>

        {qrDataUrl && <img src={qrDataUrl} alt="QR Code" />}

        <div style={{ margin: '14px 0', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#334155',
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <span>1. Scan QR Code</span>
            <span>•</span>
            <span>2. Pick Files</span>
            <span>•</span>
            <span>3. Instant Drop</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
            No account or login required • Auto-cleaned after 24 hours • © BASUDEV
          </div>
        </div>
      </div>
    </div>
  );
};
