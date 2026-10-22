import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import {
  Case,
  LegalDocument,
  Evidence,
  CaseTimelineEvent,
  AuditLog
} from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { useToast } from '../../components/common/Toast.tsx';
import { DocumentUploadModal } from '../../components/DocumentUploadModal.tsx';
import {
  FolderLock,
  FileText,
  Package,
  Clock,
  ShieldCheck,
  Plus,
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  Tag,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Send,
  X
} from 'lucide-react';

type CaseTab = 'overview' | 'documents' | 'evidence' | 'timeline' | 'audit';

export const CaseDetailPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<CaseTab>('overview');
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<CaseTimelineEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showUploadDocModal, setShowUploadDocModal] = useState<boolean>(false);
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState<boolean>(false);
  const [showAddTimelineModal, setShowAddTimelineModal] = useState<boolean>(false);

  // New Evidence Form State
  const [evidenceType, setEvidenceType] = useState<string>('Digital Media / Mobile Device');
  const [evidenceDesc, setEvidenceDesc] = useState<string>('');
  const [evidenceLocation, setEvidenceLocation] = useState<string>('');
  const [sealNumber, setSealNumber] = useState<string>('');
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState<boolean>(false);

  // New Timeline Form State
  const [timelineType, setTimelineType] = useState<string>('INVESTIGATION');
  const [timelineTitle, setTimelineTitle] = useState<string>('');
  const [timelineDesc, setTimelineDesc] = useState<string>('');
  const [isSubmittingTimeline, setIsSubmittingTimeline] = useState<boolean>(false);

  const numericId = Number(caseId);

  const loadAllCaseData = async () => {
    if (!numericId && isNaN(numericId)) return;
    try {
      setLoading(true);
      const res = await api.getCaseById(numericId);
      setCaseData(res.case);
      setDocuments(res.documents || []);

      // Concurrently load related evidence, timeline, and audit logs
      try {
        const ev = await api.getEvidence(numericId);
        setEvidenceList(ev);
      } catch (e) {
        console.warn('Could not load evidence:', e);
      }

      try {
        const tl = await api.getCaseTimeline(numericId);
        setTimelineEvents(tl.events || []);
      } catch (e) {
        console.warn('Could not load timeline:', e);
      }

      try {
        const allAudits = await api.getAuditLogs({ limit: 100 });
        const filteredAudits = allAudits.filter(
          (a) => a.description?.includes(res.case.caseNumber) || a.caseNumber === res.case.caseNumber || a.caseId === res.case.id
        );
        setAuditLogs(filteredAudits.length > 0 ? filteredAudits : allAudits.slice(0, 10));
      } catch (e) {
        console.warn('Could not load audits:', e);
      }
    } catch (err: any) {
      console.error('Failed to load case details:', err);
      showToast('Error loading case record', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllCaseData();
  }, [caseId]);

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !evidenceDesc || !sealNumber) return;

    try {
      setIsSubmittingEvidence(true);
      const newEv = await api.createEvidence({
        caseId: caseData.id,
        evidenceType,
        description: evidenceDesc,
        collectionLocation: evidenceLocation || caseData.location,
        sealNumber,
        condition: 'Intact & Tamper-Evident Sealed',
      });
      setEvidenceList([newEv, ...evidenceList]);
      setShowAddEvidenceModal(false);
      showToast(`Evidence item ${newEv.evidenceId} logged with tamper seal`, 'success');
      setEvidenceDesc('');
      setSealNumber('');
      setEvidenceLocation('');
    } catch (err: any) {
      showToast(err.message || 'Failed to add evidence', 'error');
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !timelineTitle) return;

    try {
      setIsSubmittingTimeline(true);
      const newEvent = await api.addCaseTimelineEvent(caseData.id, {
        eventType: timelineType,
        title: timelineTitle,
        description: timelineDesc,
      });
      setTimelineEvents([newEvent, ...timelineEvents]);
      setShowAddTimelineModal(false);
      showToast('Timeline event registered successfully', 'success');
      setTimelineTitle('');
      setTimelineDesc('');
    } catch (err: any) {
      showToast(err.message || 'Failed to add timeline event', 'error');
    } finally {
      setIsSubmittingTimeline(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Cases', to: '/cases' }, { label: 'Loading...' }]} />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Cases', to: '/cases' }, { label: 'Not Found' }]} />
        <EmptyState
          icon={AlertTriangle}
          title="Case Not Found"
          description="The requested investigation record does not exist or you lack official clearance."
          actionLabel="Return to Cases"
          onAction={() => navigate('/cases')}
        />
      </div>
    );
  }

  const isCritical = caseData.priority === 'CRITICAL';
  const isHigh = caseData.priority === 'HIGH';

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Cases', to: '/cases' },
          { label: caseData.caseNumber }
        ]}
      />

      {/* Case Header Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                {caseData.caseNumber}
              </span>

              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: isCritical ? '#fee2e2' : isHigh ? '#fef3c7' : '#f1f5f9',
                  color: isCritical ? '#991b1b' : isHigh ? '#92400e' : '#475569'
                }}
              >
                {caseData.priority} PRIORITY
              </span>

              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: caseData.status === 'CLOSED' ? '#f1f5f9' : '#ecfdf5',
                  color: caseData.status === 'CLOSED' ? '#64748b' : '#047857'
                }}
              >
                {caseData.status.replace(/_/g, ' ')}
              </span>
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              {caseData.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Tag size={14} color="#94a3b8" />
                {caseData.crimeType}
              </span>
              <span>&bull;</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} color="#94a3b8" />
                {caseData.location}
              </span>
              <span>&bull;</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} color="#94a3b8" />
                {caseData.investigatingOfficer} ({caseData.department})
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/cases')}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Cases</span>
            </button>
            <button
              onClick={() => setShowUploadDocModal(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Plus size={14} />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '24px',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '16px'
          }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'overview' ? '#1d4ed8' : '#f8fafc',
              color: activeTab === 'overview' ? '#ffffff' : '#64748b',
              transition: 'all 0.15s'
            }}
          >
            <FolderLock size={15} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'documents' ? '#1d4ed8' : '#f8fafc',
              color: activeTab === 'documents' ? '#ffffff' : '#64748b',
              transition: 'all 0.15s'
            }}
          >
            <FileText size={15} />
            <span>Documents ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'evidence' ? '#1d4ed8' : '#f8fafc',
              color: activeTab === 'evidence' ? '#ffffff' : '#64748b',
              transition: 'all 0.15s'
            }}
          >
            <Package size={15} />
            <span>Evidence ({evidenceList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'timeline' ? '#1d4ed8' : '#f8fafc',
              color: activeTab === 'timeline' ? '#ffffff' : '#64748b',
              transition: 'all 0.15s'
            }}
          >
            <Clock size={15} />
            <span>Timeline ({timelineEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'audit' ? '#1d4ed8' : '#f8fafc',
              color: activeTab === 'audit' ? '#ffffff' : '#64748b',
              transition: 'all 0.15s'
            }}
          >
            <ShieldCheck size={15} />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Case Narrative */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>
                Incident Narrative &amp; Investigation Scope
              </h3>
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                {caseData.description || 'No detailed narrative recorded for this case docket.'}
              </p>

              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                  Statutory Clearance &amp; Evidence Compliance
                </div>
                <div style={{ fontSize: '13px', color: '#0f172a' }}>
                  Digital assets registered under Section 65B(4) Indian Evidence Act with NIST FIPS 180-4 SHA-256 hash chains.
                </div>
              </div>
            </div>

            {/* Quick Evidence & Document highlights */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Active Docket Assets
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {documents.length} Docs &bull; {evidenceList.length} Physical/Digital Exhibits
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  onClick={() => setActiveTab('documents')}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    background: '#f8fafc',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontWeight: 700, fontSize: '13px' }}>
                    <FileText size={16} />
                    <span>View Legal Documents</span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
                    {documents.length} Files
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Click to review versions, approvals, and signatures
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('evidence')}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    background: '#f8fafc',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: 700, fontSize: '13px' }}>
                    <Package size={16} />
                    <span>View Chain of Custody</span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
                    {evidenceList.length} Items
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Click to inspect tamper seals and custody transfers
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Information Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', textTransform: 'uppercase' }}>
                Case Docket Details
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Investigating Officer
                  </div>
                  <div style={{ color: '#0f172a', fontWeight: 700, marginTop: '2px' }}>
                    {caseData.investigatingOfficer}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>{caseData.department}</div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Registered By
                  </div>
                  <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                    {caseData.createdBy || 'Central Police Station'}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Creation Date
                  </div>
                  <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                    {new Date(caseData.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Last Ledger Update
                  </div>
                  <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                    {new Date(caseData.updatedAt || caseData.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
                Investigation Actions
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setShowUploadDocModal(true)}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                >
                  <Plus size={14} />
                  <span>Upload Legal Document</span>
                </button>

                <button
                  onClick={() => setShowAddEvidenceModal(true)}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                >
                  <Package size={14} />
                  <span>Register Evidence Exhibit</span>
                </button>

                <button
                  onClick={() => setShowAddTimelineModal(true)}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                >
                  <Clock size={14} />
                  <span>Log Timeline Milestone</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Case Legal Documents &amp; Exhibits
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                Tamper-proof encrypted legal filings, forensic records, and charge sheets for this case.
              </p>
            </div>

            <button
              onClick={() => setShowUploadDocModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Plus size={14} />
              <span>Upload Document</span>
            </button>
          </div>

          {documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents uploaded yet"
              description="Upload FIRs, forensic reports, or witness statements to initiate cryptographically verified dockets."
              actionLabel="+ Upload First Document"
              onAction={() => setShowUploadDocModal(true)}
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '12px 16px' }}>Document Name</th>
                  <th style={{ padding: '12px 16px' }}>Type</th>
                  <th style={{ padding: '12px 16px' }}>Version</th>
                  <th style={{ padding: '12px 16px' }}>Workflow</th>
                  <th style={{ padding: '12px 16px' }}>Security Status</th>
                  <th style={{ padding: '12px 16px' }}>Uploaded By</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="#1d4ed8" />
                        <div>
                          <div>{doc.documentName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{doc.originalFilename}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 700 }}>
                        {doc.documentType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>v{doc.version}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: doc.workflowStatus === 'APPROVED' ? '#ecfdf5' : '#fef3c7',
                          color: doc.workflowStatus === 'APPROVED' ? '#065f46' : '#92400e'
                        }}
                      >
                        {doc.workflowStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {doc.isTampered ? (
                        <span style={{ color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} />
                          TAMPER DETECTED
                        </span>
                      ) : (
                        <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} />
                          AES-256 Verified
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{doc.uploadedBy}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Open Workspace <ChevronRight size={14} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 3. EVIDENCE TAB */}
      {activeTab === 'evidence' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Physical &amp; Digital Evidence Exhibits
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                Tamper-evident tagged physical hardware, biological samples, and digital forensically preserved data.
              </p>
            </div>

            <button
              onClick={() => setShowAddEvidenceModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Plus size={14} />
              <span>Register Evidence</span>
            </button>
          </div>

          {evidenceList.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No evidence items logged"
              description="Log physical artifacts, hard drives, mobile devices, or forensic packages with tamper-proof seals."
              actionLabel="+ Register First Evidence Exhibit"
              onAction={() => setShowAddEvidenceModal(true)}
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '12px 16px' }}>Evidence ID</th>
                  <th style={{ padding: '12px 16px' }}>Description &amp; Type</th>
                  <th style={{ padding: '12px 16px' }}>Seal Number</th>
                  <th style={{ padding: '12px 16px' }}>Current Custodian</th>
                  <th style={{ padding: '12px 16px' }}>Custody Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {evidenceList.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => navigate(`/evidence/${ev.evidenceId}`)}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#1d4ed8', fontFamily: "'JetBrains Mono', monospace" }}>
                      {ev.evidenceId}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{ev.description}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{ev.evidenceType}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", color: '#475569' }}>
                      {ev.sealNumber}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{ev.currentCustodian}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{ev.currentCustodianRole}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: ev.status === 'UNDER_FORENSIC_EXAMINATION' ? '#fef3c7' : '#eff6ff',
                          color: ev.status === 'UNDER_FORENSIC_EXAMINATION' ? '#92400e' : '#1d4ed8'
                        }}
                      >
                        {ev.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Chain of Custody <ChevronRight size={14} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 4. TIMELINE TAB */}
      {activeTab === 'timeline' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Chronological Investigation Timeline
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                Immutable sequential record of investigative actions, FIR filings, and forensic examinations.
              </p>
            </div>

            <button
              onClick={() => setShowAddTimelineModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Plus size={14} />
              <span>Add Event Milestone</span>
            </button>
          </div>

          {timelineEvents.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No timeline events recorded"
              description="Track major milestones such as scene inspections, suspect questioning, and forensic results."
              actionLabel="+ Add First Timeline Milestone"
              onAction={() => setShowAddTimelineModal(true)}
            />
          ) : (
            <div style={{ position: 'relative', paddingLeft: '32px' }}>
              {/* Vertical timeline line */}
              <div
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '8px',
                  bottom: '8px',
                  width: '2px',
                  background: '#e2e8f0'
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {timelineEvents.map((evt, idx) => (
                  <div key={evt.id || idx} style={{ position: 'relative' }}>
                    {/* Circle marker */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-27px',
                        top: '4px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        border: '3px solid #1d4ed8'
                      }}
                    />

                    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{evt.title}</span>
                          <span style={{ fontSize: '11px', padding: '2px 6px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '4px', fontWeight: 700 }}>
                            {evt.eventType}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                          {new Date(evt.timestamp).toLocaleString()}
                        </div>
                      </div>

                      <p style={{ fontSize: '13px', color: '#475569', margin: '8px 0 0 0', lineHeight: 1.5 }}>
                        {evt.description}
                      </p>

                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
                        Recorded by Officer ID #{evt.createdById || 'System'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. AUDIT TAB */}
      {activeTab === 'audit' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Audit Ledger &amp; Cryptographic Traceability
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              SHA-256 chained logs verifying non-repudiation of all actions involving this case.
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '12px 16px' }}>Timestamp</th>
                <th style={{ padding: '12px 16px' }}>Officer / Role</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
                <th style={{ padding: '12px 16px' }}>Log Description</th>
                <th style={{ padding: '12px 16px' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#64748b' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.username}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{log.role}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 700 }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>
                    {log.description}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: log.status === 'SUCCESS' ? '#ecfdf5' : '#fee2e2',
                        color: log.status === 'SUCCESS' ? '#065f46' : '#991b1b'
                      }}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Global Modals for Actions */}
      {showUploadDocModal && (
        <DocumentUploadModal
          preselectedCaseNumber={caseData.caseNumber}
          onClose={() => setShowUploadDocModal(false)}
          onSuccess={() => {
            setShowUploadDocModal(false);
            loadAllCaseData();
            showToast('Document uploaded successfully to case docket', 'success');
          }}
        />
      )}

      {/* Add Evidence Modal */}
      {showAddEvidenceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={20} color="#1d4ed8" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Register Evidence Exhibit
                </h3>
              </div>
              <button
                onClick={() => setShowAddEvidenceModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddEvidence} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Evidence Classification *
                </label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Digital Media / Mobile Device">Digital Media / Mobile Device</option>
                  <option value="Storage Drive / SSD / Forensic Image">Storage Drive / SSD / Forensic Image</option>
                  <option value="Network Appliance / Router">Network Appliance / Router</option>
                  <option value="Physical Document / Contract">Physical Document / Contract</option>
                  <option value="Forensic Sample / Swab">Forensic Sample / Swab</option>
                  <option value="Weapon / Firearm">Weapon / Firearm</option>
                  <option value="Currency / Valuable Asset">Currency / Valuable Asset</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Exhibit Description &amp; Serial/Model *
                </label>
                <input
                  type="text"
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  placeholder="e.g. Apple iPhone 14 Pro (Black, IMEI: 35489102...)"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Tamper-Evident Seal ID *
                  </label>
                  <input
                    type="text"
                    value={sealNumber}
                    onChange={(e) => setSealNumber(e.target.value)}
                    placeholder="e.g. SEAL-MHA-9941"
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
                    Collection Location
                  </label>
                  <input
                    type="text"
                    value={evidenceLocation}
                    onChange={(e) => setEvidenceLocation(e.target.value)}
                    placeholder="e.g. Crime Scene Desk 4"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddEvidenceModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvidence}
                  className="btn btn-primary"
                >
                  {isSubmittingEvidence ? 'Registering...' : 'Register Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Timeline Modal */}
      {showAddTimelineModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={20} color="#1d4ed8" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Log Timeline Milestone
                </h3>
              </div>
              <button
                onClick={() => setShowAddTimelineModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTimelineEvent} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Milestone Category *
                </label>
                <select
                  value={timelineType}
                  onChange={(e) => setTimelineType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="INVESTIGATION">Investigation Action</option>
                  <option value="FORENSIC_EXAMINATION">Forensic Examination</option>
                  <option value="CUSTODY_TRANSFER">Custody Transfer</option>
                  <option value="WITNESS_STATEMENT">Witness Statement</option>
                  <option value="CHARGE_SHEET">Charge Sheet Filing</option>
                  <option value="COURT_PROCEEDING">Court Proceeding</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  value={timelineTitle}
                  onChange={(e) => setTimelineTitle(e.target.value)}
                  placeholder="e.g. Forensic image acquired from suspect mobile"
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

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Event Detailed Narrative
                </label>
                <textarea
                  value={timelineDesc}
                  onChange={(e) => setTimelineDesc(e.target.value)}
                  rows={3}
                  placeholder="Detailed notes, officers present, technical findings, or court directions..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddTimelineModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTimeline}
                  className="btn btn-primary"
                >
                  {isSubmittingTimeline ? 'Logging...' : 'Log Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
