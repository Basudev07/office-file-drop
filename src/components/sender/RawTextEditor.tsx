import React from 'react';
import { formatBytes } from '../../utils/formatters';
import { ClipboardCopy, Trash2, Send, Plus } from 'lucide-react';

interface RawTextEditorProps {
  textTitle: string;
  onTextTitleChange: (title: string) => void;
  rawText: string;
  onRawTextChange: (text: string) => void;
  isUploading: boolean;
  deskTitle: string;
  onPasteClipboard: () => void;
  onUploadRawText: () => void;
  onAddTextToQueue: () => void;
}

export const RawTextEditor: React.FC<RawTextEditorProps> = ({
  textTitle,
  onTextTitleChange,
  rawText,
  onRawTextChange,
  isUploading,
  deskTitle,
  onPasteClipboard,
  onUploadRawText,
  onAddTextToQueue,
}) => {
  const byteSize = new Blob([rawText]).size;
  const lineCount = rawText ? rawText.split('\n').length : 0;

  return (
    <div className="raw-text-container">
      <div className="input-group" style={{ marginBottom: '10px' }}>
        <label className="input-label" style={{ justifyContent: 'space-between' }}>
          <span>Note / Code Title (Optional)</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Preserves 100% exact format</span>
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Server Credentials, SQL Query, Meeting Notes, WiFi Password"
          value={textTitle}
          onChange={(e) => onTextTitleChange(e.target.value)}
          disabled={isUploading}
        />
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          className="raw-textarea"
          placeholder="Type or paste any text or code here...&#10;&#10;Exact indentation, spacing, tabs, line breaks, code snippets, emojis, and symbols are preserved without alteration."
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          disabled={isUploading}
          spellCheck={false}
        />
      </div>

      {/* Toolbar: Counters & Quick Actions */}
      <div className="raw-text-toolbar">
        <div className="raw-text-stats">
          <span>{rawText.length.toLocaleString()} chars</span>
          <span>•</span>
          <span>{lineCount} lines</span>
          <span>•</span>
          <span>{formatBytes(byteSize)}</span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm touch-target"
            onClick={onPasteClipboard}
            title="Paste from clipboard"
          >
            <ClipboardCopy size={14} />
            <span>Paste Clipboard</span>
          </button>

          {rawText && (
            <button
              type="button"
              className="btn btn-secondary btn-sm touch-target"
              onClick={() => onRawTextChange('')}
              title="Clear text"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="raw-text-actions">
        <button
          type="button"
          className="btn btn-primary btn-upload-main"
          onClick={onUploadRawText}
          disabled={isUploading || !rawText.trim()}
          style={{ flex: 1 }}
        >
          {isUploading ? (
            <>
              <div className="status-dot" style={{ backgroundColor: '#fff' }} />
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
          onClick={onAddTextToQueue}
          disabled={isUploading || !rawText.trim()}
          title="Add this text note to file queue to drop alongside other files"
        >
          <Plus size={16} />
          <span className="hide-mobile">Add to Queue</span>
        </button>
      </div>
    </div>
  );
};
