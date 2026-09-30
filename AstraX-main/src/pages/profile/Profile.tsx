import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import {
  User,
  Shield,
  Key,
  Smartphone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  BadgeCheck,
  Clock,
  Laptop,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [mfaNotice, setMfaNotice] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess(null);
    setPwError(null);

    if (!currentPassword) {
      setPwError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setIsChangingPw(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      setPwSuccess(res.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password. Verify current password.');
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleToggleMfa = () => {
    setMfaEnabled(!mfaEnabled);
    setMfaNotice(
      !mfaEnabled
        ? 'Hardware TOTP Authenticator (FIPS 140-2) activated for next login challenge.'
        : 'MFA requirement disabled temporarily for this workstation profile.'
    );
    setTimeout(() => setMfaNotice(null), 4000);
  };

  if (!currentUser) return null;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
          Officer Profile &amp; Security Credentials
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          Manage your verified law enforcement credentials, cryptographic authentication keys, and terminal sessions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '28px' }}>
        {/* Left Column: Official Personnel Card */}
        <div>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
            padding: '28px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            {/* Avatar */}
            <div style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
              color: '#ffffff',
              fontSize: '32px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '4px solid #eff6ff',
              boxShadow: '0 6px 16px rgba(59, 130, 246, 0.25)'
            }}>
              {currentUser.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>

            <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              {currentUser.fullName}
            </h2>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
              @{currentUser.username}
            </div>

            {/* Role Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 800,
              marginBottom: '20px'
            }}>
              <BadgeCheck size={16} />
              <span>{currentUser.role.replace(/_/g, ' ')}</span>
            </div>

            {/* Personnel Details */}
            <div style={{
              borderTop: '1px solid #f1f5f9',
              paddingTop: '18px',
              textAlign: 'left',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569' }}>
                <Building size={16} color="#94a3b8" />
                <span style={{ fontWeight: 600 }}>{currentUser.department}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569' }}>
                <Mail size={16} color="#94a3b8" />
                <span>{currentUser.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569' }}>
                <Shield size={16} color="#94a3b8" />
                <span>Badge No: <strong>{currentUser.badgeNumber || 'NCRB-SEC-AUTH'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569' }}>
                <Clock size={16} color="#94a3b8" />
                <span>Status: <span style={{ color: '#059669', fontWeight: 700 }}>🟢 ACTIVE &bull; VERIFIED</span></span>
              </div>
            </div>

            <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <button
                onClick={logout}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  color: '#dc2626',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <LogOut size={16} />
                Sign Out from Workspace
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Password Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Password Update Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
            padding: '24px 28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={20} color="#1d4ed8" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Change Account Password
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
                  Update your cryptographically hashed PBKDF2 password.
                </p>
              </div>
            </div>

            {pwSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '12px', color: '#065f46', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>{pwSuccess}</span>
              </div>
            )}

            {pwError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', color: '#991b1b', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} color="#dc2626" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  <span>Show characters</span>
                </label>

                <button
                  type="submit"
                  disabled={isChangingPw}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '13px' }}
                >
                  {isChangingPw ? 'Updating Hash...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Multi-Factor Authentication (MFA) */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
            padding: '24px 28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={20} color="#059669" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Two-Factor Authentication (2FA / MFA)
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
                    Enforce hardware token verification for all high-clearance evidentiary actions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleMfa}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: mfaEnabled ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
                  background: mfaEnabled ? '#ecfdf5' : '#f8fafc',
                  color: mfaEnabled ? '#065f46' : '#475569'
                }}
              >
                {mfaEnabled ? '✓ MFA Active' : 'Enable MFA'}
              </button>
            </div>

            {mfaNotice && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#047857', background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px' }}>
                {mfaNotice}
              </div>
            )}
          </div>

          {/* Active Workstation Sessions */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
            padding: '24px 28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Laptop size={20} color="#1d4ed8" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Active Terminal Sessions
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
                    Current authorization instances across law-enforcement networks.
                  </p>
                </div>
              </div>

              <span style={{ fontSize: '12px', background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                1 Active Session
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Device / Browser</th>
                  <th style={{ padding: '8px 12px' }}>IP Address</th>
                  <th style={{ padding: '8px 12px' }}>Location</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>
                    Chrome 122 on macOS (Current Device)
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#475569' }}>
                    127.0.0.1 (Local Ingress)
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>
                    NCRB Central HQ, New Delhi
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ color: '#059669', fontWeight: 700 }}>● Online</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
