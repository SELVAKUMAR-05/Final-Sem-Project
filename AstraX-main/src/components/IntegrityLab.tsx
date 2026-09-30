import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { LegalDocument, IntegrityCheckResult } from '../types.ts';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Lock,
  Cpu,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface IntegrityLabProps {
  initialDocument?: LegalDocument | null;
}

export const IntegrityLab: React.FC<IntegrityLabProps> = ({ initialDocument }) => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | ''>(initialDocument?.id || '');
  const [result, setResult] = useState<IntegrityCheckResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [tamperLoading, setTamperLoading] = useState<boolean>(false);
  const [activeDocState, setActiveDocState] = useState<LegalDocument | null>(initialDocument || null);

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
      if (!selectedDocId && docs.length > 0) {
        setSelectedDocId(docs[0].id);
        setActiveDocState(docs[0]);
      } else if (selectedDocId) {
        const found = docs.find((d) => d.id === selectedDocId);
        if (found) setActiveDocState(found);
      }
    } catch (e) {
      console.error('Failed to load documents in IntegrityLab', e);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSelectDoc = (id: number) => {
    setSelectedDocId(id);
    const found = documents.find((d) => d.id === id);
    setActiveDocState(found || null);
    setResult(null);
  };

  const runVerification = async () => {
    if (!selectedDocId) return;
    try {
      setIsVerifying(true);
      const res = await api.verifyDocumentIntegrity(Number(selectedDocId));
      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Verification error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleTamper = async () => {
    if (!selectedDocId) return;
    try {
      setTamperLoading(true);
      const res = await api.toggleTamperSimulation(Number(selectedDocId));
      setActiveDocState(res.document);
      await loadDocuments();
      // Re-run verification to immediately update result
      const check = await api.verifyDocumentIntegrity(Number(selectedDocId));
      setResult(check);
    } catch (err: any) {
      alert(err.message || 'Tamper toggle error');
    } finally {
      setTamperLoading(false);
    }
  };

  return (
    <div className="integrity-lab-view" id="ncrb-integrity-lab">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gov-navy-950)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={26} color="var(--gov-blue-600)" />
          SHA-256 Cryptographic Integrity &amp; Tamper Detection Lab
        </h2>
        <p style={{ color: 'var(--gov-text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
          Section 65B Digital Evidence Verification Engine &bull; Nonce-Proof Bitstream Audit (DEMO 7 &amp; Hackathon Suite)
        </p>
      </div>

      {/* Control Card */}
      <div className="gov-card">
        <div className="gov-card-header">
          <span className="gov-card-title">
            <Cpu size={18} /> Select Evidence Document for Cryptographic Audit
          </span>
          <span style={{ fontSize: '12px', color: 'var(--gov-text-muted)' }}>
            Algorithm: SHA-256 (NIST FIPS 180-4)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select Registered Document:</label>
            <select
              className="form-select"
              value={selectedDocId}
              onChange={(e) => handleSelectDoc(Number(e.target.value))}
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.caseNumber}] {d.documentName} ({d.documentType}) - v{d.version}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-gov btn-gov-blue"
              onClick={runVerification}
              disabled={isVerifying || !selectedDocId}
              style={{ flex: 1 }}
              id="btn-run-verify"
            >
              <RefreshCw size={15} style={{ animation: isVerifying ? 'spin 1s linear infinite' : 'none' }} />
              {isVerifying ? 'Verifying Disk Bits...' : 'Verify Integrity (DEMO 7)'}
            </button>
          </div>
        </div>

        {/* Hackathon Simulation Lab Box */}
        {activeDocState && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              background: activeDocState.isTampered ? '#1a0404' : '#041604',
              border: `2px solid ${activeDocState.isTampered ? '#ef4444' : '#00ff00'}`,
              boxShadow: `4px 4px 0px ${activeDocState.isTampered ? '#ef4444' : '#00ff00'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: '13px', color: activeDocState.isTampered ? '#ef4444' : '#00ff00', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Zap size={16} />
                  HACKATHON DEMO LAB // TAMPER SIMULATION ENGINE
                </div>
                <p style={{ fontSize: '12px', color: '#ffffff', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  {activeDocState.isTampered
                    ? 'STATUS: DISK TAMPERED. 1 unauthorized byte injected into storage payload.'
                    : 'STATUS: AUTHENTIC. Pristine cryptographic integrity maintained.'}
                </p>
              </div>

              <button
                className={`btn-gov ${activeDocState.isTampered ? 'btn-gov-success' : 'btn-gov-danger'} btn-gov-sm`}
                onClick={handleToggleTamper}
                disabled={tamperLoading}
                id="btn-tamper-toggle"
              >
                {activeDocState.isTampered ? (
                  <>
                    <RotateCcw size={14} /> Restore Original Physical File
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} /> Simulate Malicious Disk Tampering
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verification Result Display (GREEN vs RED) */}
      {result && (
        <div
          className="gov-card"
          style={{
            border: `2px solid ${result.integrity === 'VALID' ? '#00ff00' : '#ef4444'}`,
            boxShadow: `6px 6px 0px ${result.integrity === 'VALID' ? '#00ff00' : '#ef4444'}`,
            background: result.integrity === 'VALID' ? '#041604' : '#1a0404',
          }}
          id="verification-result-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
            {result.integrity === 'VALID' ? (
              <div style={{ width: '48px', height: '48px', background: '#00ff00', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ffffff' }}>
                <CheckCircle2 size={28} color="#000000" />
              </div>
            ) : (
              <div style={{ width: '48px', height: '48px', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ffffff' }}>
                <ShieldAlert size={28} color="#000000" />
              </div>
            )}

            <div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  color: result.integrity === 'VALID' ? '#00ff00' : '#ef4444',
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                }}
              >
                {result.integrity === 'VALID'
                  ? 'DOCUMENT INTEGRITY: VALID [VERIFIED GREEN]'
                  : 'CRITICAL ALERT: DOCUMENT TAMPERED / HASH MISMATCH [RED]'}
              </div>
              <p style={{ fontSize: '13px', color: '#ffffff', marginTop: '2px' }}>
                {result.message}
              </p>
            </div>
          </div>

          {/* Detailed Hash Comparison Table */}
          <div style={{ background: '#000000', border: '2px solid #ffffff', padding: '16px', marginBottom: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#a3a3a3', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  1. Stored Cryptographic Hash (Recorded at Ingress):
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', background: '#111111', padding: '10px 12px', border: '1px solid #ffffff', wordBreak: 'break-all', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                  {result.storedHash}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#a3a3a3', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  2. Live Disk Stream Hash (Calculated Just Now from Storage):
                </span>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12.5px',
                    background: '#111111',
                    padding: '10px 12px',
                    border: `2px solid ${result.integrity === 'VALID' ? '#00ff00' : '#ef4444'}`,
                    wordBreak: 'break-all',
                    fontWeight: 900,
                    color: result.integrity === 'VALID' ? '#00ff00' : '#ef4444',
                    marginTop: '4px',
                  }}
                >
                  {result.calculatedHash}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a3a3a3', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
            <span>Verified By: <strong style={{ color: '#ffffff' }}>{result.checkedBy}</strong></span>
            <span>Timestamp: <strong style={{ color: '#ffffff' }}>{new Date(result.checkedAt).toLocaleString()}</strong></span>
            <span>Standard: <strong style={{ color: '#00ff00' }}>Section 65B Certified</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
