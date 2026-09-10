import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { uploadOfficeFile } from '../lib/supabase';
import { formatBytes, getFileCategory } from '../utils/formatters';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  User,
  ShieldCheck,
  Camera,
  FilePlus,
  FileCode,
  Send,
  ClipboardCopy,
  Plus,
  Trash2,
} from 'lucide-react';

interface SelectedFileItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

export const SenderUpload: React.FC = () => {
  const [senderName, setSenderName] = useState(() => {
    return localStorage.getItem('office_drop_sender_name') || '';
  });
  const [uploadMode, setUploadMode] = useState<'files' | 'text'>('files');
  const [rawText, setRawText] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const deskTitle = localStorage.getItem('office_drop_desk_title') || "Receiver's Desk";

  // Remember sender name in localStorage
  useEffect(() => {
    if (senderName.trim()) {
      localStorage.setItem('office_drop_sender_name', senderName.trim());
    }
  }, [senderName]);

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setGlobalError(null);
    setUploadComplete(false);

    const newItems: SelectedFileItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
    }));

    setSelectedFiles((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesAdded(e.dataTransfer.files);
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  // Upload raw text directly
  const handleUploadRawText = async () => {
    if (!senderName.trim()) {
      setGlobalError('Please enter your name so the receiver knows who sent the text.');
      return;
    }
    if (!rawText.trim()) {
      setGlobalError('Please enter or paste some text before dropping.');
      return;
    }

    setIsUploading(true);
    setGlobalError(null);

    try {
      const cleanTitle = (textTitle.trim() || `Text_Note_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/[:\s]/g, '-')}`);
      const fileName = cleanTitle.toLowerCase().endsWith('.txt') ? cleanTitle : `${cleanTitle}.txt`;
      const textBlob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
      const textFile = new File([textBlob], fileName, { type: 'text/plain;charset=utf-8', lastModified: Date.now() });

      await uploadOfficeFile(textFile, senderName.trim());

      setUploadComplete(true);
      setRawText('');
      setTextTitle('');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // confetti fallback
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setGlobalError(`Failed to drop text: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Add raw text as a file to the drop queue
  const handleAddTextToQueue = () => {
    if (!rawText.trim()) return;
    const cleanTitle = (textTitle.trim() || `Text_Note_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/[:\s]/g, '-')}`);
    const fileName = cleanTitle.toLowerCase().endsWith('.txt') ? cleanTitle : `${cleanTitle}.txt`;
    const textBlob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const textFile = new File([textBlob], fileName, { type: 'text/plain;charset=utf-8', lastModified: Date.now() });

    setSelectedFiles((prev) => [
      ...prev,
      {
        id: `${fileName}-${Date.now()}-${Math.random()}`,
        file: textFile,
        progress: 0,
        status: 'pending',
      },
    ]);

    setRawText('');
    setTextTitle('');
    setUploadMode('files');
  };

  // Paste from clipboard helper
  const handlePasteClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setRawText((prev) => (prev ? `${prev}\n${clip}` : clip));
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const handleUploadAll = async () => {
    if (!senderName.trim()) {
      setGlobalError('Please enter your name so the receiver knows who sent the files.');
      return;
    }

    if (selectedFiles.length === 0) {
      setGlobalError('Please select at least one file to upload.');
      return;
    }

    setIsUploading(true);
    setGlobalError(null);

    let hasErrors = false;

    // Upload files sequentially for clean progress tracking
    for (const item of selectedFiles) {
      if (item.status === 'completed') continue;

      // Set status to uploading
      setSelectedFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 15 } : f))
      );

      try {
        await uploadOfficeFile(item.file, senderName.trim(), (pct) => {
          setSelectedFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, progress: pct } : f))
          );
        });

        setSelectedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'completed', progress: 100 } : f))
        );
      } catch (err: unknown) {
        hasErrors = true;
        const error = err as { message?: string };
        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'error', errorMessage: error.message || 'Failed' } : f
          )
        );
      }
    }

    setIsUploading(false);

    if (!hasErrors) {
      setUploadComplete(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // confetti fallback
      }
    } else {
      setGlobalError('Some files could not be uploaded. Check the errors below.');
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setRawText('');
    setTextTitle('');
    setUploadComplete(false);
    setGlobalError(null);
  };

  const totalBytes = selectedFiles.reduce((acc, curr) => acc + curr.file.size, 0);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Header Badge */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            color: 'var(--primary-light)',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          <ShieldCheck size={16} />
          <span>Internal Zero-Login Transfer</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 5vw, 2rem)', fontWeight: 800 }}>
          Drop Files to {deskTitle}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.82rem, 2.5vw, 0.92rem)', marginTop: '6px' }}>
          Select files or drop raw text. Transfers appear directly on the receiver's screen in real time.
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="glass-card">
        {/* Step 1: Sender Name */}
        <div className="input-group">
          <label className="input-label">
            <User size={15} />
            <span>Your Name or Department</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Sarah Jenkins (Design), Bob, or Marketing"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            disabled={isUploading || uploadComplete}
            required
          />
        </div>

        {/* Upload Mode Switcher: Files vs Raw Text */}
        {!uploadComplete && (
          <div className="upload-mode-switcher">
            <button
              type="button"
              className={`mode-tab ${uploadMode === 'files' ? 'active' : ''}`}
              onClick={() => setUploadMode('files')}
            >
              <UploadCloud size={16} />
              <span>Upload Files & Photos</span>
            </button>
            <button
              type="button"
              className={`mode-tab ${uploadMode === 'text' ? 'active' : ''}`}
              onClick={() => setUploadMode('text')}
            >
              <FileCode size={16} />
              <span>Drop Raw Text</span>
            </button>
          </div>
        )}

        {/* Global Error Notice */}
        {globalError && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} />
            <span>{globalError}</span>
          </div>
        )}

        {/* Success State */}
        {uploadComplete ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle2 size={40} />
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>
              Transfer Complete!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Your transfer was delivered directly to <strong>{deskTitle}</strong> in real time.
            </p>

            <button className="btn btn-primary" onClick={handleReset} style={{ margin: '0 auto' }}>
              <RefreshCw size={16} />
              <span>Drop More Files or Text</span>
            </button>
          </div>
        ) : (
          <>
            {/* Mode 1: File Drop */}
            {uploadMode === 'files' && (
              <>
                <div
                  className={`dropzone ${isDragging ? 'active' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="dropzone-icon">
                    <UploadCloud size={32} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 'clamp(0.95rem, 3vw, 1.05rem)', color: 'var(--text-main)' }}>
                      Tap to choose files or drag & drop here
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Images, PDFs, Docs, Zip, Code — any format supported
                    </p>
                  </div>

                  {/* Mobile-Friendly Quick Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px' }}
                    >
                      <FilePlus size={14} />
                      <span>Choose Files</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px' }}
                    >
                      <Camera size={14} />
                      <span>Camera Photo</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadMode('text');
                      }}
                      style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px' }}
                    >
                      <FileText size={14} />
                      <span>Paste Raw Text</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => handleFilesAdded(e.target.files)}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFilesAdded(e.target.files)}
                  />
                </div>

                {/* Selected Files Queue */}
                {selectedFiles.length > 0 && (
                  <div className="upload-list">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 4px',
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>
                        Selected ({selectedFiles.length}) • {formatBytes(totalBytes)}
                      </span>
                      {!isUploading && (
                        <button
                          onClick={handleReset}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-dim)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {selectedFiles.map((item) => {
                      const cat = getFileCategory(item.file.type, item.file.name);
                      return (
                        <div key={item.id} className="upload-item">
                          <div className="upload-item-info">
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary-light)',
                              }}
                            >
                              {cat === 'image' ? <ImageIcon size={18} /> : <FileText size={18} />}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div className="upload-item-name">{item.file.name}</div>
                              <div className="upload-item-size">{formatBytes(item.file.size)}</div>

                              {item.status === 'uploading' && (
                                <div className="progress-bar-bg">
                                  <div className="progress-bar-fill" style={{ width: `${item.progress}%` }} />
                                </div>
                              )}

                              {item.status === 'error' && (
                                <div style={{ color: 'var(--accent-rose)', fontSize: '0.75rem', marginTop: '2px' }}>
                                  {item.errorMessage}
                                </div>
                              )}
                            </div>
                          </div>

                          {item.status === 'completed' && <CheckCircle2 size={18} color="var(--accent-emerald)" />}

                          {item.status === 'pending' && !isUploading && (
                            <button
                              className="btn-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(item.id);
                              }}
                              title="Remove file"
                              aria-label="Remove file"
                              style={{ minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Upload Action Button */}
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '14px', padding: '14px 20px', minHeight: '48px', fontSize: '1rem' }}
                      onClick={handleUploadAll}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <div className="status-dot" style={{ backgroundColor: '#fff', animationDuration: '0.8s' }} />
                          <span>Uploading to Desk ({selectedFiles.filter((f) => f.status === 'completed').length}/{selectedFiles.length})...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          <span>Drop {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''} Now</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Mode 2: Raw Text Drop */}
            {uploadMode === 'text' && (
              <div className="raw-text-container">
                <div className="input-group" style={{ marginBottom: '8px' }}>
                  <label className="input-label" style={{ justifyContent: 'space-between' }}>
                    <span>Note / Code Title (Optional)</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Preserves 100% exact format</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. WiFi Password, Python Script, Meeting Notes, Server Token"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    disabled={isUploading}
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <textarea
                    className="raw-textarea"
                    placeholder="Type or paste any raw text here of any length...&#10;&#10;Exact indentation, spacing, line breaks, code snippets, emojis, and symbols are preserved without alteration."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    disabled={isUploading}
                  />
                </div>

                {/* Toolbar: Counters & Quick Clipboard Paste */}
                <div className="raw-text-toolbar">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>{rawText.length.toLocaleString()} chars</span>
                    <span>•</span>
                    <span>{rawText ? rawText.split('\n').length : 0} lines</span>
                    <span>•</span>
                    <span>{formatBytes(new Blob([rawText]).size)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handlePasteClipboard}
                      title="Paste text from clipboard"
                    >
                      <ClipboardCopy size={13} />
                      <span>Paste Clipboard</span>
                    </button>
                    {rawText && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setRawText('')}
                        title="Clear text"
                      >
                        <Trash2 size={13} />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Send Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, minHeight: '48px', padding: '12px 18px', fontSize: '0.96rem' }}
                    onClick={handleUploadRawText}
                    disabled={isUploading || !rawText.trim()}
                  >
                    {isUploading ? (
                      <>
                        <div className="status-dot" style={{ backgroundColor: '#fff', animationDuration: '0.8s' }} />
                        <span>Dropping Text to {deskTitle}...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Drop Raw Text Now</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ minHeight: '48px', padding: '12px 16px' }}
                    onClick={handleAddTextToQueue}
                    disabled={isUploading || !rawText.trim()}
                    title="Add this text note to file queue to drop alongside other files"
                  >
                    <Plus size={16} />
                    <span className="hide-mobile">Add to Queue</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
