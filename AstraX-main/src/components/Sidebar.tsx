import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Briefcase,
  Package,
  FileText,
  UploadCloud,
  CheckCircle2,
  PenTool,
  Search,
  History,
  Users,
  Award,
  Shield,
  Link,
  GitCommit,
  Network,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'cases'
  | 'evidence'
  | 'evidence_chain'
  | 'timeline'
  | 'documents'
  | 'upload'
  | 'integrity'
  | 'signatures'
  | 'relationship_graph'
  | 'case_report'
  | 'security_alerts'
  | 'audit_chain'
  | 'search'
  | 'users'
  | 'demo-guide';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  return (
    <aside className="gov-sidebar" id="ncrb-sidebar">
      <div className="sidebar-scroll">
        {/* Category 1: Operations */}
        <div>
          <div className="sidebar-section-title">Core Operations</div>
          <ul className="sidebar-nav-list">
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
                id="nav-dashboard"
              >
                <LayoutDashboard size={17} className="icon" />
                <span>Command Dashboard</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'cases' ? 'active' : ''}`}
                onClick={() => setActiveTab('cases')}
                id="nav-cases"
              >
                <Briefcase size={17} className="icon" />
                <span>Investigation Cases</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'evidence' ? 'active' : ''}`}
                onClick={() => setActiveTab('evidence')}
                id="nav-evidence"
              >
                <Package size={17} className="icon" />
                <span>Evidence Vault</span>
                <span className="sidebar-badge-count">New</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
                id="nav-documents"
              >
                <FileText size={17} className="icon" />
                <span>Document Repository</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
                id="nav-upload"
              >
                <UploadCloud size={17} className="icon" />
                <span>Upload Document</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Category 2: Forensic & Chain of Custody */}
        <div>
          <div className="sidebar-section-title">Forensic & Custody</div>
          <ul className="sidebar-nav-list">
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'evidence_chain' ? 'active' : ''}`}
                onClick={() => setActiveTab('evidence_chain')}
                id="nav-evidence-chain"
              >
                <Link size={17} className="icon" />
                <span>Chain of Custody</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'integrity' ? 'active' : ''}`}
                onClick={() => setActiveTab('integrity')}
                id="nav-integrity"
              >
                <CheckCircle2 size={17} className="icon" />
                <span>SHA-256 Tamper Lab</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'signatures' ? 'active' : ''}`}
                onClick={() => setActiveTab('signatures')}
                id="nav-signatures"
              >
                <PenTool size={17} className="icon" />
                <span>Digital Signatures</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Category 3: Investigation Intelligence */}
        <div>
          <div className="sidebar-section-title">Case Intelligence</div>
          <ul className="sidebar-nav-list">
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
                id="nav-timeline"
              >
                <GitCommit size={17} className="icon" />
                <span>Investigation Timeline</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'relationship_graph' ? 'active' : ''}`}
                onClick={() => setActiveTab('relationship_graph')}
                id="nav-relationship-graph"
              >
                <Network size={17} className="icon" />
                <span>Entity &amp; Case Graph</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => setActiveTab('search')}
                id="nav-search"
              >
                <Search size={17} className="icon" />
                <span>Advanced Search</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'case_report' ? 'active' : ''}`}
                onClick={() => setActiveTab('case_report')}
                id="nav-case-report"
              >
                <FileCheck size={17} className="icon" />
                <span>11-Sec Case Report</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Category 4: Security & Governance */}
        <div>
          <div className="sidebar-section-title">Security &amp; Audit</div>
          <ul className="sidebar-nav-list">
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'security_alerts' ? 'active' : ''}`}
                onClick={() => setActiveTab('security_alerts')}
                id="nav-security-alerts"
              >
                <AlertTriangle size={17} className="icon" color="#dc2626" />
                <span>Security Threat Center</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'audit_chain' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit_chain')}
                id="nav-audit-chain"
              >
                <History size={17} className="icon" />
                <span>Chained Audit Ledger</span>
              </button>
            </li>
            {role === 'ADMIN' && (
              <li>
                <button
                  className={`sidebar-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                  id="nav-users"
                >
                  <Users size={17} className="icon" />
                  <span>User &amp; RBAC Control</span>
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Category 5: Live Evaluation Guide */}
        <div>
          <div className="sidebar-section-title">Evaluation</div>
          <ul className="sidebar-nav-list">
            <li>
              <button
                className={`sidebar-nav-btn ${activeTab === 'demo-guide' ? 'active' : ''}`}
                onClick={() => setActiveTab('demo-guide')}
                id="nav-demo-guide"
                style={{ background: activeTab === 'demo-guide' ? '#fef3c7' : '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}
              >
                <Award size={17} className="icon" color="#d97706" />
                <span>Live Verification Guide</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
};
