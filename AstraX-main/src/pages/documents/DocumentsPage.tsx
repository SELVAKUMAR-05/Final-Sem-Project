import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { LegalDocument, DocumentType, WorkflowStatus } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { Pagination } from '../../components/common/Pagination.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { useToast } from '../../components/common/Toast.tsx';
import { DocumentUploadModal } from '../../components/DocumentUploadModal.tsx';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Download
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const itemsPerPage = 8;

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
      showToast('Error loading legal documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || d.documentType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || d.workflowStatus === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const approvedCount = documents.filter((d) => d.workflowStatus === 'APPROVED' || d.workflowStatus === 'SIGNED').length;
  const pendingCount = documents.filter((d) => d.workflowStatus === 'SUBMITTED' || d.workflowStatus === 'UNDER_REVIEW').length;
  const tamperedCount = documents.filter((d) => d.isTampered).length;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Documents' }]} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
            Legal Documents Repository
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            AES-256 encrypted digital evidence, FIRs, charge sheets, forensic reports, and court submissions.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
        >
          <Plus size={16} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Top Stat Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Documents
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {documents.length}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
            Approved / Signed
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857', marginTop: '6px' }}>
            {approvedCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>
            Pending Review
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#b45309', marginTop: '6px' }}>
            {pendingCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: tamperedCount > 0 ? '#dc2626' : '#059669', textTransform: 'uppercase' }}>
            Tamper Status
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: tamperedCount > 0 ? '#b91c1c' : '#047857', marginTop: '6px' }}>
            {tamperedCount > 0 ? `${tamperedCount} TAMPERED` : '100% SECURE'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by document title, filename, case ID, or uploader..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box'
            }}
          />
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#64748b" />
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff'
            }}
          >
            <option value="ALL">All Types</option>
            <option value="FIR">First Information Report (FIR)</option>
            <option value="CHARGE_SHEET">Charge Sheet</option>
            <option value="FORENSIC_REPORT">Forensic Report</option>
            <option value="EVIDENCE_LOG">Evidence Log</option>
            <option value="WITNESS_STATEMENT">Witness Statement</option>
            <option value="COURT_ORDER">Court Order</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Workflow:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff'
            }}
          >
            <option value="ALL">All Workflows</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="SIGNED">Signed</option>
          </select>
        </div>
      </div>

      {/* Main Documents Table */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : paginatedDocs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="There are currently no legal documents matching your query and filter parameters."
          actionLabel="+ Upload Legal Document"
          onAction={() => setShowUploadModal(true)}
        />
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '14px 18px' }}>Document Name</th>
                <th style={{ padding: '14px 18px' }}>Case Number</th>
                <th style={{ padding: '14px 18px' }}>Type</th>
                <th style={{ padding: '14px 18px' }}>Workflow Status</th>
                <th style={{ padding: '14px 18px' }}>Integrity &amp; Encryption</th>
                <th style={{ padding: '14px 18px' }}>Uploaded By</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDocs.map((doc) => (
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
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} color="#1d4ed8" />
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{doc.documentName}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                          {doc.originalFilename} (v{doc.version})
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#1d4ed8', fontFamily: "'JetBrains Mono', monospace" }}>
                    {doc.caseNumber}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 700 }}>
                      {doc.documentType}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: doc.workflowStatus === 'APPROVED' || doc.workflowStatus === 'SIGNED' ? '#ecfdf5' : '#fef3c7',
                        color: doc.workflowStatus === 'APPROVED' || doc.workflowStatus === 'SIGNED' ? '#065f46' : '#92400e'
                      }}
                    >
                      {doc.workflowStatus}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {doc.isTampered ? (
                      <span style={{ color: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <AlertTriangle size={14} />
                        TAMPER DETECTED
                      </span>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <CheckCircle2 size={14} />
                        AES-256 / SHA-256
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#475569' }}>
                    <div>{doc.uploadedBy}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#1d4ed8'
                      }}
                    >
                      <span>Open Workspace</span>
                      <ArrowRight size={14} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredDocs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* Global Upload Document Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchDocuments();
            showToast('Document securely uploaded and encrypted', 'success');
          }}
        />
      )}
    </div>
  );
};
