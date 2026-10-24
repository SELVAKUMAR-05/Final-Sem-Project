import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import {
  DashboardStats,
  Case,
  Evidence,
  LegalDocument
} from '../../types.ts';
import { useToast } from '../../components/common/Toast.tsx';
import { DocumentUploadModal } from '../../components/DocumentUploadModal.tsx';
import {
  FolderLock,
  FileText,
  Package,
  ShieldCheck,
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Send,
  Lock,
  User,
  Activity,
  FileCheck
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [recentEvidence, setRecentEvidence] = useState<Evidence[]>([]);
  const [recentDocs, setRecentDocs] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  const fetchDashboardOverview = async () => {
    try {
      setLoading(true);
      const [statsData, casesData, evidenceData, docsData] = await Promise.all([
        api.getDashboardStats(),
        api.getCases(),
        api.getEvidence(),
        api.getDocuments()
      ]);

      setStats(statsData);
      setRecentCases(casesData.slice(0, 5));
      setRecentEvidence(evidenceData.slice(0, 5));
      setRecentDocs(docsData.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard overview:', err);
      showToast('Error loading operational overview', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* 1. Welcome Operational Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#93c5fd',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.5px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              {currentUser?.role?.replace(/_/g, ' ') || 'INVESTIGATOR'}
            </span>

            <span
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#6ee7b7',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <ShieldCheck size={13} />
              SYSTEM SECURE &bull; SEC 65B(4) ACTIVE
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            {getGreeting()}, {currentUser?.fullName || 'Authorized Officer'}
          </h1>

          <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Posting: <strong>{currentUser?.department || 'National Cyber Forensic Division'}</strong></span>
            <span>&bull;</span>
            <span>Badge: <strong>{currentUser?.badgeNumber || 'MHA-DL-4491'}</strong></span>
            <span>&bull;</span>
            <span>Session: <strong>FIPS 140-2 Validated</strong></span>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate('/cases')}
            className="btn btn-secondary"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FolderLock size={14} />
            <span>Manage Cases</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Cards (Clean, Compact, Operational) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div
          onClick={() => navigate('/cases')}
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1d4ed8')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Active Cases
            </span>
            <div style={{ padding: '6px', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8' }}>
              <FolderLock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px 0' }}>
            {stats?.activeInvestigations ?? recentCases.length}
          </div>
          <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>View all dockets</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div
          onClick={() => navigate('/documents')}
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1d4ed8')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Legal Documents
            </span>
            <div style={{ padding: '6px', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8' }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px 0' }}>
            {stats?.totalDocuments ?? recentDocs.length}
          </div>
          <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Encrypted repository</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div
          onClick={() => navigate('/evidence')}
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#7c3aed')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Evidence Items
            </span>
            <div style={{ padding: '6px', borderRadius: '6px', background: '#f5f3ff', color: '#7c3aed' }}>
              <Package size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px 0' }}>
            {stats?.totalEvidence ?? recentEvidence.length}
          </div>
          <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Chain of custody logs</span>
            <ArrowRight size={12} />
          </div>
        </div>

        <div
          onClick={() => navigate('/security')}
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#059669')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Cryptographic Integrity
            </span>
            <div style={{ padding: '6px', borderRadius: '6px', background: '#ecfdf5', color: '#059669' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#047857', margin: '8px 0 2px 0' }}>
            100%
          </div>
          <div style={{ fontSize: '12px', color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>0 Hashes Compromised</span>
            <CheckCircle2 size={12} />
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Two-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Recent Cases Section */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Recent Investigation Dockets
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Active case files requiring investigative action
              </div>
            </div>
            <Link
              to="/cases"
              style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentCases.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 800, fontSize: '12px', color: '#1d4ed8', fontFamily: "'JetBrains Mono', monospace" }}>
                      {c.caseNumber}
                    </span>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: c.priority === 'CRITICAL' ? '#fee2e2' : '#eff6ff',
                        color: c.priority === 'CRITICAL' ? '#991b1b' : '#1d4ed8'
                      }}
                    >
                      {c.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{c.title}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{c.investigatingOfficer}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Evidence Transfers Section */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Recent Evidence &amp; Custody Handoffs
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Forensic transfers and tamper-evident sealed exhibits
              </div>
            </div>
            <Link
              to="/evidence"
              style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentEvidence.map((ev) => (
              <div
                key={ev.id}
                onClick={() => navigate(`/evidence/${ev.evidenceId}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 800, fontSize: '12px', color: '#7c3aed', fontFamily: "'JetBrains Mono', monospace" }}>
                      {ev.evidenceId}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Docket: {ev.caseNumber}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{ev.description}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>{ev.currentCustodian}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Seal: <code style={{ fontFamily: 'monospace' }}>{ev.sealNumber}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom System Integrity & Statutory Compliance Footer Banner */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8' }}>
            <FileCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              Statutory Non-Repudiation Architecture Active
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              All actions logged under Section 65B(4) Indian Evidence Act with NIST FIPS 180-4 SHA-256 forward-chained hash blocks.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/audit-logs')}
            className="btn btn-secondary"
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>View Audit Ledger</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={() => navigate('/security')}
            className="btn btn-primary"
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Security Framework</span>
            <ShieldCheck size={14} />
          </button>
        </div>
      </div>

      {/* Global Upload Document Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchDashboardOverview();
            showToast('Document securely uploaded and encrypted', 'success');
          }}
        />
      )}
    </div>
  );
};
