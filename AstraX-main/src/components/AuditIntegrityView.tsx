import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { AuditLog, AuditVerificationResult } from '../types.ts';
import {
  History,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Play,
  Lock,
  ArrowDown,
  Hash,
  User,
} from 'lucide-react';

export const AuditIntegrityView: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [verification, setVerification] = useState<AuditVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [tamperedSimActive, setTamperedSimActive] = useState(false);

  const loadLogsAndVerify = async () => {
    setLoading(true);
    try {
      const [logsData, verifyData] = await Promise.all([
        api.getAuditLogs({ limit: 50 }),
        api.verifyAuditChain(),
      ]);
      setLogs(logsData);
      setVerification(verifyData);
    } catch (err) {
      console.error('Failed to load audit integrity', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogsAndVerify();
  }, []);

  const handleVerifyChain = async () => {
    try {
      const res = await api.verifyAuditChain();
      setVerification(res);
    } catch (err: any) {
      alert(err.message || 'Chain verification failed');
    }
  };

  const handleToggleTamper = async () => {
    try {
      const res = await api.simulateAuditTamper();
      setTamperedSimActive(res.isTampered);
      await loadLogsAndVerify();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle audit tamper');
    }
  };

  return (
    <div id="audit-integrity-view">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>
            <History size={24} color="#1d4ed8" />
            Tamper-Evident Chained Audit Ledger
          </h1>
          <p>Cryptographic SHA-256 Hash Chain Linking Every Evidentiary Action From Genesis to Head</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadLogsAndVerify}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={handleVerifyChain}>
            <ShieldCheck size={14} />
            Verify Entire Hash Chain
          </button>
          <button
            className="btn btn-danger"
            style={{ background: tamperedSimActive ? '#16a34a' : '#dc2626', borderColor: 'transparent' }}
            onClick={handleToggleTamper}
            title="Simulate an unauthorized SQL edit in database to test cryptographic detection"
          >
            <Play size={14} />
            {tamperedSimActive ? 'Revert Database Edit' : 'Simulate Database Tamper'}
          </button>
        </div>
      </div>

      {/* Verification Status Card */}
      {verification && (
        <div className="gov-card" style={{ marginBottom: '24px' }}>
          <div className="gov-card-header">
            <h2>
              {verification.isValid ? (
                <CheckCircle2 size={18} color="#16a34a" />
              ) : (
                <AlertTriangle size={18} color="#dc2626" />
              )}
              Hash Chain Status: {verification.status}
            </h2>
            <span className={`badge-status ${verification.isValid ? 'valid' : 'tampered'}`}>
              {verification.isValid ? '🟢 ALL BLOCKS INTACT' : '🔴 CHAIN INTEGRITY BROKEN'}
            </span>
          </div>
          <div className="gov-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Verified Blocks</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0b2545', marginTop: '2px' }}>
                  {verification.totalLogs}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Verified At</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0b2545', marginTop: '4px' }}>
                  {new Date(verification.verifiedAt).toLocaleTimeString()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Genesis Hash</span>
                <div className="mono-hash" style={{ marginTop: '4px' }}>
                  0000000000000000000000000000000000000000000000000000000000000000
                </div>
              </div>
            </div>

            {verification.brokenRecordId && (
              <div style={{ marginTop: '16px', background: '#fee2e2', border: '1px solid #fca5a5', padding: '14px', borderRadius: '8px', color: '#991b1b' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} />
                  CRITICAL BREACH LOCATED: Record #{verification.brokenRecordId}
                </strong>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>
                  The stored hash in block #{verification.brokenRecordId} does NOT match the recalculation from preceding block.
                  This proves unauthorized alteration of the audit trail!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Chained Block Ledger */}
      <div className="gov-card">
        <div className="gov-card-header">
          <h3>
            <Hash size={16} color="#1d4ed8" />
            Audit Ledger Blocks (Chronological Head to Genesis)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Each block includes SHA-256(PreviousHash + Action + Timestamp + Details)
          </span>
        </div>
        <div className="gov-card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {logs.map((log, idx) => {
              const isBroken = verification?.brokenRecordId === log.id;
              return (
                <div key={log.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '100%',
                      background: isBroken ? '#fff1f2' : '#ffffff',
                      border: isBroken ? '2px solid #ef4444' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px 20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 800, color: isBroken ? '#dc2626' : '#0b2545', fontFamily: 'var(--font-mono)' }}>
                          BLOCK #{log.id}
                        </span>
                        <span className="badge-pill" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                          {log.action}
                        </span>
                        <span className={`badge-status ${log.status === 'SUCCESS' ? 'valid' : 'tampered'}`} style={{ fontSize: '10px' }}>
                          {log.status === 'SUCCESS' ? '🟢 SUCCESS' : '🔴 FLAGGED'}
                        </span>
                      </div>
                      <span className="timeline-time">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#334155', marginBottom: '10px' }}>
                      <strong>Description:</strong> {log.description}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px', background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                          Previous Hash &larr;
                        </span>
                        <div className="mono-hash" style={{ width: '100%', marginTop: '2px' }}>
                          {log.previousLogHash || 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000'}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: isBroken ? '#dc2626' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                          Current Computed Hash &rarr;
                        </span>
                        <div className="mono-hash" style={{ width: '100%', marginTop: '2px', color: isBroken ? '#dc2626' : '#0f172a' }}>
                          {log.currentLogHash || 'COMPUTED_HASH_PENDING'}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '8px', display: 'flex', gap: '16px', fontSize: '11px', color: '#64748b' }}>
                      <span>Officer: <strong>{log.username}</strong> ({log.role})</span>
                      <span>IP: <strong>{log.ipAddress}</strong></span>
                      {log.caseNumber && <span>Case: <strong>{log.caseNumber}</strong></span>}
                    </div>
                  </div>

                  {idx < logs.length - 1 && (
                    <div style={{ padding: '6px 0', color: '#94a3b8' }}>
                      <ArrowDown size={18} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
