import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { NavTab } from './Sidebar.tsx';
import {
  Award,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  FileText,
  Briefcase,
  Key,
  Layers,
  History,
  Lock,
} from 'lucide-react';

interface HackathonDemoGuideProps {
  setActiveTab: (tab: NavTab) => void;
}

export const HackathonDemoGuide: React.FC<HackathonDemoGuideProps> = ({ setActiveTab }) => {
  const { currentUser, switchRoleShortcut } = useAuth();

  const demos = [
    {
      num: 1,
      title: 'Authentication & Multi-Role RBAC',
      desc: 'Verify 6 distinct user roles (ADMIN, POLICE_OFFICER, INVESTIGATION_OFFICER, FORENSIC_OFFICER, LAWYER, COURT_OFFICER). Observe customized dashboards.',
      actionText: 'Switch to Police Officer',
      onAction: async () => {
        await switchRoleShortcut('POLICE_OFFICER');
        setActiveTab('dashboard');
      },
      tag: 'Section 4, 16',
    },
    {
      num: 2,
      title: 'Case Management Ledger',
      desc: 'Inspect existing cases (CASE-2026-001, CASE-2026-002, CASE-2026-003). Register a new investigation case with crime type and priority.',
      actionText: 'Open Cases Ledger',
      onAction: () => setActiveTab('cases'),
      tag: 'Section 5',
    },
    {
      num: 3,
      title: 'Secure Document Ingress & SHA-256 Hashing',
      desc: 'Upload a new document (FIR, Police Report, or Evidence). Check real-time SHA-256 generation, sanitization to DOC-xxxx, and AES encryption.',
      actionText: 'Open Upload Station',
      onAction: () => setActiveTab('upload'),
      tag: 'Section 7, 8',
    },
    {
      num: 4,
      title: 'Inspect Metadata & OCR Extraction',
      desc: 'Open any document to inspect full cryptographic metadata, storage path, digital signature state, and Apache Tika / Tesseract OCR extracted text.',
      actionText: 'Open Document Vault',
      onAction: () => setActiveTab('documents'),
      tag: 'Section 12, 13',
    },
    {
      num: 5,
      title: 'Binary Download with Audit Record',
      desc: 'Download original file. Verify download security check and instantaneous logging into the immutable audit trail.',
      actionText: 'Download from Vault',
      onAction: () => setActiveTab('documents'),
      tag: 'Section 7, 10',
    },
    {
      num: 6,
      title: 'Append-Only Version Control',
      desc: 'Upload a new version of an existing document. Verify Version v2 is registered, and older Version v1 remains preserved and immutable.',
      actionText: 'View Document Versions',
      onAction: () => setActiveTab('documents'),
      tag: 'Section 11',
    },
    {
      num: 7,
      title: 'SHA-256 Integrity Verification & Tamper Lab',
      desc: '1) Verify authentic file -> GREEN (VALID). 2) Click "Simulate Malicious Disk Tampering". 3) Re-verify -> RED (TAMPERED Alert). 4) Click "Restore" -> GREEN (VALID).',
      actionText: 'Open Tamper & Integrity Lab',
      onAction: () => setActiveTab('integrity'),
      tag: 'Section 9',
      highlight: true,
    },
    {
      num: 8,
      title: 'Role-Based Access Denial (403 Forbidden)',
      desc: 'Switch role to LAWYER. Attempt to inspect restricted Police/Investigator internal records. Observe immediate 403 Forbidden denial and security violation logging.',
      actionText: 'Trigger Demo 8 (Switch to Lawyer)',
      onAction: async () => {
        await switchRoleShortcut('LAWYER');
        setActiveTab('documents');
      },
      tag: 'Section 6, 8',
      highlight: true,
    },
    {
      num: 9,
      title: 'Immutable Audit Trail & Compliance Export',
      desc: 'Switch to ADMIN or COURT_OFFICER. Inspect complete event ledger (uploads, downloads, tamper tests, access denials). Export to CSV.',
      actionText: 'View Audit Trail (Admin/Court)',
      onAction: async () => {
        await switchRoleShortcut('ADMIN');
        setActiveTab('audit-logs');
      },
      tag: 'Section 10',
    },
  ];

  return (
    <div className="hackathon-guide-view" id="ncrb-demo-guide">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          <Award size={26} color="#00ff00" />
          Hackathon Evaluation Guide &bull; DEMO 1 to DEMO 9 Interactive Suite
        </h2>
        <p style={{ color: '#a3a3a3', fontSize: '13px', marginTop: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
          Direct step-by-step verification flows mapped to the Smart India Hackathon problem statement.
        </p>
      </div>

      {/* Grid of Demos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
        {demos.map((d) => (
          <div
            key={d.num}
            className="gov-card"
            style={{
              marginBottom: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: d.highlight ? '2px solid #00ff00' : '2px solid #ffffff',
              boxShadow: d.highlight ? '5px 5px 0px #00ff00' : '4px 4px 0px rgba(255,255,255,0.2)',
              background: d.highlight ? '#121212' : '#0a0a0a',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, color: d.highlight ? '#000000' : '#00ff00', background: d.highlight ? '#00ff00' : '#1a1a1a', padding: '3px 8px', border: '1px solid #ffffff', textTransform: 'uppercase' }}>
                  DEMO {d.num} &bull; {d.tag}
                </span>
                {d.highlight && (
                  <span style={{ fontSize: '10px', background: '#ef4444', color: '#000000', padding: '2px 6px', fontWeight: 900, textTransform: 'uppercase', border: '1px solid #ffffff' }}>
                    CORE JUDGING HIGHLIGHT
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', marginBottom: '8px', textTransform: 'uppercase' }}>
                {d.title}
              </h3>

              <p style={{ fontSize: '12.5px', color: '#a3a3a3', lineHeight: 1.5, marginBottom: '16px' }}>
                {d.desc}
              </p>
            </div>

            <button
              className={`btn-gov ${d.highlight ? 'btn-gov-blue' : 'btn-gov-outline'}`}
              onClick={d.onAction}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>{d.actionText}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
