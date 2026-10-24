import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Evidence, EvidenceTransfer } from '../types.ts';
import {
  Link,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  MapPin,
  Clock,
  FileCheck,
  RefreshCw,
  Plus,
} from 'lucide-react';

interface EvidenceChainViewProps {
  initialEvidenceId?: string;
}

export const EvidenceChainView: React.FC<EvidenceChainViewProps> = ({ initialEvidenceId }) => {
  const { currentUser } = useAuth();
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>(initialEvidenceId || '');
  const [chainData, setChainData] = useState<{
    evidence: Evidence;
    chainOfCustody: EvidenceTransfer[];
    totalTransfers: number;
    currentCustodian: string;
    currentCustodianRole: string;
    status: string;
  } | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load all evidence for dropdown
  useEffect(() => {
    api.getEvidence().then((list) => {
      setEvidenceList(list);
      if (!selectedEvidenceId && list.length > 0) {
        setSelectedEvidenceId(list[0].evidenceId);
      }
    });
  }, []);

  const loadChain = async (evId: string) => {
    if (!evId) return;
    setLoading(true);
    try {
      const data = await api.getEvidenceChain(evId);
      setChainData(data);
      // Automatically run verification
      const verify = await api.verifyEvidenceIntegrity(evId);
      setVerificationResult(verify);
    } catch (err) {
      console.error('Failed to load chain data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEvidenceId) {
      loadChain(selectedEvidenceId);
    }
  }, [selectedEvidenceId]);

  const handleVerify = async () => {
    if (!selectedEvidenceId) return;
    try {
      const res = await api.verifyEvidenceIntegrity(selectedEvidenceId);
      setVerificationResult(res);
      loadChain(selectedEvidenceId);
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  const handleToggleTamper = async () => {
    if (!selectedEvidenceId) return;
    try {
      await api.toggleEvidenceTamper(selectedEvidenceId);
      loadChain(selectedEvidenceId);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle tamper');
    }
  };

  return (
    <div id="evidence-chain-view">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>
            <Link size={24} color="#1d4ed8" />
            Evidence Chain of Custody Ledger
          </h1>
          <p>Unbroken Cryptographic Custodial Handoff Tracking &amp; Forensic Admissibility</p>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Select Item:</span>
            <select
              className="form-select"
              style={{ width: '280px' }}
              value={selectedEvidenceId}
              onChange={(e) => setSelectedEvidenceId(e.target.value)}
            >
              {evidenceList.map((e) => (
                <option key={e.evidenceId} value={e.evidenceId}>
                  {e.evidenceId} - {e.description.substring(0, 30)}...
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => loadChain(selectedEvidenceId)}>
            <RefreshCw size={14} />
            Reload
          </button>
        </div>
      </div>

      {chainData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Item Summary Card */}
          <div className="gov-card">
            <div className="gov-card-header">
              <h2>
                <ShieldCheck size={18} color="#1d4ed8" />
                Custodial Dossier: {chainData.evidence.evidenceId}
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {chainData.evidence.isTampered ? (
                  <span className="badge-status tampered">🔴 TAMPERED</span>
                ) : (
                  <span className="badge-status valid">🟢 VALID SEAL</span>
                )}
                <span className="badge-status encrypted">
                  🔵 {chainData.evidence.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <div className="gov-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Description</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0b2545', marginTop: '2px' }}>
                    {chainData.evidence.description}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Seal Number</span>
                  <div className="mono-hash" style={{ marginTop: '2px' }}>
                    {chainData.evidence.sealNumber}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Current Custodian</span>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0b2545', marginTop: '2px' }}>
                    {chainData.currentCustodian}
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    ({chainData.currentCustodianRole.replace('_', ' ')})
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Case Association</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0b2545', marginTop: '2px' }}>
                    {chainData.evidence.caseNumber}
                  </div>
                </div>
              </div>

              {/* Action bar for Chain */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleVerify}>
                    <CheckCircle2 size={14} />
                    Verify Entire Chain Integrity
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ background: chainData.evidence.isTampered ? '#16a34a' : '#dc2626', borderColor: 'transparent' }}
                    onClick={handleToggleTamper}
                  >
                    {chainData.evidence.isTampered ? 'Restore Untampered State' : 'Simulate Broken Custody Seal'}
                  </button>
                </div>
                {verificationResult && (
                  <span className={`badge-status ${verificationResult.status === 'VALID' ? 'valid' : 'tampered'}`}>
                    {verificationResult.status === 'VALID'
                      ? '🟢 HASH CHAIN VERIFIED — ZERO ANOMALIES'
                      : '🔴 BREACH DETECTED — SEAL MISMATCH'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Visual Step-by-Step Chain Timeline */}
          <div className="gov-card">
            <div className="gov-card-header">
              <h3>
                <Link size={16} color="#1d4ed8" />
                Custodial Transfers ({chainData.chainOfCustody.length} Steps Recorded)
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                All handoffs cryptographically recorded with dual signatures
              </span>
            </div>
            <div className="gov-card-body">
              <div className="timeline-container">
                {/* Initial Collection Node */}
                <div className="timeline-event-item">
                  <div className="timeline-node-icon" style={{ background: '#dcfce7', borderColor: '#16a34a', color: '#16a34a' }}>
                    1
                  </div>
                  <div className="timeline-event-card">
                    <div className="timeline-header">
                      <h4>Initial Evidence Seizure &amp; Tamper Seal Applied</h4>
                      <span className="timeline-time">
                        {new Date(chainData.evidence.collectionDateTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="timeline-actor">
                      <User size={13} />
                      Collected by: {chainData.evidence.collectedBy}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      <MapPin size={13} />
                      Location: {chainData.evidence.collectionLocation}
                    </div>
                    <div className="timeline-desc">
                      Enclosed in tamper-evident container and tagged with Seal #{chainData.evidence.sealNumber}.
                      Physical condition: {chainData.evidence.condition}.
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="badge-status valid" style={{ fontSize: '10px' }}>🟢 SEAL INTACT</span>
                      <span className="mono-hash">SEAL: {chainData.evidence.sealNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Subsequent Transfer Nodes */}
                {chainData.chainOfCustody.map((t, idx) => (
                  <div key={t.id} className="timeline-event-item">
                    <div className="timeline-node-icon">
                      {idx + 2}
                    </div>
                    <div className="timeline-event-card">
                      <div className="timeline-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ color: '#0b2545' }}>Custodial Transfer Handoff</h4>
                          <span className="badge-pill" style={{ fontSize: '10px', background: '#eff6ff', color: '#1d4ed8' }}>
                            Transfer #{t.id}
                          </span>
                        </div>
                        <span className="timeline-time">
                          {new Date(t.transferDateTime).toLocaleString()}
                        </span>
                      </div>

                      {/* From -> To Bar */}
                      <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', margin: '8px 0', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #e2e8f0' }}>
                        <div>
                          <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Relinquished By:</span>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0b2545' }}>{t.fromUser}</div>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{t.fromRole.replace('_', ' ')}</span>
                        </div>
                        <ArrowRight size={16} color="#1d4ed8" />
                        <div>
                          <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Transferred To:</span>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0b2545' }}>{t.toUser}</div>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{t.toRole.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '8px 0', fontSize: '12px' }}>
                        <div>
                          <strong>Reason:</strong> {t.transferReason}
                        </div>
                        <div>
                          <strong>Location:</strong> {t.location}
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        <strong>Condition Post-Handoff:</strong> {t.conditionAfter}
                      </div>

                      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge-status signed" style={{ fontSize: '10px' }}>🟣 SIGNED</span>
                          <span className="mono-hash">{t.signature}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Transfer Status: {t.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
