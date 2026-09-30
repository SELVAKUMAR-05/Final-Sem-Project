import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { useToast } from '../../components/common/Toast.tsx';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Database,
  ExternalLink,
  Award,
  Terminal
} from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const { showToast } = useToast();
  const [runningScan, setRunningScan] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    totalChecked: number;
    tamperedCount: number;
    scannedAt: string;
  } | null>(null);

  const handleRunSystemIntegrityScan = async () => {
    try {
      setRunningScan(true);
      const docs = await api.getDocuments();
      const evidence = await api.getEvidence();

      let tamperedDocs = 0;
      for (const d of docs) {
        if (d.isTampered) tamperedDocs++;
      }
      for (const e of evidence) {
        if (e.isTampered) tamperedDocs++;
      }

      setScanResult({
        totalChecked: docs.length + evidence.length,
        tamperedCount: tamperedDocs,
        scannedAt: new Date().toLocaleTimeString()
      });

      if (tamperedDocs === 0) {
        showToast('System-wide integrity verified! All cryptographic hashes match root blocks.', 'success');
      } else {
        showToast(`CRITICAL: Found ${tamperedDocs} items with broken integrity hashes!`, 'error');
      }
    } catch (err: any) {
      showToast('Integrity scan encounter an error', 'error');
    } finally {
      setRunningScan(false);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Security & Legal Compliance' }]} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
            Security, Cryptography &amp; Legal Compliance
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Active cryptographic guarantees, evidentiary standards compliance, and real-time ledger integrity monitors.
          </p>
        </div>

        <button
          onClick={handleRunSystemIntegrityScan}
          disabled={runningScan}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
        >
          <RefreshCw size={15} className={runningScan ? 'spin' : ''} />
          <span>{runningScan ? 'Scanning All Cryptographic Blocks...' : 'Run System-Wide Integrity Audit'}</span>
        </button>
      </div>

      {/* Scan Result Notice Banner */}
      {scanResult && (
        <div
          style={{
            background: scanResult.tamperedCount > 0 ? '#fef2f2' : '#ecfdf5',
            border: scanResult.tamperedCount > 0 ? '1px solid #fecaca' : '1px solid #a7f3d0',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {scanResult.tamperedCount > 0 ? (
              <AlertTriangle size={20} color="#dc2626" />
            ) : (
              <CheckCircle2 size={20} color="#059669" />
            )}
            <div>
              <div style={{ fontWeight: 800, color: scanResult.tamperedCount > 0 ? '#991b1b' : '#065f46', fontSize: '14px' }}>
                {scanResult.tamperedCount > 0
                  ? `Integrity Anomaly: ${scanResult.tamperedCount} exhibits flagged as tampered`
                  : `Full System Integrity Verified: All ${scanResult.totalChecked} exhibits match ledger`}
              </div>
              <div style={{ fontSize: '12px', color: scanResult.tamperedCount > 0 ? '#b91c1c' : '#047857', marginTop: '2px' }}>
                Completed at {scanResult.scannedAt} across active Spring Boot repository blocks.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cryptography Standards Grid */}
      <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', textTransform: 'uppercase' }}>
        Active Cryptographic &amp; Encryption Standards
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8' }}>
              <Lock size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>AES-256-GCM / CBC</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>FIPS 197 Certified Payload Cipher</div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
            Every legal document, FIR, and digital exhibit is encrypted at rest using individual file initialization vectors (IV) before storage.
          </p>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8' }}>
              <Terminal size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>NIST FIPS 180-4 SHA-256</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Immutable Cryptographic Digest</div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
            Cryptographic hashes are calculated at the instant of file upload and permanently written to immutable audit logs for non-repudiation.
          </p>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8' }}>
              <KeyRound size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>RSA-4096 / ECDSA</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Public Key Infrastructure (PKI)</div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
            Judicial approvals and witness signatures are cryptographically signed using role-bound certificates recognized in courts of law.
          </p>
        </div>
      </div>

      {/* Statutory & Legal Framework Badges */}
      <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', textTransform: 'uppercase' }}>
        Statutory Evidentiary &amp; Forensic Certifications
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ padding: '10px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
              <Award size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Section 65B Indian Evidence Act / BSA 2023
              </h3>
              <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
                Admissibility of Electronic Records Certified
              </div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            Complies with Supreme Court rulings (Arjun Panditrao v. Kailash Kushanrao). Documents generate automated 65B certificates detailing computer hash, machine identity, custody custody duration, and non-tamper verification.
          </p>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ padding: '10px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8' }}>
              <FileCheck size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Information Technology Act 2000 (Sec 43A, 72A)
              </h3>
              <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 700 }}>
                Law Enforcement &amp; Critical Infrastructure Protection
              </div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            Guarantees strict role-based access control (RBAC), multi-layered audit logging, and automated watermarking to prevent unauthorized leaks of judicial investigations.
          </p>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ padding: '10px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed' }}>
              <Database size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                NIST SP 800-86 / ISO/IEC 27037:2012
              </h3>
              <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 700 }}>
                Digital Evidence Handling &amp; Custody Standards
              </div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            Establishes standardized collection, acquisition, and chain-of-custody transfer tracking, ensuring digital forensics integrity is never contaminated or compromised.
          </p>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ padding: '10px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                ISO/IEC 27001:2022 ISMS Controls
              </h3>
              <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 700 }}>
                Information Security Management Systems
              </div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            Enforces strict access control, segregation of duties between Investigating Officers and Forensic Specialists, and secure session management.
          </p>
        </div>
      </div>
    </div>
  );
};
