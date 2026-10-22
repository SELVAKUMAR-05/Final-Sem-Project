import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Case, Evidence, EvidenceStatus } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { Pagination } from '../../components/common/Pagination.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { useToast } from '../../components/common/Toast.tsx';
import {
  Package,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  User,
  MapPin,
  X
} from 'lucide-react';

export const EvidencePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [casesLoading, setCasesLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // New Evidence Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [evidenceType, setEvidenceType] = useState<string>('Mobile Device / Smartphone');
  const [description, setDescription] = useState<string>('');
  const [sealNumber, setSealNumber] = useState<string>('');
  const [collectionLocation, setCollectionLocation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const data = await api.getEvidence();
      setEvidenceList(data);
    } catch (err) {
      console.error('Failed to load evidence:', err);
      showToast('Error loading evidence registry', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      console.error('Failed to load registered cases:', err);
      showToast('Error loading registered cases', 'error');
    } finally {
      setCasesLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
    fetchCases();
  }, []);

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !description || !sealNumber) return;

    const selectedCase = cases.find((registeredCase) => registeredCase.id === Number(selectedCaseId));
    if (!selectedCase) {
      showToast('Select a registered case before registering evidence', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await api.createEvidence({
        caseId: selectedCase.id,
        evidenceType,
        description,
        sealNumber,
        collectionLocation,
        condition: 'Tamper-Evident Sealed & Verified'
      });

      setEvidenceList([created, ...evidenceList]);
      setShowCreateModal(false);
      showToast(`Evidence ${created.evidenceId} logged into official chain of custody`, 'success');
      navigate(`/evidence/${created.evidenceId}`);

      // Reset
      setSelectedCaseId('');
      setDescription('');
      setSealNumber('');
      setCollectionLocation('');
    } catch (err: any) {
      showToast(err.message || 'Error registering evidence item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEvidence = evidenceList.filter((ev) => {
    const matchesSearch =
      ev.evidenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.currentCustodian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.sealNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || ev.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginatedEvidence = filteredEvidence.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalCount = evidenceList.length;
  const underExamCount = evidenceList.filter((e) => e.status === 'UNDER_FORENSIC_EXAMINATION').length;
  const inCourtCount = evidenceList.filter((e) => e.status === 'PRESENTED_IN_COURT').length;
  const tamperedCount = evidenceList.filter((e) => e.isTampered).length;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Evidence & Chain of Custody' }]} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
            Evidence &amp; Chain of Custody Registry
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Tamper-proof tracking of physical &amp; digital forensic exhibits with verifiable transfer handoffs.
          </p>
        </div>

        {currentUser?.role !== 'LAWYER' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
          >
            <Plus size={16} />
            <span>Register Evidence Exhibit</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Exhibits
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {totalCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
            Under Forensic Exam
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#6d28d9', marginTop: '6px' }}>
            {underExamCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
            Presented in Court
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857', marginTop: '6px' }}>
            {inCourtCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: tamperedCount > 0 ? '#dc2626' : '#059669', textTransform: 'uppercase' }}>
            Custody Integrity
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: tamperedCount > 0 ? '#b91c1c' : '#047857', marginTop: '6px' }}>
            {tamperedCount > 0 ? `${tamperedCount} SEAL VIOLATIONS` : '100% VERIFIED'}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
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
            placeholder="Search by evidence ID, description, case number, or custodian..."
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
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Status:</span>
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
            <option value="ALL">All Statuses</option>
            <option value="COLLECTED">Collected</option>
            <option value="SEALED">Sealed</option>
            <option value="STORED">Stored in Vault</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="UNDER_FORENSIC_EXAMINATION">Under Forensic Exam</option>
            <option value="PRESENTED_IN_COURT">Presented in Court</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : paginatedEvidence.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No evidence found"
          description="There are currently no evidence items matching your query and filter parameters."
          actionLabel={currentUser?.role !== 'LAWYER' ? '+ Register New Evidence' : undefined}
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '14px 18px' }}>Evidence ID</th>
                <th style={{ padding: '14px 18px' }}>Case Docket</th>
                <th style={{ padding: '14px 18px' }}>Description &amp; Classification</th>
                <th style={{ padding: '14px 18px' }}>Tamper Seal ID</th>
                <th style={{ padding: '14px 18px' }}>Current Custodian</th>
                <th style={{ padding: '14px 18px' }}>Custody Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvidence.map((ev) => (
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
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: '#1d4ed8', fontFamily: "'JetBrains Mono', monospace" }}>
                    {ev.evidenceId}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a', fontFamily: "'JetBrains Mono', monospace" }}>
                    {ev.caseNumber}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{ev.description}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{ev.evidenceType}</div>
                  </td>
                  <td style={{ padding: '14px 18px', fontFamily: "'JetBrains Mono', monospace", color: '#475569' }}>
                    <span style={{ background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px' }}>
                      {ev.sealNumber}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{ev.currentCustodian}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{ev.currentCustodianRole}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
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
                      <span>Chain of Custody</span>
                      <ArrowRight size={14} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredEvidence.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* New Evidence Modal */}
      {showCreateModal && (
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
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Register Evidence Exhibit
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvidence}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Case Docket Number *
                  </label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    disabled={casesLoading || cases.length === 0}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                    required
                  >
                    <option value="" disabled>
                      {casesLoading ? 'Loading registered cases...' : cases.length === 0 ? 'No registered cases available' : 'Select a registered case'}
                    </option>
                    {cases.map((registeredCase) => (
                      <option key={registeredCase.id} value={registeredCase.id}>
                        {registeredCase.caseNumber} — {registeredCase.title}
                      </option>
                    ))}
                  </select>
                  {cases.length === 0 && !casesLoading && (
                    <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '5px' }}>
                      Register a case before adding evidence to the inventory.
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Tamper-Evident Seal ID *
                  </label>
                  <input
                    type="text"
                    value={sealNumber}
                    onChange={(e) => setSealNumber(e.target.value)}
                    placeholder="e.g. SEAL-MHA-9081"
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
              </div>

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
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Mobile Device / Smartphone">Mobile Device / Smartphone</option>
                  <option value="Storage Drive / SSD / Hard Drive">Storage Drive / SSD / Hard Drive</option>
                  <option value="Server / Forensic Image E01">Server / Forensic Image E01</option>
                  <option value="Network Router / IoT Hardware">Network Router / IoT Hardware</option>
                  <option value="Physical Documents / Ledger">Physical Documents / Ledger</option>
                  <option value="Forensic Swab / Blood Sample">Forensic Swab / Blood Sample</option>
                  <option value="Weapon / Ballistics Exhibit">Weapon / Ballistics Exhibit</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Item Description &amp; Serial Number *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Samsung Galaxy S23 (IMEI 35891..., recovered from scene)"
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

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Collection Location / Incident Scene
                </label>
                <input
                  type="text"
                  value={collectionLocation}
                  onChange={(e) => setCollectionLocation(e.target.value)}
                  placeholder="e.g. Depository Vault Floor 2, Sector 4"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || casesLoading || cases.length === 0}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'Logging...' : 'Register Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
