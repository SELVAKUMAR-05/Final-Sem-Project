import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  FileCheck2,
  Database,
  Fingerprint,
  Scale,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login, unauthorizedAlert } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState<string>('admin@secure-dms.local');
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(unauthorizedAlert || null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fromLocation = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setErrorMessage('Please enter your official username or registered email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(trimmedUser, password);
      navigate(fromLocation, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.status === 401) {
        setErrorMessage('Invalid username or password. Please verify your official credentials.');
      } else if (err.status === 403) {
        setErrorMessage('Your account has been disabled or suspended. Please contact the NCRB administrator.');
      } else if (err.status === 404) {
        setErrorMessage('Account not found with this username/email.');
      } else {
        setErrorMessage(err.message || 'Unable to connect to the security authentication gateway. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemoUser = (role: UserRole) => {
    const cred = DEMO_CREDENTIALS[role];
    setUsername(cred.username);
    setPassword(cred.pass);
    setErrorMessage(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f8fafc',
      fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* LEFT SIDE: Government & Security Branding */}
      <div style={{
        flex: '1 1 52%',
        background: 'linear-gradient(145deg, #07162c 0%, #0b2545 60%, #133b68 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 64px',
        position: 'relative',
        overflow: 'hidden'
      }} className="login-branding-panel">
        
        {/* Decorative Grid Lines Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(rgba(59, 130, 246, 0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.8,
          pointerEvents: 'none'
        }} />

        {/* Top Header Logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px -4px rgba(59, 130, 246, 0.4)'
            }}>
              <ShieldCheck size={26} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.8px', color: '#93c5fd', textTransform: 'uppercase' }}>
                MINISTRY OF HOME AFFAIRS &bull; GOVT OF INDIA
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.3px', color: '#ffffff' }}>
                NCRB SECURE EVIDENCE VAULT
              </div>
            </div>
          </div>
        </div>

        {/* Center Hero Mission Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '580px', margin: '48px 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(147, 197, 253, 0.3)',
            borderRadius: '9999px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#bfdbfe',
            marginBottom: '20px'
          }}>
            <Fingerprint size={15} color="#60a5fa" />
            <span>FIPS 180-4 &bull; SECTION 65B(4) COMPLIANT</span>
          </div>

          <h1 style={{
            fontSize: '34px',
            fontWeight: 800,
            lineHeight: 1.25,
            color: '#ffffff',
            letterSpacing: '-0.8px',
            marginBottom: '16px'
          }}>
            SECURE DIGITAL EVIDENCE<br />
            <span style={{ color: '#60a5fa' }}>&amp; LEGAL DOCUMENT MANAGEMENT</span>
          </h1>

          <p style={{
            fontSize: '17px',
            fontWeight: 500,
            fontStyle: 'italic',
            color: '#93c5fd',
            marginBottom: '28px'
          }}>
            "Secure Documents. Trusted Evidence. Faster Justice."
          </p>

          <p style={{
            fontSize: '14px',
            lineHeight: 1.7,
            color: '#cbd5e1',
            marginBottom: '36px'
          }}>
            A unified digital intelligence and evidentiary repository architected for national law-enforcement,
            Central Forensic Science Laboratories (CFSL), investigative officers, and judicial registries.
          </p>

          {/* Key Architectural Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <Lock size={18} color="#60a5fa" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>AES-256-GCM Encryption</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Zero-trust encryption at rest and in transit</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <FileCheck2 size={18} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Chained Audit Ledger</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Cryptographically linked SHA-256 blocks</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <Database size={18} color="#fbbf24" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Chain of Custody</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Immutable forensic transfer tracking</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <Scale size={18} color="#a78bfa" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Judicial Admissibility</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Automated Section 65B(4) certification</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security Notice */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <div>Authorized National Security System &bull; Information Technology Act 2000</div>
          <div>Node ID: NCRB-HQ-DEL-SEC-01</div>
        </div>
      </div>

      {/* RIGHT SIDE: Sign In Card */}
      <div style={{
        flex: '1 1 48%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 40px',
        overflowY: 'auto'
      }}>
        <div style={{
          maxWidth: '460px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
          padding: '36px'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 10px',
              background: '#eff6ff',
              color: '#1d4ed8',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}>
              SECURE PORTAL ACCESS
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', margin: 0 }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px', marginBottom: 0 }}>
              Sign in with your official government credentials to access your workspace.
            </p>
          </div>

          {/* Inline Error Alert */}
          {errorMessage && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '20px',
              color: '#991b1b',
              fontSize: '13px',
              lineHeight: 1.5
            }}>
              <AlertCircle size={18} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit}>
            {/* Username / Email */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '6px'
              }}>
                Official Email or Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. officer@ncrb.local or admin@secure-dms.local"
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: '#ffffff',
                    color: '#0f172a',
                    boxSizing: 'border-box'
                  }}
                  autoComplete="username"
                  required
                />
                <User
                  size={18}
                  color="#94a3b8"
                  style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1e293b'
                }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: '12px', fontWeight: 600, color: '#1d4ed8', textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 40px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: '#ffffff',
                    color: '#0f172a',
                    boxSizing: 'border-box'
                  }}
                  autoComplete="current-password"
                  required
                />
                <Lock
                  size={18}
                  color="#94a3b8"
                  style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#475569',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ borderRadius: '4px', cursor: 'pointer' }}
                />
                <span>Remember this terminal session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                background: isSubmitting ? '#93c5fd' : '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)'
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  <span>Authenticating &amp; Generating JWT...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN TO WORKSPACE</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '13px',
            color: '#64748b'
          }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ color: '#1d4ed8', fontWeight: 700, textDecoration: 'none' }}
            >
              Request Access / Sign Up
            </Link>
          </div>

          {/* Quick Demo Accounts Selection (For Hackathon & Verification) */}
          <div style={{
            marginTop: '24px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>
                DEMO CREDENTIALS (CLICK TO PREFILL):
              </span>
              <span style={{ fontSize: '10px', color: '#64748b', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                Quick Test
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {(Object.keys(DEMO_CREDENTIALS) as UserRole[]).map((r) => {
                const cred = DEMO_CREDENTIALS[r];
                const isCurrent = username === cred.username;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleSelectDemoUser(r)}
                    style={{
                      padding: '8px 10px',
                      background: isCurrent ? '#eff6ff' : '#ffffff',
                      border: isCurrent ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                      borderRadius: '6px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '11px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: isCurrent ? '#1d4ed8' : '#1e293b' }}>
                      {r.replace('_', ' ')}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cred.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
