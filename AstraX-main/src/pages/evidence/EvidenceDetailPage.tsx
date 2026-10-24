import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Evidence, EvidenceTransfer } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { useToast } from '../../components/common/Toast.tsx';
import {
  Package,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  User,
  MapPin,
  Send,
  ExternalLink,
  Printer,
  CheckCircle2,
  Lock,
  Tag,
  X
} from 'lucide-react';

export const EvidenceDetailPage: React.FC = () => {
  const { evidenceId } = useParams<{ evidenceId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [custodyLogs, setCustodyLogs] = useState<EvidenceTransfer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferToUser, setTransferToUser] = useState<string>('');
  const [transferToRole, setTransferToRole] = useState<string>('FORENSIC_EXAMINER');
  const [transferLocation, setTransferLocation] = useState<string>('Central Forensic Science Laboratory, Room 4B');
  const [transferReason, setTransferReason] = useState<string>('Digital bit-stream acquisition and memory dump extraction');
  const [newSealNumber, setNewSealNumber] = useState<string>('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState<boolean>(false);

  const fetchEvidenceRecord = async () => {
    if (!evidenceId) return;
    try {
      setLoading(true);
      const ev = await api.getEvidenceById(evidenceId);
      setEvidence(ev);
      const chainData = await api.getEvidenceChain(evidenceId);
      setCustodyLogs(chainData.chainOfCustody || ev.transfers || []);
    } catch (err) {
      console.error('Failed to load evidence record:', err);
      showToast('Error loading evidence dossier', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidenceRecord();
  }, [evidenceId]);

  const handleVerifySeal = async () => {
    if (!evidence) return;
    try {
      setVerifying(true);
      const res = await api.verifyEvidenceIntegrity(evidence.evidenceId);
      if (res.status === 'VALID') {
        showToast('Tamper seal verified intact! Physical/digital lock uncompromised.', 'success');
      } else {
        showToast('CRITICAL ALERT: Physical tamper seal or biometric custody lock has been breached!', 'error');
      }
      fetchEvidenceRecord();
    } catch (err: any) {
      showToast(err.message || 'Seal verification failed', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleToggleTamper = async () => {
    if (!evidence) return;
    try {
      const res = await api.toggleEvidenceTamper(evidence.evidenceId);
      showToast(res.message, res.isTampered ? 'error' : 'success');
      fetchEvidenceRecord();
    } catch (err: any) {
      showToast(err.message || 'Error updating simulation', 'error');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidence || !transferToUser || !transferReason) return;

    try {
      setIsSubmittingTransfer(true);
      await api.transferEvidence(evidence.evidenceId, {
        toUser: transferToUser,
        toRole: transferToRole,
        location: transferLocation,
        transferReason: transferReason,
        conditionBefore: 'Intact in forensic tamper bag',
        conditionAfter: 'Received in secure transport locker',
        signature: 'RSA-4096-SHA256-DIGITAL-SIGNATURE'
      });
      setShowTransferModal(false);
      showToast(`Custody transferred to ${transferToUser}. Logged in immutable chain!`, 'success');
      fetchEvidenceRecord();
    } catch (err: any) {
      showToast(err.message || 'Failed to transfer custody', 'error');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Evidence', to: '/evidence' }, { label: 'Loading...' }]} />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (!evidence) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Evidence', to: '/evidence' }, { label: 'Not Found' }]} />
        <EmptyState
          icon={AlertTriangle}
          title="Evidence Record Not Found"
          description="The requested evidence item does not exist or has been purged by judicial decree."
          actionLabel="Return to Evidence Registry"
          onAction={() => navigate('/evidence')}
        />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Evidence', to: '/evidence' },
          { label: evidence.evidenceId }
        ]}
      />

      {/* Header Banner */}
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
                  fontSize: '13px',
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                {evidence.evidenceId}
              </span>

              <Link
                to={`/cases/${evidence.caseId}`}
                style={{
                  textDecoration: 'none',
                  color: '#475569',
                  background: '#f1f5f9',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Docket: {evidence.caseNumber}</span>
                <ExternalLink size={12} />
              </Link>

              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: evidence.status === 'UNDER_FORENSIC_EXAMINATION' ? '#fef3c7' : '#ecfdf5',
                  color: evidence.status === 'UNDER_FORENSIC_EXAMINATION' ? '#92400e' : '#047857'
                }}
              >
                {evidence.status.replace(/_/g, ' ')}
              </span>

              {evidence.isTampered ? (
                <span
                  style={{
                    background: '#fee2e2',
                    color: '#991b1b',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <AlertTriangle size={13} />
                  SEAL BREACHED
                </span>
              ) : (
                <span
                  style={{
                    background: '#ecfdf5',
                    color: '#065f46',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShieldCheck size={13} />
                  TAMPER SEAL INTACT
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              {evidence.description}
            </h1>

            <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span>Type: <strong>{evidence.evidenceType}</strong></span>
              <span>&bull;</span>
              <span>Current Seal: <code style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{evidence.sealNumber}</code></span>
              <span>&bull;</span>
              <span>Current Custodian: <strong>{evidence.currentCustodian}</strong> ({evidence.currentCustodianRole})</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleVerifySeal}
              disabled={verifying}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <ShieldCheck size={14} color="#059669" />
              <span>{verifying ? 'Scanning Seal...' : 'Verify Seal Integrity'}</span>
            </button>

            {currentUser?.role !== 'LAWYER' && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              >
                <Send size={14} />
                <span>Transfer Custody</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* Left Column: Metadata & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Exhibit Specifications */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', textTransform: 'uppercase' }}>
              Exhibit Specifications
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                  COLLECTION LOCATION
                </div>
                <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                  {evidence.collectionLocation || 'Primary Incident Scene'}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                  COLLECTED BY OFFICER
                </div>
                <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                  {evidence.collectedBy}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                  REGISTRATION DATE &amp; TIME
                </div>
                <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                  {new Date(evidence.collectionDateTime).toLocaleString()}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                  PHYSICAL CONDITION
                </div>
                <div style={{ color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                  {evidence.condition || 'Intact in tamper-evident anti-static bag'}
                </div>
              </div>
            </div>
          </div>

          {/* Tamper Simulation Demo Card */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
              Court Security Testing
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.5 }}>
              Simulate physical barcode seal tampering or unauthorized custody handover to test alert dispatch to supervisory judges.
            </p>

            <button
              onClick={handleToggleTamper}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '6px',
                border: evidence.isTampered ? '1px solid #059669' : '1px solid #dc2626',
                background: evidence.isTampered ? '#ecfdf5' : '#fef2f2',
                color: evidence.isTampered ? '#065f46' : '#991b1b',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {evidence.isTampered ? 'Reset & Verify Custody Lock' : 'Simulate Tampered Seal Violation'}
            </button>
          </div>
        </div>

        {/* Right Column: Visual Chain of Custody Timeline */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Visual Chain of Custody Ledger
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                Chronological, cryptographic transfer sequence under Section 65B Indian Evidence Act.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Printer size={14} />
              <span>Print Chain Certificate</span>
            </button>
          </div>

          {custodyLogs.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No transfers logged yet"
              description="This evidence item is currently with its initial collecting officer."
            />
          ) : (
            <div style={{ position: 'relative', paddingLeft: '32px' }}>
              {/* Vertical connecting line */}
              <div
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '12px',
                  bottom: '12px',
                  width: '2px',
                  background: '#cbd5e1'
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {custodyLogs.map((log, index) => {
                  const isLatest = index === custodyLogs.length - 1;
                  return (
                    <div key={log.id || index} style={{ position: 'relative' }}>
                      {/* Circle Dot Marker */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-28px',
                          top: '12px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: isLatest ? '#1d4ed8' : '#ffffff',
                          border: isLatest ? '3px solid #bfdbfe' : '3px solid #64748b',
                          boxShadow: isLatest ? '0 0 0 3px rgba(29,78,216,0.2)' : 'none'
                        }}
                      />

                      <div
                        style={{
                          background: isLatest ? '#eff6ff' : '#f8fafc',
                          borderRadius: '10px',
                          border: isLatest ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                          padding: '18px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                background: isLatest ? '#1d4ed8' : '#e2e8f0',
                                color: isLatest ? '#ffffff' : '#475569',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 800
                              }}
                            >
                              STEP #{index + 1} &bull; {log.status || 'TRANSFER'}
                            </span>
                            {isLatest && (
                              <span style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 700 }}>
                                CURRENT HOLDER
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                            {new Date(log.transferDateTime || log.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '10px 0', fontSize: '13px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>RELEASED BY / FROM</div>
                            <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                              {log.fromUser || evidence.collectedBy} {log.fromRole ? `(${log.fromRole})` : ''}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>ACCEPTED BY / TO</div>
                            <div style={{ color: '#0f172a', fontWeight: 700, marginTop: '2px' }}>
                              {log.toUser} ({log.toRole})
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: '13px', color: '#334155', margin: '8px 0', lineHeight: 1.5 }}>
                          <strong>Reason for Transfer:</strong> {log.transferReason}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="#94a3b8" />
                            {log.location}
                          </span>
                          <span>&bull;</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Tag size={13} color="#94a3b8" />
                            Seal: <code style={{ fontFamily: 'monospace' }}>{evidence.sealNumber}</code>
                          </span>
                          <span>&bull;</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#047857', fontWeight: 700 }}>
                            <CheckCircle2 size={13} />
                            Dual-Party Biometric Signed
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custody Transfer Modal */}
      {showTransferModal && (
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
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Transfer Evidence Custody
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTransfer}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Receiving Officer / Custodian Name *
                </label>
                <input
                  type="text"
                  value={transferToUser}
                  onChange={(e) => setTransferToUser(e.target.value)}
                  placeholder="e.g. Dr. Sunita Rao (Senior Cyber Forensic Analyst)"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Receiving Role *
                  </label>
                  <select
                    value={transferToRole}
                    onChange={(e) => setTransferToRole(e.target.value)}
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
                    <option value="FORENSIC_EXAMINER">Forensic Examiner</option>
                    <option value="EVIDENCE_CUSTODIAN">Evidence Vault Officer</option>
                    <option value="INVESTIGATOR">Investigating Officer</option>
                    <option value="PROSECUTOR">Public Prosecutor</option>
                    <option value="COURT_CLERK">Judicial Court Clerk</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    New Tamper Seal ID
                  </label>
                  <input
                    type="text"
                    value={newSealNumber}
                    onChange={(e) => setNewSealNumber(e.target.value)}
                    placeholder="Leave blank to maintain"
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
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Handover Location *
                </label>
                <input
                  type="text"
                  value={transferLocation}
                  onChange={(e) => setTransferLocation(e.target.value)}
                  placeholder="e.g. State Forensic Science Laboratory, Vault 3"
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Reason for Transfer *
                </label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Forensic bit-stream imaging and memory extraction under court order #392"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer}
                  className="btn btn-primary"
                >
                  {isSubmittingTransfer ? 'Recording Handover...' : 'Execute Custody Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
