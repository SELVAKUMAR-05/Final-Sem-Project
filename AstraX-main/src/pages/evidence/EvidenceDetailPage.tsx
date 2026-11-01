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

  const handlePrintCertificate = () => {
    const certificate = document.getElementById('chain-certificate');
    const printWindow = window.open('', '_blank');
    if (!certificate || !printWindow) {
      showToast(
        certificate
          ? 'Allow pop-ups for this site to print the chain of custody certificate.'
          : 'The chain of custody certificate could not be prepared.',
        'error'
      );
      return;
    }

    const printDocument = printWindow.document;
    printDocument.open();
    printDocument.write(`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Chain of Custody Certificate</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #1c2b3d; font: 9pt/1.45 "Segoe UI", Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .certificate { width: 100%; }
            .certificate-masthead { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 12px 15px; color: #fff; background: #142d4b; border-bottom: 4px solid #bd9855; }
            .certificate-brand-wrap { display: flex; align-items: center; gap: 11px; }
            .certificate-monogram { display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid #d6bd8b; border-radius: 50%; color: #f3dfb2; font-family: Georgia, serif; font-size: 12pt; font-weight: 700; letter-spacing: -.08em; }
            .certificate-brand { color: #fff; font-size: 13pt; font-weight: 800; letter-spacing: .09em; }
            .certificate-subbrand { margin-top: 3px; color: #d3deea; font-size: 7pt; text-transform: uppercase; letter-spacing: .13em; }
            .certificate-copy { padding: 6px 9px; border: 1px solid #d6bd8b; color: #f3dfb2; font-size: 7pt; font-weight: 700; letter-spacing: .08em; text-align: center; text-transform: uppercase; }
            .certificate-heading { margin: 20px 0 13px; text-align: center; }
            .certificate-eyebrow { color: #9a773b; font-size: 7pt; font-weight: 800; letter-spacing: .22em; text-transform: uppercase; }
            .certificate-title { margin: 4px 0 3px; color: #142d4b; font-family: Georgia, "Times New Roman", serif; font-size: 21pt; font-weight: 700; letter-spacing: .02em; }
            .certificate-subtitle { margin: 0; color: #65758a; font-size: 8pt; }
            .certificate-identity { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 14px; margin: 0 0 10px; padding: 12px 15px; border: 1px solid #c8d3df; border-left: 4px solid #bd9855; background: #f4f7fa; }
            .certificate-identity-id { color: #142d4b; font-family: "Courier New", monospace; font-size: 17pt; font-weight: 700; letter-spacing: .04em; }
            .certificate-identity-case { margin-top: 3px; color: #52647a; font-size: 8pt; }
            .certificate-status { padding: 6px 10px; border: 1px solid #a9c5b7; background: #edf6f1; color: #256246; font-size: 7pt; font-weight: 800; letter-spacing: .06em; text-align: center; text-transform: uppercase; }
            .certificate-meta { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 16px; border: 1px solid #d5dce4; }
            .certificate-meta > div { padding: 6px 9px; }
            .certificate-meta > div + div { border-left: 1px solid #d5dce4; }
            .certificate-label { display: block; margin-bottom: 2px; color: #718096; font-size: 6.5pt; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
            .certificate-value { overflow-wrap: anywhere; color: #24364b; font-size: 8pt; font-weight: 600; }
            .certificate-section { margin: 15px 0; }
            .certificate-section h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 7px; padding-bottom: 6px; border-bottom: 1px solid #d7dee7; color: #183b63; font-size: 8.5pt; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
            .certificate-section h2::before { content: ""; width: 4px; height: 13px; background: #bd9855; }
            .certificate-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 7.5pt; }
            .certificate-table th, .certificate-table td { padding: 6px 7px; border: 1px solid #d5dce4; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
            .certificate-table th { background: #edf2f7; color: #344a63; font-size: 6.5pt; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
            .certificate-table thead th { padding-top: 7px; padding-bottom: 7px; background: #1d3b5d; color: #fff; }
            .certificate-table tbody tr:nth-child(even) td { background: #f8fafc; }
            .certificate-table tr { break-inside: avoid; page-break-inside: avoid; }
            .certificate-note { margin-top: 14px; padding: 9px 11px; border: 1px solid #d9c99f; border-left: 4px solid #bd9855; background: #fbf8f0; color: #4a4b46; font-size: 7.5pt; }
            .certificate-note strong { display: block; margin-bottom: 3px; color: #735a2d; font-size: 7pt; letter-spacing: .08em; text-transform: uppercase; }
            .certificate-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 35px; margin-top: 34px; }
            .certificate-signature-line { height: 23px; border-bottom: 1px solid #8391a1; }
            .certificate-signature { padding-top: 6px; color: #344a63; font-size: 7.5pt; font-weight: 700; }
            .certificate-signature span { display: block; margin-top: 2px; color: #7a8796; font-size: 6.5pt; font-weight: 400; }
            .certificate-footer { margin-top: 17px; padding-top: 7px; border-top: 1px solid #d5dce4; color: #718096; font-size: 6.5pt; text-align: center; letter-spacing: .04em; }
          </style>
        </head>
        <body></body>
      </html>`);
    printDocument.close();
    printDocument.body.appendChild(certificate.cloneNode(true));
    printWindow.addEventListener('afterprint', () => printWindow.close(), { once: true });
    printWindow.focus();
    printWindow.print();
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
      <div style={{ display: 'none' }} aria-hidden="true">
        <article id="chain-certificate" className="certificate">
          <header className="certificate-masthead">
            <div className="certificate-brand-wrap">
              <span className="certificate-monogram">AX</span>
              <div>
              <div className="certificate-brand">ASTRAX EVIDENCE REGISTRY</div>
              <div className="certificate-subbrand">Evidence management &amp; custody record</div>
              </div>
            </div>
            <div className="certificate-copy">Evidence<br />custody record</div>
          </header>

          <div className="certificate-heading">
            <div className="certificate-eyebrow">Official evidence record</div>
            <h1 className="certificate-title">Chain of Custody</h1>
            <p className="certificate-subtitle">Evidence collection particulars &amp; chronological custody register</p>
          </div>

          <section className="certificate-identity" aria-label="Primary evidence identification">
            <div>
              <span className="certificate-label">Evidence exhibit reference</span>
              <div className="certificate-identity-id">{evidence.evidenceId}</div>
              <div className="certificate-identity-case">Case / docket: <strong>{evidence.caseNumber}</strong></div>
            </div>
            <div className="certificate-status">{evidence.status.replace(/_/g, ' ')}</div>
          </section>

          <section className="certificate-meta" aria-label="Certificate details">
            <div><span className="certificate-label">Certificate generated</span><span className="certificate-value">{new Date().toLocaleString()}</span></div>
            <div><span className="certificate-label">Custody entries recorded</span><span className="certificate-value">{custodyLogs.length || 1} {custodyLogs.length === 1 ? 'entry' : 'entries'}</span></div>
          </section>

          <section className="certificate-section">
            <h2>Exhibit identification &amp; collection</h2>
            <table className="certificate-table">
              <tbody>
                <tr>
                  <th scope="row">Description</th>
                  <td>{evidence.description || 'Not recorded'}</td>
                  <th scope="row">Evidence type</th>
                  <td>{evidence.evidenceType}</td>
                </tr>
                <tr>
                  <th scope="row">Collected by</th>
                  <td>{evidence.collectedBy}</td>
                  <th scope="row">Collection date &amp; time</th>
                  <td>{new Date(evidence.collectionDateTime).toLocaleString()}</td>
                </tr>
                <tr>
                  <th scope="row">Collection location</th>
                  <td>{evidence.collectionLocation || 'Not recorded'}</td>
                  <th scope="row">Seal / package reference</th>
                  <td>{evidence.sealNumber || 'Not recorded'}</td>
                </tr>
                <tr>
                  <th scope="row">Condition at registration</th>
                  <td>{evidence.condition || 'Not recorded'}</td>
                  <th scope="row">Seal alert status</th>
                  <td>{evidence.isTampered ? 'Tamper alert recorded' : 'No tamper alert recorded; not independently verified by printing'}</td>
                </tr>
                {evidence.sha256Hash && (
                  <tr>
                    <th scope="row">SHA-256 evidence hash</th>
                    <td colSpan={3} style={{ overflowWrap: 'anywhere', fontFamily: 'monospace' }}>{evidence.sha256Hash}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="certificate-section">
            <h2>Chronological custody register ({custodyLogs.length} recorded {custodyLogs.length === 1 ? 'entry' : 'entries'})</h2>
            <table className="certificate-table">
              <thead>
                <tr>
                  <th scope="col">Step / status</th>
                  <th scope="col">Date &amp; time / location</th>
                  <th scope="col">Released by / from</th>
                  <th scope="col">Received by / to</th>
                  <th scope="col">Purpose, condition &amp; record</th>
                </tr>
              </thead>
              <tbody>
                {custodyLogs.length > 0 ? custodyLogs.map((log, index) => (
                  <tr key={log.id || index}>
                    <td>{index + 1}. {log.status || 'TRANSFER'}</td>
                    <td>{new Date(log.transferDateTime || log.createdAt).toLocaleString()}<br />{log.location || 'Location not recorded'}</td>
                    <td>{log.fromUser || evidence.collectedBy}{log.fromRole ? ` (${log.fromRole})` : ''}</td>
                    <td>{log.toUser}{log.toRole ? ` (${log.toRole})` : ''}</td>
                    <td>
                      <strong>Reason:</strong> {log.transferReason || 'Not recorded'}<br />
                      <strong>Condition before:</strong> {log.conditionBefore || 'Not recorded'}<br />
                      <strong>Condition after:</strong> {log.conditionAfter || 'Not recorded'}<br />
                      <strong>Seal:</strong> {evidence.sealNumber || 'Not recorded'}<br />
                      <strong>Signature reference:</strong> {log.signature || 'Not recorded'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td>1. INITIAL COLLECTION</td>
                    <td>{new Date(evidence.collectionDateTime).toLocaleString()}<br />{evidence.collectionLocation || 'Location not recorded'}</td>
                    <td>Incident scene / recovery</td>
                    <td>{evidence.collectedBy}</td>
                    <td><strong>Condition:</strong> {evidence.condition || 'Not recorded'}<br /><strong>Seal:</strong> {evidence.sealNumber || 'Not recorded'}<br /><strong>Signature reference:</strong> Not recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <p className="certificate-note">
            <strong>Important record notice</strong>
            This document is a system-generated snapshot of the custody information recorded in the AstraX Evidence Registry at the time shown above. It is not, by itself, a digital signature, independent integrity verification, or judicial certification. Verify the source record and any applicable signatures or seal status through the authorized process before relying on this document.
          </p>

          <div className="certificate-signatures">
            <div className="certificate-signature">
              <div className="certificate-signature-line" />
              Prepared / produced by
              <span>Authorized registry user · Name, signature &amp; date</span>
            </div>
            <div className="certificate-signature">
              <div className="certificate-signature-line" />
              Reviewed / received by
              <span>Officer / receiving authority · Name, signature &amp; date</span>
            </div>
          </div>
          <footer className="certificate-footer">Evidence reference: {evidence.evidenceId} &nbsp;|&nbsp; Case: {evidence.caseNumber} &nbsp;|&nbsp; End of record</footer>
        </article>
      </div>
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
              onClick={handlePrintCertificate}
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
