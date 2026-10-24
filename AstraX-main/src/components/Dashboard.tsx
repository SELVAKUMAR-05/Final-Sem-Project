import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { DashboardStats, Case, LegalDocument } from '../types.ts';
import {
  Users,
  Briefcase,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Search,
  Scale,
  FileCheck,
  FileSignature,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';
import { NavTab } from './Sidebar.tsx';

interface DashboardProps {
  setActiveTab: (tab: NavTab) => void;
  onSelectCase?: (c: Case) => void;
  onSelectDocument?: (d: LegalDocument) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, onSelectCase, onSelectDocument }) => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [statData, casesData, docsData] = await Promise.all([
          api.getDashboardStats(),
          api.getCases(),
          api.getDocuments(),
        ]);
        setStats(statData);
        setCases(casesData);
        setDocuments(docsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [currentUser?.role]);

  if (loading || !stats) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <Clock size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: '12px' }} />
        <p>Loading encrypted judicial telemetry &amp; records...</p>
      </div>
    );
  }

  const role = currentUser?.role || 'POLICE_OFFICER';

  return (
    <div className="dashboard-view" id="gov-dashboard-view">
      {/* Role Headline Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-navy-950)' }}>
            {role === 'ADMIN' && 'National Security Command & Audit Portal'}
            {role === 'POLICE_OFFICER' && 'Police Station First Response & Case Filing Station'}
            {role === 'INVESTIGATION_OFFICER' && 'Criminal Investigation & Case Diary Central'}
            {role === 'FORENSIC_OFFICER' && 'Central Forensic Science Laboratory (CFSL) Evidence Hub'}
            {role === 'LAWYER' && 'Advocate & Defense Counsel Legal Vault'}
            {role === 'COURT_OFFICER' && 'High Court Registry & Judicial Seal Station'}
          </h2>
          <p style={{ color: 'var(--gov-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Active clearance: <strong>{currentUser?.fullName}</strong> ({currentUser?.department}) &bull; Section 65B Certified
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-gov btn-gov-blue" onClick={() => setActiveTab('upload')}>
            <Upload size={16} /> Upload Document
          </button>
          <button className="btn-gov btn-gov-outline" onClick={() => setActiveTab('search')}>
            <Search size={16} /> Search Repository
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. ADMIN DASHBOARD METRICS */}
      {/* ------------------------------------------------------------- */}
      {role === 'ADMIN' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Total Users</span>
                <Users size={20} color="#2563eb" />
              </div>
              <div className="stat-card-value">{stats.totalUsers}</div>
              <div className="stat-card-sub">Active officers across all divisions</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Total Cases</span>
                <Briefcase size={20} color="#059669" />
              </div>
              <div className="stat-card-value">{stats.totalCases}</div>
              <div className="stat-card-sub">{stats.activeInvestigations} under active investigation</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Total Documents</span>
                <FileText size={20} color="#d97706" />
              </div>
              <div className="stat-card-value">{stats.totalDocuments}</div>
              <div className="stat-card-sub">All SHA-256 registered</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Uploaded Today</span>
                <Upload size={20} color="#0284c7" />
              </div>
              <div className="stat-card-value">{stats.documentsUploadedToday}</div>
              <div className="stat-card-sub">New evidentiary additions</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Cases by Status */}
            <div className="gov-card">
              <div className="gov-card-header">
                <span className="gov-card-title"><Briefcase size={18} /> Cases by Investigation Status</span>
                <button className="btn-gov btn-gov-outline btn-gov-sm" onClick={() => setActiveTab('cases')}>View All</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {Object.entries(stats.casesByStatus).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{status.replace(/_/g, ' ')}</span>
                    <span className="badge-status info" style={{ fontSize: '13px', padding: '4px 10px' }}>
                      {count} Cases
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Logs Telemetry */}
            <div className="gov-card">
              <div className="gov-card-header">
                <span className="gov-card-title"><ShieldCheck size={18} /> Recent Security &amp; Audit Logs</span>
                <button className="btn-gov btn-gov-outline btn-gov-sm" onClick={() => setActiveTab('audit_chain')}>Full Trail</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.recentActivities.slice(0, 4).map((act) => (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', borderBottom: '1px solid var(--gov-border-light)', paddingBottom: '8px' }}>
                    <span className={`badge-status ${act.status === 'SUCCESS' ? 'success' : act.status === 'DENIED' ? 'danger' : 'warning'}`}>
                      {act.action}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div><strong>{act.username}</strong> ({act.role}): {act.description}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)', marginTop: '2px' }}>
                        IP: {act.ipAddress} &bull; {new Date(act.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. POLICE OFFICER DASHBOARD */}
      {/* ------------------------------------------------------------- */}
      {role === 'POLICE_OFFICER' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">My Assigned Cases</span>
                <Briefcase size={20} color="#2563eb" />
              </div>
              <div className="stat-card-value">2</div>
              <div className="stat-card-sub">Station Jurisdiction: Chennai Central</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">FIRs Filed</span>
                <FileText size={20} color="#059669" />
              </div>
              <div className="stat-card-value">{documents.filter(d => d.documentType === 'FIR').length}</div>
              <div className="stat-card-sub">All digitally timestamped</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Pending Action</span>
                <Clock size={20} color="#d97706" />
              </div>
              <div className="stat-card-value">1</div>
              <div className="stat-card-sub">Witness statement pending review</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Digital Signatures</span>
                <FileSignature size={20} color="#7c3aed" />
              </div>
              <div className="stat-card-value">{documents.filter(d => d.signed).length}</div>
              <div className="stat-card-sub">Valid Ed25519 PKI certificates</div>
            </div>
          </div>

          {/* Quick Actions for Police Officer */}
          <div className="gov-card">
            <div className="gov-card-header">
              <span className="gov-card-title"><Briefcase size={18} /> Active Police Cases &amp; Quick Actions</span>
              <button className="btn-gov btn-gov-blue btn-gov-sm" onClick={() => setActiveTab('cases')}>
                Register New FIR / Case
              </button>
            </div>
            <div className="gov-table-wrap">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Case Number</th>
                    <th>Crime Title</th>
                    <th>Crime Type</th>
                    <th>Priority</th>
                    <th>Documents</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.slice(0, 3).map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{c.caseNumber}</td>
                      <td>{c.title}</td>
                      <td>{c.crimeType}</td>
                      <td>
                        <span className={`badge-status ${c.priority === 'CRITICAL' ? 'danger' : c.priority === 'HIGH' ? 'warning' : 'info'}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td>{c.documentCount || 0} Files</td>
                      <td>
                        <button className="btn-gov btn-gov-outline btn-gov-sm" onClick={() => setActiveTab('cases')}>
                          Manage Case
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. INVESTIGATION OFFICER DASHBOARD */}
      {/* ------------------------------------------------------------- */}
      {role === 'INVESTIGATION_OFFICER' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Active Investigations</span>
                <Briefcase size={20} color="#2563eb" />
              </div>
              <div className="stat-card-value">{stats.activeInvestigations}</div>
              <div className="stat-card-sub">CID Special Task Force</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Investigation Reports</span>
                <FileText size={20} color="#059669" />
              </div>
              <div className="stat-card-value">{documents.filter(d => d.documentType === 'INVESTIGATION_REPORT' || d.documentType === 'WITNESS_STATEMENT').length}</div>
              <div className="stat-card-sub">Section 161 CrPC Statements</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Evidence Records</span>
                <Fingerprint size={20} color="#d97706" />
              </div>
              <div className="stat-card-value">{documents.filter(d => d.documentType === 'EVIDENCE' || d.documentType === 'FORENSIC_REPORT').length}</div>
              <div className="stat-card-sub">Chain of custody active</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Integrity Status</span>
                <ShieldCheck size={20} color="#059669" />
              </div>
              <div className="stat-card-value">100%</div>
              <div className="stat-card-sub">0 Tamper Alerts Detected</div>
            </div>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. FORENSIC OFFICER DASHBOARD */}
      {/* ------------------------------------------------------------- */}
      {role === 'FORENSIC_OFFICER' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">CFSL Lab Assigned Cases</span>
                <Briefcase size={20} color="#7c3aed" />
              </div>
              <div className="stat-card-value">2</div>
              <div className="stat-card-sub">Digital &amp; Physical Forensics</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Forensic Reports</span>
                <FileCheck size={20} color="#2563eb" />
              </div>
              <div className="stat-card-value">{documents.filter(d => d.documentType === 'FORENSIC_REPORT').length}</div>
              <div className="stat-card-sub">Hardware &amp; Cyber Evidence</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Evidence Integrity Checks</span>
                <CheckCircle size={20} color="#059669" />
              </div>
              <div className="stat-card-value">Verified</div>
              <div className="stat-card-sub">SHA-256 match validated</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Encrypted Storage</span>
                <ShieldCheck size={20} color="#0284c7" />
              </div>
              <div className="stat-card-value">AES-256</div>
              <div className="stat-card-sub">NIST SP 800-57 Compliant</div>
            </div>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. LAWYER DASHBOARD */}
      {/* ------------------------------------------------------------- */}
      {role === 'LAWYER' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Assigned Defense Cases</span>
                <Briefcase size={20} color="#3730a3" />
              </div>
              <div className="stat-card-value">1</div>
              <div className="stat-card-sub">High Court &amp; Sessions Court</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Legal Documents</span>
                <FileText size={20} color="#2563eb" />
              </div>
              <div className="stat-card-value">{documents.filter(d => d.documentType === 'CHARGE_SHEET' || d.documentType === 'FIR').length}</div>
              <div className="stat-card-sub">Disclosed Evidence Copies</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Court Filings</span>
                <Scale size={20} color="#d97706" />
              </div>
              <div className="stat-card-value">{documents.filter(d => d.documentType === 'COURT_FILING' || d.documentType === 'LEGAL_NOTICE').length}</div>
              <div className="stat-card-sub">Notices &amp; Bail Applications</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Restricted Records</span>
                <AlertCircle size={20} color="#dc2626" />
              </div>
              <div className="stat-card-value">Protected</div>
              <div className="stat-card-sub">Police internal drafts blocked</div>
            </div>
          </div>

          <div className="gov-alert warning">
            <AlertCircle size={20} />
            <div>
              <strong>Legal Counsel Security Notice:</strong> Under the Indian Evidence Act &amp; Section 173 CrPC, only filed charge-sheets and judicial filings are accessible to defense counsel. Unfiled internal police memos and confidential forensic worksheets remain protected under Official Secrets Act provisions.
            </div>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. COURT OFFICER DASHBOARD */}
      {/* ------------------------------------------------------------- */}
      {role === 'COURT_OFFICER' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Court Cases on Docket</span>
                <Scale size={20} color="#0f766e" />
              </div>
              <div className="stat-card-value">{stats.totalCases}</div>
              <div className="stat-card-sub">High Court Judicial Registry</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Filed Charge Sheets</span>
                <FileText size={20} color="#2563eb" />
              </div>
              <div className="stat-card-value">{documents.filter(d => d.documentType === 'CHARGE_SHEET').length}</div>
              <div className="stat-card-sub">Section 173 CrPC Submissions</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Verified Evidence</span>
                <CheckCircle size={20} color="#059669" />
              </div>
              <div className="stat-card-value">{stats.verifiedDocuments}</div>
              <div className="stat-card-sub">Cryptographically attested</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Judicial Orders &amp; Judgments</span>
                <FileSignature size={20} color="#7c3aed" />
              </div>
              <div className="stat-card-value">Ready</div>
              <div className="stat-card-sub">Digital Seal of the Court</div>
            </div>
          </div>
        </>
      )}

      {/* Common Document Repository Glance */}
      <div className="gov-card">
        <div className="gov-card-header">
          <span className="gov-card-title"><FileText size={18} /> Recent Evidentiary Documents &amp; Hash Proofs</span>
          <button className="btn-gov btn-gov-outline btn-gov-sm" onClick={() => setActiveTab('documents')}>
            View Full Vault <ArrowRight size={14} />
          </button>
        </div>
        <div className="gov-table-wrap">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Type</th>
                <th>Case Number</th>
                <th>SHA-256 Digest</th>
                <th>Version</th>
                <th>Signature</th>
                <th>Access Clearance</th>
              </tr>
            </thead>
            <tbody>
              {documents.slice(0, 5).map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="#00ff00" />
                      <span>{d.documentName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge-status info">{d.documentType}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{d.caseNumber}</td>
                  <td>
                    <span className="hash-pill" title={d.sha256Hash}>
                      {d.sha256Hash.slice(0, 16)}...
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: '#00ff00', fontFamily: 'var(--font-mono)' }}>v{d.version}</span>
                  </td>
                  <td>
                    <span className={`badge-status ${d.signed ? 'success' : 'warning'}`}>
                      {d.signed ? 'SIGNED' : 'NOT SIGNED'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-status ${d.classification === 'CONFIDENTIAL' ? 'danger' : 'info'}`}>
                      {d.classification}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
