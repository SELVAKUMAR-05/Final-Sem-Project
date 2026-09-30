import React, { useState, useEffect } from 'react';
import { LegalDocument, DocumentVersion } from '../types.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  FileText,
  ShieldCheck,
  Lock,
  Download,
  CheckCircle,
  History,
  FileSignature,
  FileCode,
  X,
  Clock,
  User,
  Upload,
  Layers,
  Sparkles,
  Eye,
  AlertTriangle,
  ArrowRight,
  Printer,
} from 'lucide-react';

interface DocumentDetailModalProps {
  document: LegalDocument;
  onClose: () => void;
  onRefresh: () => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({ document: doc, onClose, onRefresh }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'preview' | 'overview' | 'workflow' | 'ai' | 'versions' | 'signatures' | 'new-version'>('preview');

  // Preview & Watermark state
  const [previewContent, setPreviewContent] = useState<string>('');
  const [watermarkMeta, setWatermarkMeta] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // AI Intelligence state
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Workflow state
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Versioning & Signing
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [changeDescription, setChangeDescription] = useState<string>('');
  const [isUploadingVersion, setIsUploadingVersion] = useState<boolean>(false);
  const [signStatus, setSignStatus] = useState<string | null>(null);

  const loadSecurePreview = async () => {
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const res = await api.getSecureDocumentPreview(doc.id);
      setPreviewContent(res.content);
      setWatermarkMeta(res.watermark);
    } catch (err: any) {
      setPreviewError(err.message || '403 Forbidden: Insufficient clearance to preview this document.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadAiIntelligence = async () => {
    setLoadingAi(true);
    try {
      const summary = await api.getAIDocumentSummary(doc.id);
      setAiSummary(summary);
    } catch (err: any) {
      console.error('Failed to load AI summary', err);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    loadSecurePreview();
  }, [doc.id]);

  useEffect(() => {
    if (activeTab === 'ai' && !aiSummary) {
      loadAiIntelligence();
    }
  }, [activeTab]);

  const handleDownloadWatermarked = () => {
    window.open(api.getWatermarkedDownloadUrl(doc.id), '_blank');
  };

  const handleWorkflowAction = async (action: 'submit' | 'approve' | 'reject' | 'finalize') => {
    try {
      if (action === 'submit') {
        await api.submitDocumentWorkflow(doc.id);
      } else if (action === 'approve') {
        await api.approveDocumentWorkflow(doc.id);
      } else if (action === 'reject') {
        if (!rejectReason) {
          alert('Please specify a rejection reason');
          return;
        }
        await api.rejectDocumentWorkflow(doc.id, rejectReason);
        setShowRejectBox(false);
      } else if (action === 'finalize') {
        await api.finalizeDocumentWorkflow(doc.id);
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Workflow transition failed');
    }
  };

  const handleSign = async () => {
    try {
      await api.signDocument(doc.id);
      setSignStatus('Document signed successfully with NCRB PKI Certificate!');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Signing failed');
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionFile) return;

    try {
      setIsUploadingVersion(true);
      const formData = new FormData();
      formData.append('file', newVersionFile);
      formData.append('changeDescription', changeDescription || 'Supplemental evidentiary update');
      await api.uploadDocumentVersion(doc.id, formData);
      alert(`Version v${doc.version + 1} successfully registered to cryptographic ledger!`);
      onRefresh();
      setActiveTab('versions');
    } catch (err: any) {
      alert(err.message || 'Failed to upload version');
    } finally {
      setIsUploadingVersion(false);
    }
  };

  const role = currentUser?.role;

  return (
    <div className="modal-overlay" style={{ zIndex: 110 }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={22} color="#93c5fd" />
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                {doc.caseNumber} &bull; Stored: {doc.storedFilename}
              </div>
              <h3 style={{ margin: 0, color: '#ffffff' }}>{doc.documentName}</h3>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 16px', overflowX: 'auto' }}>
          {[
            { id: 'preview', label: 'Watermarked Preview', icon: Eye },
            { id: 'workflow', label: `Workflow (${doc.workflowStatus || 'DRAFT'})`, icon: ShieldCheck },
            { id: 'ai', label: 'AI Intelligence', icon: Sparkles },
            { id: 'overview', label: 'Metadata & Hash', icon: FileCode },
            { id: 'versions', label: `Versions (v${doc.version})`, icon: Layers },
            { id: 'signatures', label: 'Signatures', icon: FileSignature },
            { id: 'new-version', label: '+ New Version', icon: Upload },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  borderBottom: isActive ? '3px solid #1d4ed8' : 'none',
                  color: isActive ? '#1d4ed8' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ minHeight: '440px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* TAB 1: WATERMARKED PREVIEW */}
          {activeTab === 'preview' && (
            <div>
              {previewError ? (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '24px', borderRadius: '8px', textAlign: 'center', color: '#991b1b' }}>
                  <AlertTriangle size={32} style={{ margin: '0 auto 8px', color: '#dc2626' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 800 }}>RBAC ACCESS BARRIER TRIGGERED</h4>
                  <p style={{ fontSize: '13px', marginTop: '6px' }}>{previewError}</p>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                    This access attempt has been logged into the cryptographically chained audit trail.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge-status ${doc.isTampered ? 'tampered' : 'valid'}`}>
                        {doc.isTampered ? '🔴 TAMPERED' : '🟢 VALID'}
                      </span>
                      <span className="badge-status encrypted">
                        🔵 {doc.encryptionAlgorithm}
                      </span>
                      {doc.isSigned && (
                        <span className="badge-status signed">
                          🟣 SIGNED
                        </span>
                      )}
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={handleDownloadWatermarked}>
                      <Download size={13} />
                      Export Watermarked Copy
                    </button>
                  </div>

                  {/* Watermark Canvas Container */}
                  <div className="watermark-wrapper">
                    {watermarkMeta && (
                      <div className="watermark-overlay">
                        {watermarkMeta.watermarkText}
                      </div>
                    )}
                    {watermarkMeta && (
                      <div className="watermark-header-stamp">
                        {watermarkMeta.metadataLines.map((line: string, idx: number) => (
                          <div key={idx}>{line}</div>
                        ))}
                      </div>
                    )}
                    <div>
                      {previewContent || 'Document file loaded with zero text extraction.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WORKFLOW TRANSITIONS */}
          {activeTab === 'workflow' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="gov-card">
                <div className="gov-card-header">
                  <h3>
                    <ShieldCheck size={16} color="#1d4ed8" />
                    Document Lifecycle &amp; Evidentiary Approval
                  </h3>
                  <span className={`badge-status ${doc.workflowStatus === 'APPROVED' || doc.workflowStatus === 'FINALIZED' ? 'valid' : doc.workflowStatus === 'REJECTED' ? 'tampered' : 'under-review'}`}>
                    {doc.workflowStatus === 'APPROVED' ? '🟢 APPROVED' : doc.workflowStatus === 'FINALIZED' ? '🟢 FINALIZED' : doc.workflowStatus === 'REJECTED' ? '🔴 REJECTED' : '🟠 UNDER REVIEW'}
                  </span>
                </div>
                <div className="gov-card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    {['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'FINALIZED'].map((st, idx) => {
                      const isPast =
                        st === doc.workflowStatus ||
                        (doc.workflowStatus === 'FINALIZED' && st !== 'REJECTED') ||
                        (doc.workflowStatus === 'APPROVED' && (st === 'DRAFT' || st === 'UNDER_REVIEW'));
                      return (
                        <div
                          key={st}
                          style={{
                            background: isPast ? '#eff6ff' : '#f8fafc',
                            border: isPast ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                            padding: '10px',
                            borderRadius: '6px',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '10px', color: '#64748b' }}>Step {idx + 1}</div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: isPast ? '#1d4ed8' : '#64748b' }}>
                            {st.replace(/_/g, ' ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions based on current status and role */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {doc.workflowStatus === 'DRAFT' && (
                      <button className="btn btn-primary" onClick={() => handleWorkflowAction('submit')}>
                        Submit for Official Review
                      </button>
                    )}

                    {(doc.workflowStatus === 'DRAFT' || doc.workflowStatus === 'UNDER_REVIEW') && (
                      <>
                        <button className="btn btn-success" onClick={() => handleWorkflowAction('approve')}>
                          <CheckCircle size={14} />
                          Approve Document
                        </button>
                        <button className="btn btn-danger" onClick={() => setShowRejectBox(!showRejectBox)}>
                          Reject with Reason
                        </button>
                      </>
                    )}

                    {doc.workflowStatus === 'APPROVED' && (
                      <button className="btn btn-primary" onClick={() => handleWorkflowAction('finalize')}>
                        Finalize for Court Submission
                      </button>
                    )}

                    {!doc.isSigned && (
                      <button className="btn btn-warning" onClick={handleSign}>
                        <FileSignature size={14} />
                        Apply PKI Digital Signature
                      </button>
                    )}
                  </div>

                  {/* Rejection input box */}
                  {showRejectBox && (
                    <div style={{ marginTop: '14px', background: '#fee2e2', padding: '14px', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                      <label className="form-label" style={{ color: '#991b1b' }}>Specify Reason for Rejection *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Signature missing on page 2, mismatch in seizure date..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleWorkflowAction('reject')}>
                          Confirm Rejection
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowRejectBox(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI DOCUMENT INTELLIGENCE */}
          {activeTab === 'ai' && (
            <div>
              {loadingAi ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  Analyzing document content with AI Intelligence...
                </div>
              ) : aiSummary ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="gov-card">
                    <div className="gov-card-header">
                      <h3>
                        <Sparkles size={16} color="#1d4ed8" />
                        AI Executive Summary
                      </h3>
                      <span className="badge-pill" style={{ background: '#fef3c7', color: '#b45309' }}>
                        AI Generated &bull; Section 65B Notice
                      </span>
                    </div>
                    <div className="gov-card-body">
                      <p style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.6 }}>
                        {aiSummary.summary}
                      </p>
                      <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                        * Disclaimer: AI summaries are advisory for investigating officers. Legal court filings require verified human attestations.
                      </div>
                    </div>
                  </div>

                  {/* Extracted Entities */}
                  <div className="gov-card">
                    <div className="gov-card-header">
                      <h3>Extracted Legal &amp; Investigation Entities</h3>
                    </div>
                    <div className="gov-card-body">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '12px' }}>
                        <div>
                          <strong>Persons Named:</strong>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {aiSummary.entities?.persons?.length > 0 ? (
                              aiSummary.entities.persons.map((p: string) => (
                                <span key={p} className="badge-pill">{p}</span>
                              ))
                            ) : (
                              <span style={{ color: '#94a3b8' }}>None identified</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <strong>Statutes / IPC Sections:</strong>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {aiSummary.entities?.lawSections?.length > 0 ? (
                              aiSummary.entities.lawSections.map((s: string) => (
                                <span key={s} className="badge-pill" style={{ background: '#eff6ff', color: '#1d4ed8' }}>{s}</span>
                              ))
                            ) : (
                              <span style={{ color: '#94a3b8' }}>None identified</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <strong>Locations:</strong>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {aiSummary.entities?.locations?.length > 0 ? (
                              aiSummary.entities.locations.map((loc: string) => (
                                <span key={loc} className="badge-pill">{loc}</span>
                              ))
                            ) : (
                              <span style={{ color: '#94a3b8' }}>None identified</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <strong>Organizations:</strong>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {aiSummary.entities?.organizations?.length > 0 ? (
                              aiSummary.entities.organizations.map((org: string) => (
                                <span key={org} className="badge-pill">{org}</span>
                              ))
                            ) : (
                              <span style={{ color: '#94a3b8' }}>None identified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 4: METADATA & HASH */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px' }}>
                <div><strong>Document ID:</strong> #{doc.id}</div>
                <div><strong>Document Type:</strong> {doc.documentType}</div>
                <div><strong>Classification:</strong> {doc.classification}</div>
                <div><strong>File Size:</strong> {(doc.fileSize / 1024).toFixed(1)} KB</div>
                <div><strong>Uploader:</strong> {doc.uploadedBy} ({doc.uploaderRole})</div>
                <div><strong>Upload Date:</strong> {new Date(doc.uploadedAt).toLocaleString()}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Cryptographic SHA-256 Digest
                </span>
                <div className="mono-hash" style={{ width: '100%', marginTop: '4px' }}>
                  {doc.sha256Hash}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VERSIONS */}
          {activeTab === 'versions' && (
            <div>
              <h4 style={{ fontSize: '14px', marginBottom: '12px', color: '#0b2545' }}>Version Ledger (v{doc.version})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {doc.versions?.map((v) => (
                  <div key={v.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>Version v{v.version}</strong>
                      <span className="timeline-time">{new Date(v.uploadedAt).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', margin: '4px 0' }}>{v.changeDescription}</div>
                    <div className="mono-hash" style={{ width: '100%' }}>{v.sha256Hash}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SIGNATURES */}
          {activeTab === 'signatures' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', color: '#0b2545' }}>PKI Digital Signatures</h4>
                {!doc.isSigned && (
                  <button className="btn btn-primary btn-sm" onClick={handleSign}>
                    <FileSignature size={13} />
                    Sign Document
                  </button>
                )}
              </div>
              {doc.signatures && doc.signatures.length > 0 ? (
                doc.signatures.map((s, idx) => (
                  <div key={idx} style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '14px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{s.signedBy} ({s.signedByRole})</strong>
                      <span className="badge-status signed" style={{ fontSize: '10px' }}>🟣 SIGNED</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Timestamp: {new Date(s.signedAt).toLocaleString()}
                    </div>
                    <div className="mono-hash" style={{ marginTop: '6px', width: '100%' }}>
                      CERT: {s.certificateHash}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  No digital signatures registered yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 7: NEW VERSION */}
          {activeTab === 'new-version' && (
            <form onSubmit={handleUploadVersion} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Upload Revised Document File *</label>
                <input
                  type="file"
                  className="form-input"
                  required
                  onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Revision / Amendment *</label>
                <textarea
                  className="form-textarea"
                  required
                  placeholder="e.g. Added Section 161 deposition annexure as ordered by the court..."
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isUploadingVersion}>
                {isUploadingVersion ? 'Computing Hashes...' : `Register Version v${doc.version + 1}`}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
