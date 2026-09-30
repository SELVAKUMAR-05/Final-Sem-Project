import React, { useState } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext.tsx';
import { UserRole } from '../types.ts';
import {
  Lock,
  User,
  Key,
  ShieldCheck,
  AlertCircle,
  X,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, switchRoleShortcut } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      await login(username, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid government personnel credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setError(null);
    try {
      setIsLoading(true);
      await switchRoleShortcut(role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 200 }}>
      <div className="modal-dialog" style={{ maxWidth: '520px' }}>
        <div className="modal-header" style={{ background: '#ffffff', color: '#000000' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={22} color="#000000" />
            <div>
              <div style={{ fontSize: '10px', color: '#000000', letterSpacing: '0.05em', fontWeight: 900 }}>
                GOVERNMENT OF INDIA &bull; MHA
              </div>
              <span className="modal-title" style={{ color: '#000000', fontSize: '16px' }}>
                NCRB Personnel Authentication
              </span>
            </div>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer', fontWeight: 900 }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="gov-alert danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Access Bar */}
          <div style={{ background: '#141414', padding: '14px', border: '2px solid #ffffff', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#00ff00', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase' }}>
              <ShieldCheck size={16} color="#00ff00" />
              1-CLICK DEMO AUTHENTICATION (DEMO 1):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {(Object.keys(DEMO_CREDENTIALS) as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className="btn-gov btn-gov-outline btn-gov-sm"
                  style={{ fontSize: '11px', justifyContent: 'flex-start', textAlign: 'left' }}
                  onClick={() => handleQuickDemoLogin(r)}
                  disabled={isLoading}
                >
                  &bull; {r.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Personnel Official Email:</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#a3a3a3' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="name@secure-dms.local"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Security Passcode / Secret:</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#a3a3a3' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-gov btn-gov-blue"
              style={{ width: '100%', marginTop: '12px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Vault'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
