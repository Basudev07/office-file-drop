import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Supabase Email & Password sign-in
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      onAuthSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMessage(error.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={18} />
            </div>
            <h2 className="modal-title">Desk Receiver Sign In</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '20px' }}>
          Sign in to access the Receiver Station, view real-time drops, print, and manage transfers.
        </p>

        {errorMessage && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">
              <Mail size={14} />
              <span>Receiver Email</span>
            </label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="e.g. receiver@office.internal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label className="input-label">
              <Lock size={14} />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', minHeight: '44px' }}
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Receiver'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
