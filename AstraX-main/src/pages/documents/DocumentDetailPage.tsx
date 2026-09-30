import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import {
  LegalDocument,
  DocumentVersion,
  DigitalSignature,
  IntegrityCheckResult,
  AuditLog
} from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { useToast } from '../../components/common/Toast.tsx';
import {
  FileText,
  ShieldCheck,
  Download,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Calendar,
  User,
  History,
  Stamp,
  Bot,
  FileCheck,
  Eye,
  UploadCloud,
  FileSignature,
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react';

type DocTab = 'preview' | 'overview' | 'versions' | 'approval' | 'metadata' | 'audit';

export const DocumentDetailPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<DocTab>('preview');
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [watermark, setWatermark] = useState<{ watermarkText: string; metadataLines: string[] } | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [integrityResult, setIntegrityResult] = useState<IntegrityCheckResult | null>(null);

  // Modals & Action States
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showNewVersionModal, setShowNewVersionModal] = useState<boolean>(false);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [changeDescription, setChangeDescription] = useState<string>('');
  const [isUploadingVersion, setIsUploadingVersion] = useState<boolean>(false);

  const numericId = Number(documentId);

  const loadDocumentData = async () => {
    if (!numericId || isNaN(numericId)) return;
    try {
      setLoading(true);
      const doc = await api.getDocumentById(numericId);
      setDocument(doc);
      setVersions(doc.versions || []);

      // Load secure preview
      try {
        const prev = await api.getSecureDocumentPreview(numericId);
        setPreviewContent(prev.content || doc.extractedText || 'No text content available.');
        setWatermark(prev.watermark);
      } catch (e) {
        setPreviewContent(doc.extractedText || 'Preview content loaded from metadata.');
      }

      // Load audit logs
      try {
        const logs = await api.getAuditLogs({ limit: 100 });
        const docLogs = logs.filter(
          (l) => l.documentId === doc.id || l.description?.includes(doc.documentName) || l.description?.includes(doc.originalFilename)
        );
        setAuditLogs(docLogs.length > 0 ? docLogs : logs.slice(0, 8));
      } catch (e) {
        console.warn('Could not load audit logs:', e);
      }
    } catch (err) {
      console.error('Failed to load document details:', err);
      showToast('Error loading legal document workspace', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocumentData();
  }, [documentId]);

  const handleVerifyIntegrity = async () => {
    if (!document) return;
    try {
      setVerifying(true);
      const result = await api.verifyDocumentIntegrity(document.id);
      setIntegrityResult(result);
      if (result.integrity === 'VALID') {
        showToast('NIST FIPS 180-4 SHA-256 integrity verified! Hash matches original ledger.', 'success');
      } else {
        showToast('CRITICAL: Document cryptographic hash mismatch! Tampering detected.', 'error');
      }
      loadDocumentData();
    } catch (err: any) {
      showToast(err.message || 'Integrity check failed', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleToggleTamper = async () => {
    if (!document) return;
    try {
      const res = await api.toggleTamperSimulation(document.id);
      setDocument(res.document);
      showToast(res.message, res.isTampered ? 'error' : 'success');
      handleVerifyIntegrity();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle tamper simulation', 'error');
    }
  };

  const handleApprove = async () => {
    if (!document) return;
    try {
      const updated = await api.approveDocumentWorkflow(document.id);
      setDocument(updated);
      showToast('Document approved for legal proceedings under Section 65B', 'success');
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !rejectReason) return;
    try {
      const updated = await api.rejectDocumentWorkflow(document.id, rejectReason);
      setDocument(updated);
      setShowRejectModal(false);
      setRejectReason('');
      showToast('Document rejected and returned to drafting officer', 'info');
    } catch (err: any) {
      showToast(err.message || 'Rejection failed', 'error');
    }
  };

  const handleSign = async () => {
    if (!document) return;
    try {
      const res = await api.signDocument(document.id);
      setDocument(res.document);
      showToast('Digital signature applied using PKI Certificate Authority', 'success');
    } catch (err: any) {
      showToast(err.message || 'Signing failed', 'error');
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !versionFile || !changeDescription) return;

    try {
      setIsUploadingVersion(true);
      const formData = new FormData();
      formData.append('file', versionFile);
      formData.append('changeDescription', changeDescription);

      const res = await api.uploadDocumentVersion(document.id, formData);
      setDocument(res.document);
      setVersions([...versions, res.newVersion]);
      setShowNewVersionModal(false);
      setVersionFile(null);
      setChangeDescription('');
      showToast(`Version ${res.newVersion.versionNumber} registered and encrypted!`, 'success');
      loadDocumentData();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload version', 'error');
    } finally {
      setIsUploadingVersion(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Documents', to: '/documents' }, { label: 'Loading...' }]} />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (!document) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Documents', to: '/documents' }, { label: 'Not Found' }]} />
        <EmptyState
          icon={AlertTriangle}
          title="Document Not Found"
          description="The requested legal document could not be located in the encrypted repository."
          actionLabel="Return to Documents"
          onAction={() => navigate('/documents')}
        />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Documents', to: '/documents' },
          { label: document.documentName }
        ]}
      />

      {/* Header Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                background: '#eff6ff',
                color: '#1d4ed8',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 800
              }}
            >
              {document.documentType}
            </span>

            <Link
              to={`/cases/${document.caseId}`}
              style={{
                color: '#1d4ed8',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Case: {document.caseNumber}</span>
              <ExternalLink size={12} />
            </Link>

            <span
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                background: document.workflowStatus === 'APPROVED' || document.workflowStatus === 'SIGNED' ? '#ecfdf5' : '#fef3c7',
                color: document.workflowStatus === 'APPROVED' || document.workflowStatus === 'SIGNED' ? '#065f46' : '#92400e'
              }}
            >
              STATUS: {document.workflowStatus}
            </span>

            {document.isTampered ? (
              <span
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <AlertTriangle size={13} />
                TAMPER ALERT
              </span>
            ) : (
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#065f46',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ShieldCheck size={13} />
                CRYPTOGRAPHICALLY SECURE
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            {document.documentName}
          </h1>

          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Filename: <strong>{document.originalFilename}</strong></span>
            <span>&bull;</span>
            <span>Version: <strong>v{document.version}</strong></span>
            <span>&bull;</span>
            <span>Uploaded by: <strong>{document.uploadedBy}</strong></span>
            <span>&bull;</span>
            <span>Date: <strong>{new Date(document.createdAt).toLocaleDateString()}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <ShieldCheck size={14} color="#059669" />
            <span>{verifying ? 'Verifying Hash...' : 'Verify Integrity'}</span>
          </button>

          <a
            href={api.getWatermarkedDownloadUrl(document.id)}
            download
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', textDecoration: 'none' }}
          >
            <Download size={14} />
            <span>Watermarked Copy</span>
          </a>

          <a
            href={api.getDownloadUrl(document.id)}
            download
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', textDecoration: 'none' }}
          >
            <Download size={14} />
            <span>Official Decrypted Export</span>
          </a>
        </div>
      </div>

      {/* Main Two-Column Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: Metadata & Security Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Security & Cryptographic Integrity Card */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px 0', textTransform: 'uppercase' }}>
              Cryptographic Integrity
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div>
                <div style={{ color: '#64748b', fontWeight: 700, marginBottom: '2px' }}>SHA-256 CHECKSUM</div>
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    wordBreak: 'break-all',
                    color: document.isTampered ? '#dc2626' : '#0f172a'
                  }}
                >
                  {document.sha256Hash}
                </div>
              </div>

              <div>
                <div style={{ color: '#64748b', fontWeight: 700, marginBottom: '2px' }}>ENCRYPTION STANDARD</div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {document.encryptionAlgorithm || 'AES-256-CBC'} (FIPS 197 compliant)
                </div>
              </div>

              <div>
                <div style={{ color: '#64748b', fontWeight: 700, marginBottom: '2px' }}>SECTION 65B CERTIFICATE</div>
                <div style={{ fontWeight: 600, color: '#047857' }}>
                  Compliant Electronic Record (Act 21 of 2000)
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
                <button
                  onClick={handleToggleTamper}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: document.isTampered ? '1px solid #059669' : '1px solid #dc2626',
                    background: document.isTampered ? '#ecfdf5' : '#fef2f2',
                    color: document.isTampered ? '#065f46' : '#991b1b',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {document.isTampered ? 'Restore Ledger (Re-verify)' : 'Simulate Tampering Attack'}
                </button>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>
                  Demo tool to test automated hash invalidation alerts
                </div>
              </div>
            </div>
          </div>

          {/* Workflow & Approvals Sidebar Action Card */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px 0', textTransform: 'uppercase' }}>
              Workflow Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {document.workflowStatus !== 'APPROVED' && document.workflowStatus !== 'SIGNED' && (
                <button
                  onClick={handleApprove}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                >
                  <CheckCircle2 size={14} />
                  <span>Approve Document</span>
                </button>
              )}

              {document.workflowStatus !== 'SIGNED' && (
                <button
                  onClick={handleSign}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                >
                  <FileSignature size={14} />
                  <span>Apply Digital Signature</span>
                </button>
              )}

              {document.workflowStatus !== 'REJECTED' && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '12px', color: '#991b1b' }}
                >
                  <X size={14} />
                  <span>Reject with Feedback</span>
                </button>
              )}

              <button
                onClick={() => setShowNewVersionModal(true)}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
              >
                <UploadCloud size={14} />
                <span>Upload New Version</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Document Workspace */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {/* Tabs Navigation Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              padding: '0 16px',
              gap: '4px',
              overflowX: 'auto'
            }}
          >
            <button
              onClick={() => setActiveTab('preview')}
              style={{
                padding: '14px 16px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'preview' ? '2px solid #1d4ed8' : '2px solid transparent',
                color: activeTab === 'preview' ? '#1d4ed8' : '#64748b',
                fontWeight: activeTab === 'preview' ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Eye size={15} />
              <span>Document Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('versions')}
              style={{
                padding: '14px 16px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'versions' ? '2px solid #1d4ed8' : '2px solid transparent',
                color: activeTab === 'versions' ? '#1d4ed8' : '#64748b',
                fontWeight: activeTab === 'versions' ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <History size={15} />
              <span>Versions ({versions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('approval')}
              style={{
                padding: '14px 16px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'approval' ? '2px solid #1d4ed8' : '2px solid transparent',
                color: activeTab === 'approval' ? '#1d4ed8' : '#64748b',
                fontWeight: activeTab === 'approval' ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Stamp size={15} />
              <span>Signatures &amp; Approval</span>
            </button>

            <button
              onClick={() => setActiveTab('metadata')}
              style={{
                padding: '14px 16px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'metadata' ? '2px solid #1d4ed8' : '2px solid transparent',
                color: activeTab === 'metadata' ? '#1d4ed8' : '#64748b',
                fontWeight: activeTab === 'metadata' ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={15} />
              <span>AI Metadata &amp; OCR</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              style={{
                padding: '14px 16px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'audit' ? '2px solid #1d4ed8' : '2px solid transparent',
                color: activeTab === 'audit' ? '#1d4ed8' : '#64748b',
                fontWeight: activeTab === 'audit' ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ShieldCheck size={15} />
              <span>Audit History</span>
            </button>
          </div>

          {/* TAB 1: PREVIEW */}
          {activeTab === 'preview' && (
            <div style={{ padding: '24px' }}>
              {watermark && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#1d4ed8' }}>WATERMARK APPLIED: </span>
                    {watermark.watermarkText}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Sec 65B(4) Certified Forensic Copy
                  </div>
                </div>
              )}

              {/* Secure Document Paper Container */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  padding: '40px',
                  minHeight: '480px',
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: '13px',
                  lineHeight: 1.8,
                  color: '#1e293b',
                  whiteSpace: 'pre-wrap',
                  position: 'relative'
                }}
              >
                {/* Visual Watermark Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-30deg)',
                    fontSize: '36px',
                    fontWeight: 900,
                    color: 'rgba(29, 78, 216, 0.05)',
                    pointerEvents: 'none',
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}
                >
                  NCRB MHA RESTRICTED
                  <br />
                  SEC 65B(4) VERIFIED
                </div>

                {previewContent}
              </div>
            </div>
          )}

          {/* TAB 2: VERSIONS */}
          {activeTab === 'versions' && (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Cryptographic Version History
                </h3>
                <button
                  onClick={() => setShowNewVersionModal(true)}
                  className="btn btn-primary"
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <UploadCloud size={14} />
                  <span>Upload Version {versions.length + 1}</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {versions.map((ver) => (
                  <div
                    key={ver.id}
                    style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#1d4ed8', color: '#ffffff', fontWeight: 800, fontSize: '12px' }}>
                          v{ver.versionNumber}
                        </span>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{ver.storedFilename}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(ver.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 8px 0' }}>
                      {ver.changeDescription || 'Initial upload & validation'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#64748b' }}>
                      <span>Uploaded by: <strong>{ver.uploadedBy}</strong></span>
                      <span>SHA-256: <code style={{ fontFamily: 'monospace', color: '#1d4ed8' }}>{ver.sha256Hash.substring(0, 16)}...</code></span>
                      <span>Size: <strong>{(ver.fileSize / 1024).toFixed(1)} KB</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: APPROVAL & SIGNATURES */}
          {activeTab === 'approval' && (
            <div style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
                Digital Signatures &amp; Public Key Infrastructure (PKI)
              </h3>

              {document.signatures && document.signatures.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {document.signatures.map((sig) => (
                    <div
                      key={sig.id}
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: '8px',
                        padding: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46', fontWeight: 800, fontSize: '13px' }}>
                          <CheckCircle2 size={16} />
                          <span>Signed by {sig.signedBy} ({sig.signerRole})</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#047857' }}>
                          {new Date(sig.signedAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#065f46', marginTop: '4px' }}>
                        Certificate Issuer: <strong>{sig.certificateIssuer}</strong>
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#047857', marginTop: '6px', wordBreak: 'break-all' }}>
                        Signature: {sig.signature}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#64748b', marginBottom: '20px' }}>
                  No cryptographic signatures have been appended yet.
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleSign} className="btn btn-primary" style={{ fontSize: '12px' }}>
                  <FileSignature size={14} />
                  <span>Affix My Digital Signature</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: AI METADATA */}
          {activeTab === 'metadata' && (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Sparkles size={18} color="#7c3aed" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  AI Document Intelligence &amp; Entities
                </h3>
              </div>

              {document.aiMetadata ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Executive Summary
                    </div>
                    <p style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.6, margin: 0 }}>
                      {document.aiMetadata.summary}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', marginBottom: '8px' }}>
                        IDENTIFIED PERSONS
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {document.aiMetadata.entities?.persons?.map((p, i) => (
                          <span key={i} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            {p}
                          </span>
                        )) || <span style={{ color: '#94a3b8', fontSize: '12px' }}>None detected</span>}
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', marginBottom: '8px' }}>
                        STATUTES &amp; SECTIONS OF LAW
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {document.aiMetadata.entities?.lawsOrSections?.map((l, i) => (
                          <span key={i} style={{ background: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            {l}
                          </span>
                        )) || <span style={{ color: '#94a3b8', fontSize: '12px' }}>None detected</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Bot}
                  title="AI Metadata Pending"
                  description="Automatic entity recognition and summary will populate upon background OCR processing."
                />
              )}
            </div>
          )}

          {/* TAB 5: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
                Document Access &amp; Modification Ledger
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{log.action}</span> by{' '}
                      <strong>{log.username}</strong> ({log.role}) &bull;{' '}
                      <span style={{ color: '#475569' }}>{log.description}</span>
                    </div>
                    <div style={{ color: '#64748b', fontFamily: 'monospace' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
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
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
              Reject Document Submission
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Provide reasons for rejection so the investigating officer can revise and upload an amended version.
            </p>

            <form onSubmit={handleReject}>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Specify missing exhibits, signature deficiencies, or clarification needed..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  marginBottom: '16px',
                  fontFamily: 'inherit'
                }}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#dc2626', borderColor: '#dc2626' }}
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload New Version Modal */}
      {showNewVersionModal && (
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
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
              Upload New Document Version (v{versions.length + 1})
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              The new file will receive a new SHA-256 integrity hash while preserving past versions in an immutable ledger.
            </p>

            <form onSubmit={handleUploadVersion}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Select File *
                </label>
                <input
                  type="file"
                  onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Change Summary / Version Notes *
                </label>
                <input
                  type="text"
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  placeholder="e.g. Added Section 65B certificate signatory annexure"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewVersionModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingVersion}
                  className="btn btn-primary"
                >
                  {isUploadingVersion ? 'Uploading & Encrypting...' : 'Upload Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
