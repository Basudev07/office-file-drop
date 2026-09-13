import React from 'react';
import { useFileUploader } from '../hooks/useFileUploader';
import { SenderHeader } from './sender/SenderHeader';
import { DropZone } from './sender/DropZone';
import { UploadQueue } from './sender/UploadQueue';
import { RawTextEditor } from './sender/RawTextEditor';
import { TransferSuccess } from './sender/TransferSuccess';
import { UploadCloud, FileCode, AlertCircle } from 'lucide-react';

export const SenderUpload: React.FC = () => {
  const {
    senderName,
    setSenderName,
    uploadMode,
    setUploadMode,
    rawText,
    setRawText,
    textTitle,
    setTextTitle,
    selectedFiles,
    isUploading,
    uploadComplete,
    globalError,
    addFiles,
    removeFile,
    clearQueue,
    resetAll,
    pasteClipboardText,
    uploadRawText,
    addTextToQueue,
    uploadAllFiles,
  } = useFileUploader();

  const deskTitle = localStorage.getItem('office_drop_desk_title') || "Receiver's Desk";
  const [animationDirection, setAnimationDirection] = React.useState<'left' | 'right'>('right');

  return (
    <div className="sender-page-wrapper">
      <div className="glass-card sender-card">
        {/* Step 1: Destination and Sender Name */}
        <SenderHeader
          deskTitle={deskTitle}
          senderName={senderName}
          onSenderNameChange={setSenderName}
          disabled={isUploading || uploadComplete}
        />

        {/* Global Error Notice */}
        {globalError && (
          <div className="alert-notice alert-danger">
            <AlertCircle size={18} />
            <span>{globalError}</span>
          </div>
        )}

        {/* Success State */}
        {uploadComplete ? (
          <TransferSuccess deskTitle={deskTitle} onReset={resetAll} />
        ) : (
          <>
            {/* Fluid Mode Switcher Tabs */}
            <div className="upload-mode-switcher">
              <div
                className="mode-switcher-indicator"
                style={{
                  transform: uploadMode === 'files' ? 'translateX(0%)' : 'translateX(100%)',
                }}
              />
              <button
                type="button"
                className={`mode-tab touch-target ${uploadMode === 'files' ? 'active' : ''}`}
                onClick={() => {
                  if (uploadMode !== 'files') {
                    setAnimationDirection('left');
                    setUploadMode('files');
                  }
                }}
              >
                <UploadCloud size={16} />
                <span>Upload Files & Photos</span>
              </button>

              <button
                type="button"
                className={`mode-tab touch-target ${uploadMode === 'text' ? 'active' : ''}`}
                onClick={() => {
                  if (uploadMode !== 'text') {
                    setAnimationDirection('right');
                    setUploadMode('text');
                  }
                }}
              >
                <FileCode size={16} />
                <span>Drop Raw Text</span>
              </button>
            </div>

            {/* Fluid Animated Content Panel */}
            <div
              key={uploadMode}
              className={`fluid-panel ${animationDirection === 'right' ? 'fluid-slide-right' : 'fluid-slide-left'}`}
            >
              {/* Mode 1: File Dropzone & Queue */}
              {uploadMode === 'files' ? (
                <div className="sender-files-layout">
                  <DropZone
                    onFilesAdded={addFiles}
                    onSwitchToText={() => {
                      setAnimationDirection('right');
                      setUploadMode('text');
                    }}
                  />

                  <UploadQueue
                    files={selectedFiles}
                    isUploading={isUploading}
                    onRemoveFile={removeFile}
                    onClearQueue={clearQueue}
                    onUploadAll={uploadAllFiles}
                  />
                </div>
              ) : (
                /* Mode 2: Raw Text Drop */
                <RawTextEditor
                  textTitle={textTitle}
                  onTextTitleChange={setTextTitle}
                  rawText={rawText}
                  onRawTextChange={setRawText}
                  isUploading={isUploading}
                  deskTitle={deskTitle}
                  onPasteClipboard={pasteClipboardText}
                  onUploadRawText={uploadRawText}
                  onAddTextToQueue={addTextToQueue}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SenderUpload;
