import React from 'react';
import { ShieldCheck, User } from 'lucide-react';

interface SenderHeaderProps {
  deskTitle: string;
  senderName: string;
  onSenderNameChange: (name: string) => void;
  disabled: boolean;
}

export const SenderHeader: React.FC<SenderHeaderProps> = ({
  deskTitle,
  senderName,
  onSenderNameChange,
  disabled,
}) => {
  return (
    <div className="sender-header-section">
      <div className="sender-badge-wrap">
        <div className="sender-badge">
          <ShieldCheck size={16} />
          <span>Internal Zero-Login Transfer</span>
        </div>
        <h1 className="sender-title">Drop Files to {deskTitle}</h1>
        <p className="sender-subtitle">
          Select files, take a photo, or paste raw text. <br/> Transfers arrive directly at the desk in real time.
        </p>
      </div>

      <div className="input-group" style={{ marginBottom: '18px' }}>
        <label className="input-label">
          <User size={15} />
          <span>Your Name or Department</span>
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Sarah (Design), Alex M., or Finance Team"
          value={senderName}
          onChange={(e) => onSenderNameChange(e.target.value)}
          disabled={disabled}
          required
        />
      </div>
    </div>
  );
};
