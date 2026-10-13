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
    <div id="ncrb-integrity-lab" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <ShieldCheck size={24} color="#1d4ed8" />
          SHA-256 Cryptographic Integrity &amp; Tamper Detection Lab
        </h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px', marginBottom: 0 }}>
          Section 65B digital evidence verification engine &bull; cryptographic audit trail monitoring
        </p>
      </div>

      <div className="gov-card" style={{ borderRadius: '16px' }}>
        <div className="gov-card-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0f172a' }}>
            <Cpu size={17} color="#1d4ed8" />
            Select evidence document for cryptographic audit
          </span>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            Algorithm: SHA-256 (NIST FIPS 180-4)
          </span>
        </div>

        <div className="gov-card-body" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Select registered document
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => handleSelectDoc(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '13px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.caseNumber}] {d.documentName} ({d.documentType}) - v{d.version}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={runVerification}
            disabled={isVerifying || !selectedDocId}
            className="btn btn-primary"
            style={{ minHeight: '42px', width: '100%' }}
            id="btn-run-verify"
          >
            <RefreshCw size={15} style={{ animation: isVerifying ? 'spin 1s linear infinite' : 'none' }} />
            {isVerifying ? 'Verifying...' : 'Verify Integrity'}
          </button>
        </div>

        {activeDocState && (
          <div style={{ padding: '0 20px 20px' }}>
            <div
              style={{
                background: activeDocState.isTampered ? '#fff1f2' : '#f0fdf4',
                border: `1px solid ${activeDocState.isTampered ? '#fecdd3' : '#bbf7d0'}`,
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: activeDocState.isTampered ? '#b91c1c' : '#15803d',
                    background: activeDocState.isTampered ? '#fee2e2' : '#dcfce7',
                    border: `1px solid ${activeDocState.isTampered ? '#fca5a5' : '#86efac'}`,
                    borderRadius: '999px',
                    padding: '6px 10px'
                  }}
                >
                  <Zap size={14} />
                  {activeDocState.isTampered ? 'Tamper simulation active' : 'System authentic'}
                </span>
                <span style={{ fontSize: '12px', color: '#475569' }}>
                  {activeDocState.isTampered
                    ? '1 unauthorized byte was injected into the storage payload.'
                    : 'No integrity anomalies detected. Storage is secure.'}
                </span>
              </div>

              <button
                onClick={handleToggleTamper}
                disabled={tamperLoading}
                className={activeDocState.isTampered ? 'btn btn-secondary' : 'btn btn-primary'}
                style={{ minHeight: '38px' }}
                id="btn-tamper-toggle"
              >
                {activeDocState.isTampered ? (
                  <>
                    <RotateCcw size={14} /> Restore Original File
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} /> Simulate Tampering
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div
          className="gov-card"
          style={{
            borderRadius: '16px',
            border: `1px solid ${result.integrity === 'VALID' ? '#86efac' : '#fca5a5'}`,
            background: result.integrity === 'VALID' ? '#f0fdf4' : '#fff1f2',
            overflow: 'hidden'
          }}
          id="verification-result-card"
        >
          <div className="gov-card-header" style={{ borderBottom: '1px solid #e2e8f0', background: result.integrity === 'VALID' ? '#f0fdf4' : '#fff1f2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: result.integrity === 'VALID' ? '#dcfce7' : '#fee2e2',
                  color: result.integrity === 'VALID' ? '#15803d' : '#b91c1c'
                }}
              >
                {result.integrity === 'VALID' ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {result.integrity === 'VALID' ? 'Document integrity valid' : 'Critical alert: document tampered'}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  {result.integrity === 'VALID' ? 'Verified against the registered SHA-256 digest.' : result.message}
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: result.integrity === 'VALID' ? '#15803d' : '#b91c1c',
                background: result.integrity === 'VALID' ? '#dcfce7' : '#fee2e2',
                border: `1px solid ${result.integrity === 'VALID' ? '#86efac' : '#fca5a5'}`,
                borderRadius: '999px',
                padding: '6px 10px'
              }}
            >
              {result.integrity === 'VALID' ? 'Verified' : 'Tampered'}
            </span>
          </div>

          <div className="gov-card-body" style={{ background: '#ffffff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Stored cryptographic hash
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px', wordBreak: 'break-all', color: '#0f172a', marginTop: '4px' }}>
                  {result.storedHash}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live disk stream hash
                </span>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12.5px',
                    background: result.integrity === 'VALID' ? '#f0fdf4' : '#fff1f2',
                    border: `1px solid ${result.integrity === 'VALID' ? '#86efac' : '#fca5a5'}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    wordBreak: 'break-all',
                    color: result.integrity === 'VALID' ? '#166534' : '#991b1b',
                    marginTop: '4px',
                    fontWeight: 700
                  }}
                >
                  {result.calculatedHash}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '14px', fontSize: '11px', color: '#475569', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              <span>Verified by: <strong style={{ color: '#0f172a' }}>{result.checkedBy}</strong></span>
              <span>Timestamp: <strong style={{ color: '#0f172a' }}>{new Date(result.checkedAt).toLocaleString()}</strong></span>
              <span>Standard: <strong style={{ color: '#1d4ed8' }}>Section 65B Certified</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
