import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { LegalDocument } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  PenTool,
  ShieldCheck,
  Award,
  CheckCircle,
  FileText,
  User,
  Calendar,
  Lock,
  Stamp,
} from 'lucide-react';

export const DigitalSignatureView: React.FC = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingId, setSigningId] = useState<number | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleSign = async (docId: number) => {
    try {
      setSigningId(docId);
      const res = await api.signDocument(docId);
      setSuccessNotice(`Document successfully signed using ${res.signature.algorithm} and registered with Certificate: ${res.signature.certificateInfo}`);
      await fetchDocs();
    } catch (err: any) {
      alert(err.message || 'Signing failed');
    } finally {
      setSigningId(null);
    }
  };

  return (
    <div className="digital-signatures-view" id="ncrb-signatures-view">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gov-navy-950)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Stamp size={26} color="var(--gov-blue-600)" />
          Digital Signatures &amp; PKI Attestation Station
        </h2>
        <p style={{ color: 'var(--gov-text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
          Public Key Infrastructure (PKI) &bull; Ed25519 &amp; RSA Asymmetric Signatures &bull; Controller of Certifying Authorities (CCA)
        </p>
      </div>

      {successNotice && (
        <div className="gov-alert success">
          <CheckCircle size={18} />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Info Card */}
      <div className="gov-card" style={{ background: '#f8fafc', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <ShieldCheck size={28} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gov-navy-950)' }}>
              Legal Validity of Digital Signatures under Information Technology Act, 2000
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--gov-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              Under Section 3 &amp; 3A of the IT Act, 2000, digital signatures generated using an asymmetric cryptosystem and hash function establish non-repudiation and proof of authenticity in court proceedings.
            </p>
          </div>
        </div>
      </div>

      {/* Document Signatures Table */}
      <div className="gov-table-wrap">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Case Number</th>
              <th>Signature Status</th>
              <th>Signing Authority</th>
              <th>Algorithm &amp; Certificate</th>
              <th>Timestamp</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--gov-navy-950)' }}>
                    {doc.documentName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>
                    {doc.documentType} &bull; v{doc.version}
                  </div>
                </td>

                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {doc.caseNumber}
                </td>

                <td>
                  <span className={`badge-status ${doc.signed ? 'success' : 'warning'}`}>
                    {doc.signed ? 'DIGITALLY SIGNED' : 'PENDING SIGNATURE'}
                  </span>
                </td>

                <td>
                  {doc.signedBy ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                      <User size={14} color="#2563eb" />
                      {doc.signedBy}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--gov-text-muted)', fontSize: '12px' }}>Awaiting Officer</span>
                  )}
                </td>

                <td>
                  {doc.signed ? (
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ fontWeight: 600, color: '#059669' }}>Ed25519-SHA512</span>
                      <div style={{ fontSize: '10.5px', color: 'var(--gov-text-muted)' }}>
                        NCRB-NIC-CA-2026-ROOT
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--gov-text-muted)', fontSize: '12px' }}>N/A</span>
                  )}
                </td>

                <td>
                  {doc.signedAt ? (
                    <span style={{ fontSize: '12px' }}>{new Date(doc.signedAt).toLocaleString()}</span>
                  ) : (
                    <span style={{ color: 'var(--gov-text-muted)', fontSize: '12px' }}>-</span>
                  )}
                </td>

                <td style={{ textAlign: 'right' }}>
                  {doc.signed ? (
                    <button className="btn-gov btn-gov-outline btn-gov-sm" style={{ color: '#059669', borderColor: '#a7f3d0' }} disabled>
                      <CheckCircle size={13} /> Verified
                    </button>
                  ) : (
                    <button
                      className="btn-gov btn-gov-blue btn-gov-sm"
                      onClick={() => handleSign(doc.id)}
                      disabled={signingId === doc.id}
                    >
                      <PenTool size={13} /> {signingId === doc.id ? 'Signing...' : 'Affix Signature'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
