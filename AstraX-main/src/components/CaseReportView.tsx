import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Case } from '../types.ts';
import {
  FileCheck,
  Printer,
  Download,
  ShieldCheck,
  RefreshCw,
  Scale,
  Calendar,
  Package,
  Link,
  PenTool,
  History,
  FileText,
} from 'lucide-react';

export const CaseReportView: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number>(1);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCases().then((list) => {
      setCases(list);
      if (list.length > 0) setSelectedCaseId(list[0].id);
    });
  }, []);

  const loadReport = async (caseId: number) => {
    if (!caseId) return;
    setLoading(true);
    try {
      const data = await api.getCaseReport(caseId);
      setReportData(data);
    } catch (err) {
      console.error('Failed to load case report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCaseId) loadReport(selectedCaseId);
  }, [selectedCaseId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="case-report-view">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div className="page-title">
          <h1>
            <FileCheck size={24} color="#1d4ed8" />
            11-Section Comprehensive Legal Case Report
          </h1>
          <p>Official Judicial Evidentiary Dossier Formatted for Indian Court Submission</p>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Case:</span>
            <select
              className="form-select"
              style={{ width: '260px' }}
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(parseInt(e.target.value, 10))}
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} - {c.title.substring(0, 24)}...
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => loadReport(selectedCaseId)}>
            <RefreshCw size={14} />
            Regenerate
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={15} />
            Print / Export Legal Dossier
          </button>
        </div>
      </div>

      {/* Dossier Document Container */}
      {reportData && (
        <div
          className="gov-card"
          style={{
            background: '#ffffff',
            padding: '40px',
            borderRadius: '8px',
            border: '2px solid #cbd5e1',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          {/* Dossier Official Masthead */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0b2545', paddingBottom: '20px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0b2545', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Scale size={24} color="#ffffff" />
              </div>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0b2545', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              NATIONAL CRIME RECORDS BUREAU &bull; MINISTRY OF HOME AFFAIRS
            </h2>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1d4ed8', marginTop: '4px' }}>
              JUDICIAL CASE DOSSIER &amp; CERTIFIED EVIDENCE REPORT
            </h3>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              CERTIFICATE UNDER SECTION 65B(4) OF THE INDIAN EVIDENCE ACT, 1872 &bull; GENERATED: {new Date(reportData.generatedAt).toLocaleString()}
            </p>
          </div>

          {/* Section 1: Case Information */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0b2545', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
              SECTION 1: CASE INFORMATION &amp; JURISDICTION
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '12px' }}>
              <div><strong>Case Number:</strong> {reportData.section1_caseInformation.caseNumber}</div>
              <div><strong>Title:</strong> {reportData.section1_caseInformation.title}</div>
              <div><strong>Crime Type:</strong> {reportData.section1_caseInformation.crimeType}</div>
              <div><strong>Jurisdiction:</strong> {reportData.section1_caseInformation.jurisdiction}</div>
              <div><strong>Lead Officer:</strong> {reportData.section1_caseInformation.leadOfficer}</div>
              <div><strong>Status:</strong> {reportData.section1_caseInformation.status}</div>
              <div><strong>Priority:</strong> {reportData.section1_caseInformation.priority}</div>
              <div><strong>Department:</strong> {reportData.section1_caseInformation.department}</div>
              <div><strong>Registered:</strong> {new Date(reportData.section1_caseInformation.registeredDate).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Section 2: Summary & Legal Statutes */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0b2545', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
              SECTION 2: CASE SUMMARY &amp; APPLICABLE STATUTES
            </h4>
            <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, marginBottom: '8px' }}>
              {reportData.section2_summary.description}
            </p>
            {reportData.section2_summary.aiExecutiveSummary && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#1e3a8a', marginBottom: '8px' }}>
                <strong>AI Executive Summary:</strong> {reportData.section2_summary.aiExecutiveSummary}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0b2545' }}>Statutes Invoked:</span>
              {(reportData.section2_summary.legalStatutes || []).map((s: string) => (
                <span key={s} className="badge-pill" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                  {s}
                </span>
              ))}
            </div>
            {reportData.section2_summary.disclaimer && (
              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px' }}>{reportData.section2_summary.disclaimer}</p>
            )}
          </div>

          {/* Section 3: Timeline */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0b2545', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
              SECTION 3: INVESTIGATION TIMELINE &amp; CHRONOLOGY ({reportData.section3_timeline.length} Events)
            </h4>
            <div className="gov-table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event</th>
                    <th>Officer</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.section3_timeline.map((ev: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{new Date(ev.timestamp).toLocaleDateString()}</td>
                      <td><strong>{ev.event}</strong></td>
                      <td>{ev.actor}</td>
                      <td>{ev.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Evidence Catalog */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0b2545', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
              SECTION 4: EVIDENCE CATALOG &amp; PHYSICAL SEALS ({reportData.section4_evidence.length} Items)
            </h4>
            <div className="gov-table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Evidence ID</th>
                    <th>Type</th>
                    <th>Seal #</th>
                    <th>Current Custodian</th>
                    <th>Location</th>
                    <th>Integrity</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.section4_evidence.map((ev: any) => (
                    <tr key={ev.evidenceId}>
                      <td><span className="mono-hash">{ev.evidenceId}</span></td>
                      <td>{ev.type}</td>
                      <td>{ev.sealNumber}</td>
                      <td>{ev.custodian}</td>
                      <td>{ev.location}</td>
                      <td>
                        <span className={`badge-status ${ev.integrity === 'VALID' ? 'valid' : 'tampered'}`} style={{ fontSize: '10px' }}>
                          {ev.integrity === 'VALID' ? '🟢 VALID' : `🔴 ${ev.integrity || ev.status}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Chain of Custody */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0b2545', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
              SECTION 5: CHAIN OF CUSTODY HISTORY ({reportData.section5_chainOfCustody.length} Recorded Transfers)
            </h4>
            <div className="gov-table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Evidence ID</th>
                    <th>From Officer</th>
                    <th>To Officer</th>
                    <th>Timestamp</th>
                    <th>Reason</th>
                    <th>Condition</th>
                    <th>Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.section5_chainOfCustody.map((t: any, idx: number) => (
                    <tr key={idx}>
                      <td>{t.evidenceId}</td>
                      <td>{t.from}</td>
                      <td>{t.to}</td>
                      <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{new Date(t.timestamp).toLocaleString()}</td>
                      <td>{t.reason}</td>
                      <td>{t.condition}</td>
                      <td><span className="mono-hash">{t.signatureVerification}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 6: Witness Statements */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0b2545', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
              SECTION 6: WITNESS STATEMENTS &amp; DEPOSITIONS
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reportData.section6_witnesses.map((w: any, idx: number) => (
                <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                  <strong>Deposition #{idx + 1}: {w.witnessName}</strong>
                  <div style={{ color: '#64748b', fontSize: '11px', margin: '2px 0' }}>
                    Recorded by: {w.recordedBy} &bull; Under: {w.depositionUnder}
                  </div>
                  <p style={{ color: '#334155' }}>{w.keyObservation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: Forensic Findings */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0b2545', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
              SECTION 7: FORENSIC FINDINGS &amp; CFSL REPORTS
            </h4>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '6px', fontSize: '12px', color: '#166534' }}>
              <strong>Laboratory:</strong> {reportData.section7_forensicFindings.laboratory}
              <br />
              <strong>Examiner:</strong> {reportData.section7_forensicFindings.examiner}
              <br />
              <strong>Key Conclusions:</strong> {reportData.section7_forensicFindings.keyConclusions}
              <br />
              <strong>Hash Certificates:</strong> <span className="mono-hash">{reportData.section7_forensicFindings.hashCertificates}</span>
            </div>
          </div>

          {/* Section 8: Documents Catalog */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0b2545', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
              SECTION 8: LEGAL DOCUMENTS CATALOG ({reportData.section8_documents.length} Documents)
            </h4>
            <div className="gov-table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Classification</th>
                    <th>Workflow Status</th>
                    <th>Version</th>
                    <th>Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.section8_documents.map((d: any, idx: number) => (
                    <tr key={idx}>
                      <td><strong>{d.documentName}</strong></td>
                      <td>{d.type}</td>
                      <td>{d.classification}</td>
                      <td>{d.workflowStatus}</td>
                      <td>{d.version}</td>
                      <td><span className="mono-hash">{d.hash}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 9: Digital Signatures */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0b2545', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
              SECTION 9: DIGITAL SIGNATURES &amp; PKI VERIFICATION
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reportData.section9_signatures.map((sig: any, idx: number) => (
                <div key={idx} style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '12px', borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Signed By: {sig.signer} ({sig.role})</strong>
                    <span className="badge-status signed" style={{ fontSize: '10px' }}>🟣 PKI SIGNED</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                    Issuer: {sig.issuer} &bull; Timestamp: {new Date(sig.signedAt).toLocaleString()} &bull; Status: {sig.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 10: Cryptographic Verification */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0b2545', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
              SECTION 10: CRYPTOGRAPHIC SHA-256 INTEGRITY VERIFICATION
            </h4>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong>Overall Integrity Status:</strong>
                <span className={`badge-status ${reportData.section10_integrityVerification.overallIntegrity === 'VALID' ? 'valid' : 'tampered'}`}>
                  {reportData.section10_integrityVerification.overallIntegrity}
                </span>
              </div>
              <div>Algorithm: {reportData.section10_integrityVerification.algorithm}</div>
              <div>Evidence Items Checked: {reportData.section10_integrityVerification.evidenceCheckedCount}</div>
              <div>Documents Checked: {reportData.section10_integrityVerification.documentsCheckedCount}</div>
              <div>Compliance Standard: {reportData.section10_integrityVerification.complianceStandard}</div>
            </div>
          </div>

          {/* Section 11: Tamper-Evident Audit Summary */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0b2545', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
              SECTION 11: AUDIT TRAIL SUMMARY &amp; FINAL ATTESTATION
            </h4>
            <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
              This dossier is backed by <strong>{reportData.section11_auditSummary.totalAuditBlocks}</strong> linked audit trail blocks verified under SHA-256 cryptographic chain.
              Chain Status: <strong>{reportData.section11_auditSummary.chainStatus}</strong>.
              Head Hash: <span className="mono-hash">{reportData.section11_auditSummary.headHash}</span>.
              Lead Auditor: <strong>{reportData.section11_auditSummary.leadAuditor}</strong>.
            </div>
          </div>

          {/* Official Sign-Off Box */}
          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #0b2545', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>CERTIFIED TRUE COPY OF RECORD</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0b2545' }}>NCRB Automated Legal Dossier Engine</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Cryptographically Signed with RSA-4096 / SHA-256</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ width: 180, borderBottom: '1px solid #0b2545', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0b2545' }}>Superintendent of Police / IO Signature</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Section 65B(4) Deponent</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
