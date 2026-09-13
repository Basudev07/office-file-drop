import React from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';

interface TransferSuccessProps {
  deskTitle: string;
  onReset: () => void;
}

export const TransferSuccess: React.FC<TransferSuccessProps> = ({ deskTitle, onReset }) => {
  return (
    <div className="transfer-success-card">
      <div className="success-icon-wrap">
        <CheckCircle2 size={42} />
      </div>

      <h2 className="success-title">Transfer Complete!</h2>
      <p className="success-subtitle">
        Your transfer was delivered directly to <strong>{deskTitle}</strong> in real time.
      </p>

      <button
        type="button"
        className="btn btn-primary btn-touch"
        onClick={onReset}
        style={{ margin: '0 auto' }}
      >
        <RefreshCw size={16} />
        <span>Drop More Files or Text</span>
      </button>
    </div>
  );
};
