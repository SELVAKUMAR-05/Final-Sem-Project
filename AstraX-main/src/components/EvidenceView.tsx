import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Evidence, Case } from '../types.ts';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  ShieldCheck,
  Eye,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface EvidenceViewProps {
  onSelectEvidenceForChain?: (evidenceId: string) => void;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ onSelectEvidenceForChain }) => {
  const { currentUser } = useAuth();
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCaseId, setFilterCaseId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>(null);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Form states
  const [newEvidence, setNewEvidence] = useState({
    caseId: '',
    evidenceType: 'DIGITAL_STORAGE',
    description: '',
    collectionLocation: '',
    sealNumber: '',
    condition: 'Pristine, enclosed in tamper-proof anti-static bag',
  });

  const [transferData, setTransferData] = useState({
    toUser: '',
    toRole: 'FORENSIC_OFFICER',
    transferReason: 'Forensic extraction & binary hash verification at CFSL',
    location: 'Central Forensic Science Laboratory, Room 402',
    conditionBefore: 'Seal intact, no visible compromise',
    conditionAfter: 'Custodial possession transferred under signed manifest',
  });

  const [receiveData, setReceiveData] = useState({
    verifiedSeal: true,
    notes: 'Seal verified intact, barcode scanned into vault intake',
  });

  const canCollect = currentUser?.role === 'ADMIN' || currentUser?.role === 'POLICE_OFFICER' || currentUser?.role === 'INVESTIGATION_OFFICER';
  const canTransfer = currentUser?.role === 'ADMIN' || currentUser?.role === 'POLICE_OFFICER' || currentUser?.role === 'INVESTIGATION_OFFICER' || currentUser?.role === 'FORENSIC_OFFICER';

  const loadData = async () => {
    setLoading(true);
    try {
      const [evList, caseList, secStats] = await Promise.all([
        api.getEvidence(filterCaseId !== 'ALL' ? parseInt(filterCaseId, 10) : undefined),
        api.getCases(),
        api.getEvidenceSecurityStats(),
      ]);
      setEvidenceList(evList);
      setCases(caseList);
      setStats(secStats);
    } catch (err) {
      console.error('Failed to load evidence', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterCaseId]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvidence.caseId || !newEvidence.description || !newEvidence.sealNumber) return;

    try {
      await api.createEvidence({
        caseId: parseInt(newEvidence.caseId, 10),
        evidenceType: newEvidence.evidenceType,
        description: newEvidence.description,
        collectionLocation: newEvidence.collectionLocation,
        sealNumber: newEvidence.sealNumber,
        condition: newEvidence.condition,
      });
      setShowRegisterModal(false);
      setNewEvidence({
        caseId: '',
        evidenceType: 'DIGITAL_STORAGE',
        description: '',
        collectionLocation: '',
        sealNumber: '',
        condition: 'Pristine, enclosed in tamper-proof anti-static bag',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to register evidence');
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvidence) return;

    try {
      await api.transferEvidence(selectedEvidence.evidenceId, transferData);
      setShowTransferModal(false);
      setSelectedEvidence(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to transfer custody');
    }
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvidence) return;

    try {
      await api.receiveEvidence(selectedEvidence.evidenceId, receiveData);
      setShowReceiveModal(false);
      setSelectedEvidence(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to receive evidence');
    }
  };

  const handleVerifySeal = async (ev: Evidence) => {
    try {
      const res = await api.verifyEvidenceIntegrity(ev.evidenceId);
      setVerificationResult(res);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  const handleToggleTamper = async (ev: Evidence) => {
    try {
      const res = await api.toggleEvidenceTamper(ev.evidenceId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle tamper simulation');
    }
  };

  const filteredEvidence = evidenceList.filter((ev) => {
    const matchSearch =
      ev.evidenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.sealNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.currentCustodian.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  return (
    <div id="evidence-view">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>
            <Package size={24} color="#1d4ed8" />
            Digital & Physical Evidence Vault
          </h1>
          <p>Section 65B Certified Chain of Custody &amp; Cryptographic Evidence Seal Tracking</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadData}>
            <RefreshCw size={14} />
            Refresh
          </button>
          {canCollect && (
            <button className="btn btn-primary" onClick={() => setShowRegisterModal(true)} id="btn-register-evidence">
              <Plus size={15} />
              Register New Evidence
            </button>
          )}
        </div>
      </div>

      {/* Security Stats Bar */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-metric-card">
            <span className="label">Total Evidence Items</span>
            <span className="value">{stats.total}</span>
            <span className="sub">Secured in NCRB Vault</span>
          </div>
          <div className="stat-metric-card">
            <span className="label">Valid Seals</span>
            <span className="value" style={{ color: '#16a34a' }}>{stats.validSeals}</span>
            <span className="sub">🟢 Cryptographically Intact</span>
          </div>
          <div className="stat-metric-card">
            <span className="label">Tampered / Flagged</span>
            <span className="value" style={{ color: stats.tamperedSeals > 0 ? '#dc2626' : '#64748b' }}>
              {stats.tamperedSeals}
            </span>
            <span className="sub">{stats.tamperedSeals > 0 ? '🔴 Breach Detected' : '0 Compromises'}</span>
          </div>
          <div className="stat-metric-card">
            <span className="label">Custody Integrity</span>
            <span className="value" style={{ color: '#1d4ed8' }}>{stats.custodyIntegrityRate}%</span>
            <span className="sub">Audit verified compliance</span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="gov-card" style={{ marginBottom: '20px' }}>
        <div className="gov-card-body" style={{ padding: '14px 20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by Evidence ID, Case #, Seal #, Custodian..."
              className="form-input"
              style={{ paddingLeft: '34px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="#64748b" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Case:</span>
            <select
              className="form-select"
              style={{ width: '220px' }}
              value={filterCaseId}
              onChange={(e) => setFilterCaseId(e.target.value)}
            >
              <option value="ALL">All Active Cases</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.caseNumber} - {c.title.substring(0, 22)}...
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <h2>
            <ShieldCheck size={18} color="#1d4ed8" />
            Active Evidence Items ({filteredEvidence.length})
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Showing items with real-time cryptographic seal statuses
          </span>
        </div>
        <div className="gov-table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Evidence ID</th>
                <th>Case Info</th>
                <th>Type &amp; Description</th>
                <th>Seal Number</th>
                <th>Current Custodian</th>
                <th>Integrity Seal</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvidence.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No evidence items found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEvidence.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0b2545', fontFamily: 'var(--font-mono)' }}>
                        {ev.evidenceId}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: '#0b2545', fontSize: '12px' }}>{ev.caseNumber}</strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Case #{ev.caseId}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="badge-pill" style={{ width: 'fit-content' }}>
                          {ev.evidenceType.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: '12px', color: '#334155', maxWidth: '260px' }}>
                          {ev.description}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="mono-hash">{ev.sealNumber}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#0b2545' }}>{ev.currentCustodian}</span>
                        <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>
                          {ev.currentCustodianRole.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td>
                      {ev.isTampered ? (
                        <span className="badge-status tampered" title="Tampered Seal detected!">
                          🔴 TAMPERED
                        </span>
                      ) : (
                        <span className="badge-status valid" title="Seal is verified intact">
                          🟢 VALID
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge-status encrypted">
                        🔵 {ev.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {/* Verify button */}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleVerifySeal(ev)}
                          title="Verify cryptographic seal & custody chain"
                        >
                          <CheckCircle2 size={12} color="#16a34a" />
                          Verify
                        </button>

                        {/* View Chain */}
                        {onSelectEvidenceForChain && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => onSelectEvidenceForChain(ev.evidenceId)}
                            title="View visual Chain of Custody"
                          >
                            <Eye size={12} />
                            Chain
                          </button>
                        )}

                        {/* Transfer */}
                        {canTransfer && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedEvidence(ev);
                              setShowTransferModal(true);
                            }}
                            title="Transfer custody to another officer"
                          >
                            <ArrowRightLeft size={12} />
                            Transfer
                          </button>
                        )}

                        {/* Toggle Tamper Demo */}
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ background: ev.isTampered ? '#16a34a' : '#dc2626', borderColor: 'transparent' }}
                          onClick={() => handleToggleTamper(ev)}
                          title="Simulate physical/digital tamper for live evaluation"
                        >
                          {ev.isTampered ? 'Fix Seal' : 'Tamper'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Result Modal */}
      {verificationResult && (
        <div className="modal-overlay">
          <div className="modal-dialog modal-sm">
            <div className="modal-header">
              <h3>
                {verificationResult.status === 'VALID' ? (
                  <CheckCircle2 size={18} color="#22c55e" />
                ) : (
                  <AlertTriangle size={18} color="#ef4444" />
                )}
                Seal Verification: {verificationResult.evidenceId}
              </h3>
              <button className="modal-close-btn" onClick={() => setVerificationResult(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <span className={`badge-status ${verificationResult.status === 'VALID' ? 'valid' : 'tampered'}`} style={{ fontSize: '13px', padding: '6px 14px' }}>
                  {verificationResult.status === 'VALID' ? '🟢 VALID — CHAIN OF CUSTODY INTACT' : '🔴 TAMPERED — SEAL BROKEN'}
                </span>
                <p style={{ marginTop: '12px', fontSize: '13px', color: '#334155' }}>
                  {verificationResult.message}
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>
                  <strong>Stored Custody Hash:</strong>
                  <div className="mono-hash" style={{ width: '100%', marginTop: '2px' }}>
                    {verificationResult.storedHash}
                  </div>
                </div>
                <div>
                  <strong>Calculated Seal Hash:</strong>
                  <div className="mono-hash" style={{ width: '100%', marginTop: '2px' }}>
                    {verificationResult.calculatedHash}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setVerificationResult(null)}>
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Evidence Modal */}
      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>
                <Package size={18} />
                Register New Evidence Item
              </h3>
              <button className="modal-close-btn" onClick={() => setShowRegisterModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleRegisterSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Investigation Case *</label>
                  <select
                    className="form-select"
                    required
                    value={newEvidence.caseId}
                    onChange={(e) => setNewEvidence({ ...newEvidence, caseId: e.target.value })}
                  >
                    <option value="">-- Select Linked Case --</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id.toString()}>
                        {c.caseNumber} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Evidence Type *</label>
                  <select
                    className="form-select"
                    value={newEvidence.evidenceType}
                    onChange={(e) => setNewEvidence({ ...newEvidence, evidenceType: e.target.value })}
                  >
                    <option value="DIGITAL_STORAGE">Digital Storage (Hard Disk, Pen Drive, SSD)</option>
                    <option value="MOBILE_DEVICE">Mobile Device (Smartphone, Tablet, SIM)</option>
                    <option value="DOCUMENT">Paper Document / Contract / Letter</option>
                    <option value="BIOLOGICAL_SAMPLE">Biological Sample / DNA Swab</option>
                    <option value="WEAPON">Weapon / Ballistic Material</option>
                    <option value="NARCOTICS">Contraband / Narcotics Sample</option>
                    <option value="OTHER">Other Physical Evidence</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description &amp; Specifications *</label>
                  <textarea
                    className="form-textarea"
                    required
                    placeholder="e.g. SanDisk 1TB NVMe SSD containing encrypted ledger files recovered from suspect's laptop bag..."
                    value={newEvidence.description}
                    onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Seal Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. SEAL-MHA-9821"
                      value={newEvidence.sealNumber}
                      onChange={(e) => setNewEvidence({ ...newEvidence, sealNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Collection Location</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Crime Scene, Flat 402, Bangalore"
                      value={newEvidence.collectionLocation}
                      onChange={(e) => setNewEvidence({ ...newEvidence, collectionLocation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Physical Condition</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newEvidence.condition}
                    onChange={(e) => setNewEvidence({ ...newEvidence, condition: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register &amp; Generate Seal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Custody Modal */}
      {showTransferModal && selectedEvidence && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>
                <ArrowRightLeft size={18} />
                Transfer Custody: {selectedEvidence.evidenceId}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowTransferModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleTransferSubmit}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '12px' }}>
                  <strong>Transferring Item:</strong> {selectedEvidence.description} (Seal: {selectedEvidence.sealNumber})
                  <br />
                  <strong>Current Custodian:</strong> {selectedEvidence.currentCustodian} ({selectedEvidence.currentCustodianRole})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Recipient Officer Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Dr. Priya Nambiar"
                      value={transferData.toUser}
                      onChange={(e) => setTransferData({ ...transferData, toUser: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Recipient Role *</label>
                    <select
                      className="form-select"
                      value={transferData.toRole}
                      onChange={(e) => setTransferData({ ...transferData, toRole: e.target.value })}
                    >
                      <option value="FORENSIC_OFFICER">Forensic Officer (CFSL)</option>
                      <option value="INVESTIGATION_OFFICER">Investigating Officer</option>
                      <option value="COURT_OFFICER">Court Registrar</option>
                      <option value="POLICE_OFFICER">Police Station In-Charge</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Transfer Purpose / Reason *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={transferData.transferReason}
                    onChange={(e) => setTransferData({ ...transferData, transferReason: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Transfer Destination Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={transferData.location}
                    onChange={(e) => setTransferData({ ...transferData, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Condition Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    value={transferData.conditionAfter}
                    onChange={(e) => setTransferData({ ...transferData, conditionAfter: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Sign &amp; Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
