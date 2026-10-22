import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { DigitalSignature, LegalDocument } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from './common/Toast.tsx';
import {
  PenTool,
  ShieldCheck,
  CheckCircle,
  User,
  Lock,
  Stamp,
  ShieldAlert,
} from 'lucide-react';

function formatSignatureTimestamp(timestamp: string | undefined): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
}

export const DigitalSignatureView: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingId, setSigningId] = useState<number | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const canSignDocuments = currentUser?.role !== 'LAWYER';

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
      const signedAt = formatSignatureTimestamp(res.signature.signedAt);
      setSuccessNotice(
        `Document signed by ${res.signature.signedBy}${signedAt ? ` on ${signedAt}` : ''}. Certificate: ${res.signature.certificateIssuer}.`
      );
      await fetchDocs();
    } catch (err: any) {
      const message = err.status === 403
        ? `Your ${currentUser?.role ?? 'current'} role is not authorized to apply digital signatures. Ask an authorized officer to sign this document.`
        : err.message || 'Unable to apply the digital signature. Please try again.';
      showToast(message, 'error');
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

      {!canSignDocuments && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '18px',
            padding: '16px 18px',
            borderRadius: '12px',
            border: '1px solid #fed7aa',
            background: 'linear-gradient(135deg, #fff7ed, #fff)',
            boxShadow: '0 8px 20px rgba(154, 52, 18, 0.08)',
            color: '#7c2d12',
          }}
        >
          <div style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, flexShrink: 0, borderRadius: '10px', background: '#ffedd5' }}>
            <ShieldAlert size={21} color="#c2410c" />
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Signature authority required</strong>
            <span style={{ fontSize: '13px', lineHeight: 1.5 }}>
              The {currentUser?.role} role can review documents but cannot apply PKI signatures. Please ask an authorized officer to sign.
            </span>
          </div>
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
            {documents.map((doc) => {
              const signedSignatures = [...(doc.signatures || [])]
                .filter((signature) => signature.status === 'SIGNED')
                .sort((first, second) => second.signedAt.localeCompare(first.signedAt));
              const latestSignature: DigitalSignature | undefined = signedSignatures[0];
              const signedTimestamp = formatSignatureTimestamp(latestSignature?.signedAt);

              return (
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
                  <span className={`badge-status ${latestSignature ? 'success' : 'warning'}`}>
                    {latestSignature ? 'DIGITALLY SIGNED' : 'PENDING SIGNATURE'}
                  </span>
                </td>

                <td>
                  {latestSignature ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                      <User size={14} color="#2563eb" />
                      {latestSignature.signedBy}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--gov-text-muted)', fontSize: '12px' }}>Awaiting Officer</span>
                  )}
                </td>

                <td>
                  {latestSignature ? (
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ fontWeight: 600, color: '#059669' }}>Digital signature</span>
                      <div style={{ fontSize: '10.5px', color: 'var(--gov-text-muted)' }}>
                        {latestSignature.certificateIssuer}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--gov-text-muted)', fontSize: '12px' }}>N/A</span>
                  )}
                </td>

                <td>
                  {signedTimestamp ? (
                    <span style={{ fontSize: '12px' }}>{signedTimestamp}</span>
                  ) : (
                    <span style={{ color: 'var(--gov-text-muted)', fontSize: '12px' }}>
                      {doc.signed ? 'Timestamp unavailable' : 'Pending signature'}
                    </span>
                  )}
                </td>

                <td style={{ textAlign: 'right' }}>
                  {latestSignature ? (
                    <button className="btn-gov btn-gov-outline btn-gov-sm" style={{ color: '#059669', borderColor: '#a7f3d0' }} disabled>
                      <CheckCircle size={13} /> Verified
                    </button>
                  ) : (
                    <button
                      className={`btn-gov ${canSignDocuments ? 'btn-gov-blue' : 'btn-gov-outline'} btn-gov-sm`}
                      onClick={() => handleSign(doc.id)}
                      disabled={!canSignDocuments || signingId === doc.id}
                      title={!canSignDocuments ? 'An authorized officer must apply this signature' : undefined}
                    >
                      {canSignDocuments ? <PenTool size={13} /> : <Lock size={13} />}
                      {!canSignDocuments
                        ? 'Officer signature required'
                        : signingId === doc.id
                          ? 'Signing...'
                          : 'Affix Signature'}
                    </button>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
