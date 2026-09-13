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
      {/* Top Header Row: Compact Title & Quick Action Buttons */}
      <div className="raw-text-header-row">
        <input
          type="text"
          className="input-field raw-title-input"
          placeholder="Note / Code Title (Optional)..."
          value={textTitle}
          onChange={(e) => onTextTitleChange(e.target.value)}
          disabled={isUploading}
        />

        <div className="raw-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={onPasteClipboard}
            title="Paste from clipboard"
          >
            <ClipboardCopy size={13} />
            <span>Paste</span>
          </button>

          {rawText && (
            <button
              type="button"
              className="btn btn-secondary btn-xs btn-clear-text"
              onClick={() => onRawTextChange('')}
              title="Clear text"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Textarea filling flexible height */}
      <div className="raw-textarea-wrap">
        <textarea
          className="raw-textarea"
          placeholder="Type or paste any text or code here... Exact spacing, line breaks, tabs, and indentation are preserved."
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          disabled={isUploading}
          spellCheck={false}
        />
      </div>

      {/* Bottom Bar: Stats on left, Send & Queue actions on right */}
      <div className="raw-text-bottom-bar">
        <div className="raw-text-stats">
          <span>{rawText.length.toLocaleString()} chars</span>
          <span>•</span>
          <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
          <span className="hide-mobile">•</span>
          <span className="hide-mobile">{formatBytes(byteSize)}</span>
        </div>

        <div className="raw-text-actions">
          <button
            type="button"
            className="btn btn-secondary btn-raw-queue"
            onClick={onAddTextToQueue}
            disabled={isUploading || !rawText.trim()}
            title="Add note to file queue"
          >
            <Plus size={13} />
            <span className="hide-mobile">Add to Queue</span>
            <span className="show-mobile-inline">Queue</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-raw-send"
            onClick={onUploadRawText}
            disabled={isUploading || !rawText.trim()}
          >
            {isUploading ? (
              <span>Dropping to {deskTitle}...</span>
            ) : (
              <>
                <Send size={13} />
                <span className="hide-mobile">Drop Raw Text Now</span>
                <span className="show-mobile-inline">Drop Text</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
