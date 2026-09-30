import React, { useState } from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { useToast } from '../../components/common/Toast.tsx';
import {
  Sliders,
  ShieldCheck,
  Bell,
  Eye,
  Lock,
  Save
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();

  const [sessionTimeout, setSessionTimeout] = useState<number>(30);
  const [enforceMfa, setEnforceMfa] = useState<boolean>(true);
  const [autoOcr, setAutoOcr] = useState<boolean>(true);
  const [watermarkLevel, setWatermarkLevel] = useState<string>('HIGH');
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [tamperAlerts, setTamperAlerts] = useState<boolean>(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Platform security configuration updated', 'success');
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'System & Security Settings' }]} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
            System &amp; Security Settings
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Configure evidentiary compliance policies, session timeouts, automated watermarking, and alert webhooks.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Security & Access Policies */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Lock size={20} color="#1d4ed8" />
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Access Control &amp; Session Policies
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Mandatory Multi-Factor Authentication (MFA)
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Enforce hardware FIDO2 or TOTP biometric authentication on every officer sign-in.
                </div>
              </div>
              <input
                type="checkbox"
                checked={enforceMfa}
                onChange={(e) => setEnforceMfa(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Inactivity Session Lockdown (Minutes)
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Automatically lock the terminal if no user interaction is detected.
                </div>
              </div>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Evidentiary Watermarking & AI Analysis */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Eye size={20} color="#1d4ed8" />
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Forensic Watermarking &amp; OCR Engine
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Automatic OCR &amp; Entity Classification
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Automatically parse FIRs and statements for suspect names, IPC/BNS sections, and crime scenes.
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoOcr}
                onChange={(e) => setAutoOcr(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Document Export Watermark Density
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Include viewing officer's badge number and timestamp on all decrypted PDF views.
                </div>
              </div>
              <select
                value={watermarkLevel}
                onChange={(e) => setWatermarkLevel(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value="HIGH">High (Full diagonal + header/footer)</option>
                <option value="STANDARD">Standard (Header &amp; footer only)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Notification Subscriptions */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Bell size={20} color="#1d4ed8" />
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Alert &amp; Anomaly Notification Preferences
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Instant Tamper Alerts (SMS / Critical Dispatch)
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Immediate notification if any file hash or evidence seal fails periodic ledger validation.
                </div>
              </div>
              <input
                type="checkbox"
                checked={tamperAlerts}
                onChange={(e) => setTamperAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Document Workflow Status Notifications
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Alerts when assigned court filings are approved, rejected, or signed by magistrates.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
