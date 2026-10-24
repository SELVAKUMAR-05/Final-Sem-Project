import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { LegalDocument, DocumentType } from '../types.ts';
import {
  FileText,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Lock,
  Layers,
  FileSignature,
  Eye,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { DocumentDetailModal } from './DocumentDetailModal.tsx';
import { DocumentUploadModal } from './DocumentUploadModal.tsx';

interface DocumentsViewProps {
  onGoToIntegrity?: (doc: LegalDocument) => void;
  initialDocument?: LegalDocument | null;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ onGoToIntegrity, initialDocument }) => {
  const { currentUser, setUnauthorizedAlert } = useAuth();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(initialDocument || null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [unauthorizedModalMsg, setUnauthorizedModalMsg] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [currentUser?.role]);

  // Handle document view with RBAC enforcement (DEMO 8)
  const handleViewDocument = async (doc: LegalDocument) => {
    try {
      const fullDoc = await api.getDocumentById(doc.id);
      setSelectedDoc(fullDoc);
    } catch (err: any) {
      if (err.status === 403) {
        const msg = err.data?.message || `403 Forbidden - Access Denied: Role "${currentUser?.role}" is not cleared to access "${doc.documentName}"`;
        setUnauthorizedModalMsg(msg);
        setUnauthorizedAlert(msg);
      } else {
        alert(err.message || 'Error fetching document');
      }
    }
  };

  const handleDownload = async (docId: number) => {
    try {
      await api.downloadDocument(docId);
    } catch (err: any) {
      if (err.status === 403) {
        const msg = err.message || `Role "${currentUser?.role}" is not authorized to download this document.`;
        setUnauthorizedModalMsg(msg);
        setUnauthorizedAlert(msg);
      } else {
        alert(err.message || 'Document download failed');
      }
    }
  };

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.sha256Hash.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || d.documentType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="documents-view" id="ncrb-documents-view">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gov-navy-950)' }}>
            Digital Evidence &amp; Investigation Document Vault
          </h2>
          <p style={{ color: 'var(--gov-text-secondary)', fontSize: '13.5px' }}>
            AES-256 Encrypted at rest &bull; SHA-256 Merkle verifiable chain of custody &bull; Sec 65B Compliant
          </p>
        </div>

        <button className="btn-gov btn-gov-blue" onClick={() => setShowUploadModal(true)}>
          <Upload size={16} /> Upload New Document (DEMO 3)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="gov-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by Document Name, Case #, Uploader, SHA-256 Hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#64748b" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Category:</span>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="FIR">FIRs</option>
              <option value="POLICE_REPORT">Police Reports</option>
              <option value="INVESTIGATION_REPORT">Investigation Reports</option>
              <option value="WITNESS_STATEMENT">Witness Statements</option>
              <option value="CHARGE_SHEET">Charge Sheets</option>
              <option value="COURT_FILING">Court Filings</option>
              <option value="EVIDENCE">Evidence Exhibits</option>
              <option value="FORENSIC_REPORT">CFSL Forensic Reports</option>
              <option value="LEGAL_NOTICE">Legal Notices</option>
              <option value="JUDGMENT">Court Judgments</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Table */}
      <div className="gov-table-wrap">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Document Name &amp; Stored File</th>
              <th>Category</th>
              <th>Case Number</th>
              <th>SHA-256 Digest</th>
              <th>Version</th>
              <th>Security Status</th>
              <th>Digital Signature</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((doc) => {
              const isBlocked = (doc as any).canAccess === false;
              return (
                <tr
                  key={doc.id}
                  style={{
                    background: isBlocked ? '#fff5f5' : undefined,
                    opacity: isBlocked ? 0.85 : 1,
                  }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <FileText
                        size={20}
                        color={isBlocked ? '#dc2626' : '#2563eb'}
                        style={{ marginTop: '2px', flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--gov-navy-950)' }}>
                          {doc.documentName}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--gov-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {doc.storedFilename} &bull; {(doc.fileSize / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="badge-status info">{doc.documentType}</span>
                  </td>

                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {doc.caseNumber}
                  </td>

                  <td>
                    <span className="hash-pill" title={doc.sha256Hash}>
                      {doc.sha256Hash.slice(0, 16)}...
                    </span>
                  </td>

                  <td>
                    <span style={{ fontWeight: 800, color: '#2563eb', background: '#dbeafe', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                      v{doc.version}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                      <Lock size={12} /> AES-256
                    </div>
                  </td>

                  <td>
                    <span className={`badge-status ${doc.signed ? 'success' : 'warning'}`}>
                      {doc.signed ? 'SIGNED' : 'NOT SIGNED'}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      {/* View details button: If user is unauthorized, clicking triggers Demo 8 403 Forbidden */}
                      <button
                        className="btn-gov btn-gov-outline btn-gov-sm"
                        onClick={() => handleViewDocument(doc)}
                        title={isBlocked ? 'Attempting view will verify 403 Forbidden RBAC protection (Demo 8)' : 'View full metadata & versions'}
                      >
                        <Eye size={13} /> {isBlocked ? 'Attempt View (403)' : 'Inspect'}
                      </button>

                      {!isBlocked && (
                        <button
                          className="btn-gov btn-gov-outline btn-gov-sm"
                          onClick={() => handleDownload(doc.id)}
                          title="Download binary file (captures audit log)"
                        >
                          <Download size={13} />
                        </button>
                      )}

                      {!isBlocked && onGoToIntegrity && (
                        <button
                          className="btn-gov btn-gov-outline btn-gov-sm"
                          onClick={() => onGoToIntegrity(doc)}
                          title="Verify SHA-256 Hash Integrity (Demo 7)"
                          style={{ color: '#059669', borderColor: '#a7f3d0' }}
                        >
                          <ShieldCheck size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredDocs.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--gov-text-muted)' }}>
                  No documents found matching the search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Document Detail Modal */}
      {selectedDoc && (
        <DocumentDetailModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onRefresh={fetchDocuments}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchDocuments}
        />
      )}

      {/* DEMO 8: Unauthorized Access Alert Modal (403 Forbidden) */}
      {unauthorizedModalMsg && (
        <div className="modal-overlay" style={{ zIndex: 150 }}>
          <div className="modal-dialog" style={{ maxWidth: '520px', borderTop: '6px solid #dc2626' }}>
            <div className="modal-header" style={{ background: '#fef2f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b' }}>
                <AlertTriangle size={24} color="#dc2626" />
                <span className="modal-title" style={{ color: '#991b1b' }}>
                  403 Forbidden - Access Denied (DEMO 8)
                </span>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#0f172a', marginBottom: '14px' }}>
                {unauthorizedModalMsg}
              </p>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}>
                <strong>Audit Compliance Record:</strong> An unauthorized access breach incident has been logged into the NCRB immutable audit trail with your active user ID, role, IP address, and timestamp.
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-gov btn-gov-primary"
                onClick={() => setUnauthorizedModalMsg(null)}
              >
                Acknowledge Security Restriction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
