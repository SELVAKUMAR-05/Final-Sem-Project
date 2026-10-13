import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';
import {
  User,
  Mail,
  Building,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Check,
  ArrowRight,
  Shield
} from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<UserRole>('POLICE_OFFICER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength calculations
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabel = strengthScore <= 2 ? 'Weak' : strengthScore <= 4 ? 'Medium' : 'Strong';
  const strengthColor = strengthScore <= 2 ? '#ef4444' : strengthScore <= 4 ? '#f59e0b' : '#10b981';

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please provide your official Full Name.');
      return;
    }
    if (!username.trim()) {
      setErrorMessage('Please enter an official Username.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid official Email address.');
      return;
    }
    if (!department.trim()) {
      setErrorMessage('Department/Station name is required.');
      return;
    }
    if (!role) {
      setErrorMessage('Please designate your authorized operational role.');
      return;
    }
    if (role === 'ADMIN') {
      setErrorMessage('Administrator accounts cannot be self-registered. Contact IT Security.');
      return;
    }
    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber) {
      setErrorMessage('Password does not satisfy minimum complexity criteria.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        department: department.trim(),
        role,
        password,
      });

      setSuccessMessage(res.message || 'Registration submitted successfully! You can now log in.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to complete registration. Please verify details or try another username.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page" style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f8fafc',
      fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* LEFT SIDE: Government Security Policies */}
      <div style={{
        flex: '1 1 45%',
        background: 'linear-gradient(145deg, #07162c 0%, #0b2545 60%, #133b68 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 64px',
        position: 'relative',
        overflow: 'hidden'
      }} className="login-branding-panel">
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              background: '#07162c',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src="/astrax-logo.png" alt="AstraX Evidence Wallet" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.8px', color: '#93c5fd', textTransform: 'uppercase' }}>
                MINISTRY OF HOME AFFAIRS &bull; GOVT OF INDIA
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.3px', color: '#ffffff' }}>
                AstraX Evidence Wallet
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '520px', margin: '40px 0' }}>
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
            <Shield size={14} color="#60a5fa" />
            <span>PERSONNEL VETTING PROTOCOL</span>
          </div>

          <h1 style={{
            fontSize: '30px',
            fontWeight: 800,
            lineHeight: 1.3,
            color: '#ffffff',
            letterSpacing: '-0.5px',
            marginBottom: '16px'
          }}>
            Official Law Enforcement &amp; Judicial Registration
          </h1>

          <p style={{
            fontSize: '14px',
            lineHeight: 1.7,
            color: '#cbd5e1',
            marginBottom: '28px'
          }}>
            Access to this repository is restricted to authorized state police personnel, Central Forensic Science Laboratories, investigating agencies, and enrolled judicial advocates.
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '18px',
            fontSize: '13px',
            color: '#e2e8f0',
            lineHeight: 1.6
          }}>
            <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: '6px' }}>
              &bull; Strict Role Isolation (RBAC)
            </div>
            Every uploaded record and chain-of-custody handoff is cryptographically sealed with the officer's digital identity and verifiable under Section 65B(4) of the Indian Evidence Act.
          </div>
        </div>

        <div style={{
          position: 'relative',
          zIndex: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '20px',
          fontSize: '12px',
          color: '#64748b'
        }}>
          National Crime Records Bureau &bull; Directorate of Forensic Science Services
        </div>
      </div>

      {/* RIGHT SIDE: Registration Form */}
      <div style={{
        flex: '1 1 55%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 32px',
        overflowY: 'auto'
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
          padding: '36px'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', margin: 0 }}>
              Create your account
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px', marginBottom: 0 }}>
              Request secure access to the Digital Evidence Platform.
            </p>
          </div>

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
              fontSize: '13px'
            }}>
              <AlertCircle size={18} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '20px',
              color: '#065f46',
              fontSize: '13px'
            }}>
              <CheckCircle2 size={18} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>{successMessage}</strong>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Redirecting to sign in portal...</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name & Username */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '5px' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Insp. Rajesh Kumar"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                  <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '5px' }}>
                  Username *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. rkumar"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                  <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
            </div>

            {/* Email & Department */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '5px' }}>
                  Official Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@police.gov.in"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '5px' }}>
                  Department / Unit *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Crime Branch Delhi"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                  <Building size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
            </div>

            {/* Role Requested */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '5px' }}>
                Operational Role Requested *
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  <option value="POLICE_OFFICER">Police Officer (First Responder &amp; Seizure)</option>
                  <option value="INVESTIGATION_OFFICER">Investigation Officer (Lead Detective / DSP)</option>
                  <option value="FORENSIC_OFFICER">Forensic Officer (CFSL Laboratory Analyst)</option>
                  <option value="LAWYER">Prosecution / Defense Advocate</option>
                  <option value="COURT_OFFICER">Court Officer / Judicial Registrar</option>
                </select>
                <Briefcase size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                * Administrator roles require direct keymaster provisioning by system security admins.
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                  Password *
                </label>
                {password && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: strengthColor }}>
                    Strength: {strengthLabel}
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters with upper, lower, number"
                  style={{
                    width: '100%',
                    padding: '10px 36px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    boxSizing: 'border-box'
                  }}
                  required
                />
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Rules Indicators */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: hasMinLength ? '#10b981' : '#64748b' }}>
                  {hasMinLength ? <Check size={12} /> : '○'} At least 8 characters
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: hasUpper ? '#10b981' : '#64748b' }}>
                  {hasUpper ? <Check size={12} /> : '○'} One uppercase letter
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: hasLower ? '#10b981' : '#64748b' }}>
                  {hasLower ? <Check size={12} /> : '○'} One lowercase letter
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: hasNumber ? '#10b981' : '#64748b' }}>
                  {hasNumber ? <Check size={12} /> : '○'} One numerical digit
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '5px' }}>
                Confirm Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: `1px solid ${confirmPassword ? (passwordsMatch ? '#10b981' : '#ef4444') : '#cbd5e1'}`,
                    boxSizing: 'border-box'
                  }}
                  required
                />
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              {confirmPassword && !passwordsMatch && (
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                  Passwords do not match.
                </div>
              )}
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
                  <span>Submitting Registration Request...</span>
                </>
              ) : (
                <>
                  <span>CREATE ACCOUNT</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '13px',
            color: '#64748b'
          }}>
            Already have an authorized account?{' '}
            <Link
              to="/login"
              style={{ color: '#1d4ed8', fontWeight: 700, textDecoration: 'none' }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
