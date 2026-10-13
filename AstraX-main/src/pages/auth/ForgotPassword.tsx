import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid official registered email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Unable to submit reset request. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #07162c 0%, #0b2545 60%, #133b68 100%)',
      padding: '32px',
      fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)',
        padding: '36px',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#07162c',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <img src="/astrax-logo.png" alt="AstraX Evidence Wallet" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            Forgot your password?
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Enter your registered official email address to initiate password recovery protocols.
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '20px',
            color: '#991b1b',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {submitted ? (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#065f46', marginBottom: '8px' }}>
              Reset Instructions Sent
            </div>
            <p style={{ fontSize: '13px', color: '#047857', lineHeight: 1.6, margin: 0 }}>
              If an account exists with <strong>{email}</strong>, official password reset instructions and an encrypted one-time verification link have been dispatched.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                Official Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@ncrb.local"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 36px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    boxSizing: 'border-box'
                  }}
                  required
                />
                <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

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
                marginBottom: '20px'
              }}
            >
              {isSubmitting ? 'Verifying with Directory...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#1d4ed8',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
