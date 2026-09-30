import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Case, LegalDocument, CasePriority, CaseStatus } from '../types.ts';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';

interface CasesViewProps {
  onSelectDocument?: (doc: LegalDocument) => void;
}

export const CasesView: React.FC<CasesViewProps> = ({ onSelectDocument }) => {
  const { currentUser, setUnauthorizedAlert } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [caseDocs, setCaseDocs] = useState<LegalDocument[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Case form state
  const [caseNumber, setCaseNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [crimeType, setCrimeType] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [priority, setPriority] = useState<CasePriority>('HIGH');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const openCaseDetails = async (c: Case) => {
    setSelectedCase(c);
    try {
      const res = await api.getCaseById(c.id);
      setCaseDocs(res.documents);
    } catch (err: any) {
      console.error('Failed to load case documents:', err);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNumber || !title || !crimeType || !location) return;

    try {
      setIsSubmitting(true);
      const created = await api.createCase({
        caseNumber,
        title,
        crimeType,
        location,
        priority,
        description,
      });
      setShowCreateModal(false);
      // Reset form
      setCaseNumber('');
      setTitle('');
      setCrimeType('');
      setLocation('');
      setDescription('');
      await fetchCases();
      openCaseDetails(created);
    } catch (err: any) {
      alert(err.message || 'Failed to create case');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = currentUser?.role === 'ADMIN' || currentUser?.role === 'POLICE_OFFICER' || currentUser?.role === 'INVESTIGATION_OFFICER';

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.crimeType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="cases-view" id="ncrb-cases-view">
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gov-navy-950)' }}>
            Investigation &amp; Legal Cases Repository
          </h2>
          <p style={{ color: 'var(--gov-text-secondary)', fontSize: '13.5px' }}>
            National Crime Records Bureau Case Ledger &bull; Chain of Custody Protected
          </p>
        </div>

        {canCreate && (
          <button
            className="btn-gov btn-gov-blue"
            onClick={() => {
              const nextNum = `CASE-2026-00${cases.length + 1}`;
              setCaseNumber(nextNum);
              setShowCreateModal(true);
            }}
            id="btn-create-case"
          >
            <Plus size={16} /> Register New Case (DEMO 2)
          </button>
        )}
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
              placeholder="Search by Case Number, Title, Crime Type, Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#64748b" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Status:</span>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="UNDER_INVESTIGATION">Under Investigation</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="CHARGE_SHEET_FILED">Charge Sheet Filed</option>
              <option value="IN_COURT">In Court</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Case Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedCase ? '1fr 1fr' : '1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredCases.map((c) => (
            <div
              key={c.id}
              className="gov-card"
              style={{
                cursor: 'pointer',
                borderLeft: selectedCase?.id === c.id ? '5px solid var(--gov-blue-600)' : '1px solid var(--gov-border)',
                background: selectedCase?.id === c.id ? '#f0f9ff' : '#ffffff',
                marginBottom: 0,
              }}
              onClick={() => openCaseDetails(c)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--gov-navy-900)', fontSize: '15px' }}>
                    {c.caseNumber}
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gov-text-primary)', marginTop: '2px' }}>
                    {c.title}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className={`badge-status ${c.priority === 'CRITICAL' ? 'danger' : c.priority === 'HIGH' ? 'warning' : 'info'}`}>
                    {c.priority}
                  </span>
                  <span className="badge-status info">
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--gov-text-secondary)', marginBottom: '12px' }}>
                {c.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '12px', color: 'var(--gov-text-muted)', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} /> {c.location}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <User size={13} /> IO: {c.investigatingOfficer}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> {new Date(c.createdAt).toLocaleDateString()}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', fontWeight: 600, color: 'var(--gov-blue-700)' }}>
                  <FileText size={13} /> {c.documentCount || 0} Registered Documents
                </span>
              </div>
            </div>
          ))}

          {filteredCases.length === 0 && (
            <div className="gov-card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <p>No investigation cases match the specified filters.</p>
            </div>
          )}
        </div>

        {/* Selected Case Detail Drawer */}
        {selectedCase && (
          <div className="gov-card" style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
            <div className="gov-card-header">
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gov-blue-700)', fontWeight: 800, fontSize: '14px' }}>
                  {selectedCase.caseNumber}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 800 }}>{selectedCase.title}</h3>
              </div>
              <button
                className="btn-gov btn-gov-outline btn-gov-sm"
                onClick={() => setSelectedCase(null)}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', marginBottom: '18px' }}>
              <div><strong>Crime Type:</strong> {selectedCase.crimeType}</div>
              <div><strong>Jurisdiction Location:</strong> {selectedCase.location}</div>
              <div><strong>Department:</strong> {selectedCase.department}</div>
              <div><strong>Lead Investigating Officer:</strong> {selectedCase.investigatingOfficer}</div>
              <div><strong>Case Registered By:</strong> {selectedCase.createdBy}</div>
              <div><strong>Summary:</strong> {selectedCase.description}</div>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: 700, borderBottom: '1px solid var(--gov-border-light)', paddingBottom: '6px', marginBottom: '12px' }}>
              Attached Evidence &amp; Documents ({caseDocs.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
              {caseDocs.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--gov-border-light)',
                    background: (d as any).isRestrictedForCurrentUser ? '#fef2f2' : '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color={(d as any).isRestrictedForCurrentUser ? '#dc2626' : '#2563eb'} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{d.documentName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>
                        {d.documentType} &bull; v{d.version} &bull; {d.classification}
                      </div>
                    </div>
                  </div>

                  {(d as any).isRestrictedForCurrentUser ? (
                    <span className="badge-status danger" title="Role cannot view internal document (Demo 8)">
                      Restricted (403)
                    </span>
                  ) : (
                    <button
                      className="btn-gov btn-gov-outline btn-gov-sm"
                      onClick={() => onSelectDocument && onSelectDocument(d)}
                    >
                      View
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Case Modal (DEMO 2) */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="modal-title">Register New Investigation Case</span>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCase}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Case Number (Auto-assigned format):</label>
                  <input
                    type="text"
                    className="form-input"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Case Title / Incident Name:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Organized Financial Fraud &amp; Identity Theft"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Crime Category:</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Cyber Crime, Theft, Homicide, Fraud"
                      value={crimeType}
                      onChange={(e) => setCrimeType(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Jurisdiction / Location:</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Bengaluru City Central"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Level:</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as CasePriority)}
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="CRITICAL">Critical / Urgent Response</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Incident Description &amp; FIR Brief:</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Enter factual summary of the complaint or incident..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-gov btn-gov-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gov btn-gov-blue"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Register Case on Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
