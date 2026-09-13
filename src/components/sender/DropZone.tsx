import React, { useRef, useState } from 'react';
import { UploadCloud, FilePlus, Camera, FileText } from 'lucide-react';

interface DropZoneProps {
  onFilesAdded: (files: FileList | null) => void;
  onSwitchToText: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, onSwitchToText }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
    onFilesAdded(e.dataTransfer.files);
  };

  return (
    <div
      className={`dropzone ${isDragging ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="File upload dropzone"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          fileInputRef.current?.click();
        }
      }}
    >
      <div className="dropzone-icon">
        <UploadCloud size={32} />
      </div>

      <div className="dropzone-text">
        <p className="dropzone-title">Tap to choose files or drag & drop here</p>
        <p className="dropzone-sub">Photos, PDFs, Docs, Zip, Code — any format supported</p>
      </div>

      {/* Mobile-Friendly Quick Action Buttons (Min 44px touch targets) */}
      <div className="dropzone-quick-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="btn btn-secondary btn-touch"
          onClick={() => fileInputRef.current?.click()}
          title="Choose files from your device"
        >
          <FilePlus size={15} />
          <span>Choose Files</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-touch"
          onClick={() => cameraInputRef.current?.click()}
          title="Take a photo with camera"
        >
          <Camera size={15} />
          <span>Camera</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-touch"
          onClick={onSwitchToText}
          title="Drop raw text or code note"
        >
          <FileText size={15} />
          <span>Paste Text</span>
        </button>
      </div>

      {/* Hidden native inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => onFilesAdded(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => onFilesAdded(e.target.files)}
      />
    </div>
  );
};
