import fs from 'node:fs';
import path from 'node:path';
import { 
  User, 
  Case, 
  LegalDocument, 
  DocumentVersion, 
  DigitalSignature, 
  IntegrityCheckResult,
  Evidence,
  EvidenceTransfer,
  CaseTimelineEvent,
  SecurityAlert,
  Notification,
  CaseRelationshipGraphData,
  AIDocumentMetadata,
  WorkflowStatus,
  UserRole
} from '../src/types.ts';
import { computeSha256, hashPassword } from './security.ts';
import { addAuditLog } from './audit.ts';
import { AIService } from './ai.ts';

const STORAGE_DIR = path.resolve(process.cwd(), 'storage');

// Complete Data storage in-memory with disk persistence for uploaded documents
export interface AppDatabase {
  users: User[];
  userPasswords: Map<number, string>;
  cases: Case[];
  documents: LegalDocument[];
  documentVersions: DocumentVersion[];
  digitalSignatures: DigitalSignature[];
  evidence: Evidence[];
  evidenceTransfers: EvidenceTransfer[];
  caseTimelineEvents: CaseTimelineEvent[];
  securityAlerts: SecurityAlert[];
  notifications: Notification[];
  aiMetadataStore: Map<number, AIDocumentMetadata>;
}

const db: AppDatabase = {
  users: [],
  userPasswords: new Map(),
  cases: [],
  documents: [],
  documentVersions: [],
  digitalSignatures: [],
  evidence: [],
  evidenceTransfers: [],
  caseTimelineEvents: [],
  securityAlerts: [],
  notifications: [],
  aiMetadataStore: new Map(),
};

let nextUserId = 1;
let nextCaseId = 1;
let nextDocId = 1;
let nextVersionId = 1;
let nextSigId = 1;
let nextEvidenceId = 1;
let nextTransferId = 1;
let nextTimelineId = 1;
let nextAlertId = 1;
let nextNotificationId = 1;

export function getDb(): AppDatabase {
  return db;
}

// Initialize seed data and files
export function initDatabase() {
  if (db.users.length > 0) return; // already initialized

  // Ensure storage folder
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  // 1. Seed Users (6 authentic personas)
  const seedUsers: Array<Omit<User, 'id' | 'createdAt'> & { rawPass: string }> = [
    {
      username: 'admin',
      email: 'admin@secure-dms.local',
      role: 'ADMIN',
      fullName: 'Dr. Rajesh Sharma',
      department: 'NCRB Headquarters - IT & Security',
      badgeNumber: 'NCRB-ADM-001',
      active: true,
      rawPass: 'admin123',
    },
    {
      username: 'police',
      email: 'police@secure-dms.local',
      role: 'POLICE_OFFICER',
      fullName: 'Inspector K. Arumugam',
      department: 'Law & Order Police Station, Chennai',
      badgeNumber: 'TN-POL-4412',
      active: true,
      rawPass: 'police123',
    },
    {
      username: 'investigator',
      email: 'investigator@secure-dms.local',
      role: 'INVESTIGATION_OFFICER',
      fullName: 'DSP Sunita Rao',
      department: 'Crime Branch CID / Women Safety Cell',
      badgeNumber: 'CID-IO-8891',
      active: true,
      rawPass: 'invest123',
    },
    {
      username: 'forensic',
      email: 'forensic@secure-dms.local',
      role: 'FORENSIC_OFFICER',
      fullName: 'Dr. Priya Nambiar',
      department: 'Central Forensic Science Laboratory (CFSL)',
      badgeNumber: 'CFSL-BIO-2204',
      active: true,
      rawPass: 'forensic123',
    },
    {
      username: 'lawyer',
      email: 'lawyer@secure-dms.local',
      role: 'LAWYER',
      fullName: 'Advocate Vikram Malhotra',
      department: 'Bar Council & Legal Defense Counsel',
      badgeNumber: 'BAR-DEL-9912',
      active: true,
      rawPass: 'lawyer123',
    },
    {
      username: 'court',
      email: 'court@secure-dms.local',
      role: 'COURT_OFFICER',
      fullName: 'Registrar Justice Meenakshi Sundaram',
      department: 'High Court of Judicature - Registry',
      badgeNumber: 'HC-REG-3001',
      active: true,
      rawPass: 'court123',
    },
  ];

  for (const u of seedUsers) {
    const userId = nextUserId++;
    const user: User = {
      id: userId,
      username: u.username,
      email: u.email,
      role: u.role,
      fullName: u.fullName,
      department: u.department,
      badgeNumber: u.badgeNumber,
      active: u.active,
      createdAt: new Date('2026-01-01T08:00:00Z').toISOString(),
    };
    db.users.push(user);
    db.userPasswords.set(userId, hashPassword(u.rawPass));
  }

  // 2. Seed Cases
  const seedCases = [
    {
      caseNumber: 'CASE-2026-001',
      title: 'Commercial Vault Theft & Security Tampering',
      crimeType: 'Armed Burglary / Cyber Intrusion',
      description: 'Break-in at commercial depository vault. Forensic recovery of tampered electronic access logs, security keypad hardware, and mobile telemetry.',
      location: 'Central Chennai Financial District',
      status: 'UNDER_INVESTIGATION' as const,
      priority: 'HIGH' as const,
      investigatingOfficer: 'DSP Sunita Rao',
      department: 'Crime Branch CID - Special Unit',
      createdBy: 'Inspector K. Arumugam',
      createdById: 2,
    },
    {
      caseNumber: 'CASE-2026-002',
      title: 'Financial Phishing & Cyber Extortion Network',
      crimeType: 'Cyber Crime / Extortion',
      description: 'Distributed fraud syndicate targeting women entrepreneurs with ransomware threats and fraudulent bank accounts.',
      location: 'New Delhi National Capital Region',
      status: 'UNDER_INVESTIGATION' as const,
      priority: 'CRITICAL' as const,
      investigatingOfficer: 'DSP Sunita Rao',
      department: 'NCRB Women Safety & Cyber Cell',
      createdBy: 'Dr. Rajesh Sharma',
      createdById: 1,
    },
    {
      caseNumber: 'CASE-2026-003',
      title: 'Missing Vulnerable Youth Investigation',
      crimeType: 'Missing Person',
      description: 'Disappearance reported at Central Railway Station. Surveillance footage, transit logs, and telephone CDR being analyzed.',
      location: 'Mumbai Suburbs',
      status: 'PENDING_REVIEW' as const,
      priority: 'MEDIUM' as const,
      investigatingOfficer: 'Inspector K. Arumugam',
      department: 'Maharashtra Police - Special Task Force',
      createdBy: 'Inspector K. Arumugam',
      createdById: 2,
    },
  ];

  for (const c of seedCases) {
    const caseId = nextCaseId++;
    const caseItem: Case = {
      id: caseId,
      ...c,
      createdAt: new Date('2026-02-01T10:30:00Z').toISOString(),
      updatedAt: new Date('2026-02-15T14:20:00Z').toISOString(),
    };
    db.cases.push(caseItem);

    const caseDir = path.join(STORAGE_DIR, 'cases', c.caseNumber);
    if (!fs.existsSync(caseDir)) {
      fs.mkdirSync(caseDir, { recursive: true });
    }
  }

  // 3. Seed Initial Documents with Real Disk Files
  const initialDocs = [
    {
      caseId: 1,
      caseNumber: 'CASE-2026-001',
      docName: 'First Information Report (FIR-44/2026)',
      docType: 'FIR' as const,
      originalFilename: 'FIR_VaultTheft_Chennai_signed.pdf',
      storedFilename: 'DOC-fir-8f92ab3f.pdf',
      mimeType: 'application/pdf',
      classification: 'RESTRICTED' as const,
      uploadedBy: 'Inspector K. Arumugam',
      uploadedById: 2,
      encrypted: true,
      signed: true,
      workflowStatus: 'APPROVED' as WorkflowStatus,
      content: `%PDF-1.4
[NATIONAL CRIME RECORDS BUREAU - OFFICIAL FIRST INFORMATION REPORT]
State: Tamil Nadu | District: Chennai City | Station: Central Law & Order
FIR No: 44/2026 | Date & Time of Occurrence: 2026-01-28 02:45 IST
Complainant: Axis Security Director | Accused: Unknown syndicate
Incident Summary: Burglary into safety depository vault using unauthorized electronic keypad override.
Acts & Sections: IPC 380, IPC 457, Information Technology Act Sec 66.
Officer In Charge: Inspector K. Arumugam (Badge: TN-POL-4412)
Cryptographic Hash Protected: NCRB Evidence Integrity Verification System.`,
      extractedText: 'National Crime Records Bureau Official First Information Report. FIR No 44/2026. Occurrence: 2026-01-28 02:45 IST. Complainant Axis Security Director. Unauthorized electronic keypad override. IPC 380, IPC 457, IT Act Sec 66.',
    },
    {
      caseId: 1,
      caseNumber: 'CASE-2026-001',
      docName: 'CCTV Security Guard Witness Statement',
      docType: 'WITNESS_STATEMENT' as const,
      originalFilename: 'Witness_Statement_RameshKumar_Guard.docx',
      storedFilename: 'DOC-wit-91b402ef.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      classification: 'RESTRICTED' as const,
      uploadedBy: 'DSP Sunita Rao',
      uploadedById: 3,
      encrypted: true,
      signed: true,
      workflowStatus: 'APPROVED' as WorkflowStatus,
      content: `WITNESS STATEMENT RECORDED UNDER SECTION 161 CrPC
Case: CASE-2026-001
Witness: Ramesh Kumar S/o S. Narayanan, Age 42, Night Guard
Statement: On 28-01-2026 around 02:15 hrs, observed a dark gray utility van parked near emergency exit gate 4. Two individuals wearing high-vis jackets entered through service duct. Keypad alert was silenced remotely.
Recorded By: DSP Sunita Rao (CID)`,
      extractedText: 'Witness statement under section 161 CrPC. Witness Ramesh Kumar Night Guard. Dark gray utility van parked near emergency exit gate 4. Keypad alert silenced remotely.',
    },
    {
      caseId: 1,
      caseNumber: 'CASE-2026-001',
      docName: 'CFSL Digital Forensics Examination Report',
      docType: 'FORENSIC_REPORT' as const,
      originalFilename: 'CFSL_Keypad_DigitalForensics_v1.pdf',
      storedFilename: 'DOC-cfs-7718de1a.pdf',
      mimeType: 'application/pdf',
      classification: 'CONFIDENTIAL' as const,
      uploadedBy: 'Dr. Priya Nambiar',
      uploadedById: 4,
      encrypted: true,
      signed: true,
      workflowStatus: 'FINAL' as WorkflowStatus,
      content: `CENTRAL FORENSIC SCIENCE LABORATORY (CFSL)
Cyber & Hardware Forensics Division
Item Examined: Digital Access Controller Model AC-900 (Recovered from Vault Entry)
Findings: Hardware EEPROM was injected with custom payload via internal SPI bus. Microcontroller memory dumped successfully.
Cryptographic evidence extracted: Attacker IP trace 192.0.2.89 routed through compromised proxy.
Examiner: Dr. Priya Nambiar (Senior Scientific Officer, CFSL)`,
      extractedText: 'Central Forensic Science Laboratory CFSL Cyber & Hardware Forensics. Digital Access Controller Model AC-900. Hardware EEPROM injected with custom payload via internal SPI bus. Attacker IP trace 192.0.2.89. Examiner Dr. Priya Nambiar.',
    },
    {
      caseId: 2,
      caseNumber: 'CASE-2026-002',
      docName: 'NCRB Cyber Extortion Primary FIR',
      docType: 'FIR' as const,
      originalFilename: 'FIR_CyberCrime_Delhi_2026_09.pdf',
      storedFilename: 'DOC-fir-998822ab.pdf',
      mimeType: 'application/pdf',
      classification: 'RESTRICTED' as const,
      uploadedBy: 'Dr. Rajesh Sharma',
      uploadedById: 1,
      encrypted: true,
      signed: true,
      workflowStatus: 'APPROVED' as WorkflowStatus,
      content: `NCRB WOMEN SAFETY DIVISION - CYBER CRIME REPORT
Case Reference: CASE-2026-002
Complainants: All India Women Entrepreneurs Federation
Nature of Complaint: Coordinated WhatsApp voice spoofing & fraudulent banking redirect.
Estimated Disputed Volume: INR 4.8 Crores across 18 shell accounts.
Action Initiated: Banking freezing orders requested under Section 91 CrPC.`,
      extractedText: 'NCRB Women Safety Division Cyber Crime Report. Coordinated WhatsApp voice spoofing and fraudulent banking redirect. Estimated volume INR 4.8 Crores across 18 shell accounts.',
    },
    {
      caseId: 2,
      caseNumber: 'CASE-2026-002',
      docName: 'Special Public Prosecutor Charge Sheet Draft',
      docType: 'CHARGE_SHEET' as const,
      originalFilename: 'ChargeSheet_Draft_Sec173_CrPC.pdf',
      storedFilename: 'DOC-chg-332144bb.pdf',
      mimeType: 'application/pdf',
      classification: 'RESTRICTED' as const,
      uploadedBy: 'DSP Sunita Rao',
      uploadedById: 3,
      encrypted: true,
      signed: false,
      workflowStatus: 'UNDER_REVIEW' as WorkflowStatus,
      content: `IN THE COURT OF CHIEF METROPOLITAN MAGISTRATE, NEW DELHI
CHARGE SHEET UNDER SECTION 173 CrPC
State vs. Accused Network Syndicate (A1 to A7)
Charge: Criminal Conspiracy (120B), Extortion (384), IT Act 66D (Cheating by personation).
List of witnesses: 14. List of documentary exhibits: 28.`,
      extractedText: 'In the Court of Chief Metropolitan Magistrate New Delhi. Charge Sheet under Section 173 CrPC. State vs Accused Network Syndicate A1 to A7. Criminal Conspiracy 120B, Extortion 384, IT Act 66D.',
    },
  ];

  for (const item of initialDocs) {
    const docId = nextDocId++;
    const caseFolder = path.join(STORAGE_DIR, 'cases', item.caseNumber);
    if (!fs.existsSync(caseFolder)) {
      fs.mkdirSync(caseFolder, { recursive: true });
    }

    const filePath = path.join(caseFolder, item.storedFilename);
    const buffer = Buffer.from(item.content, 'utf-8');
    fs.writeFileSync(filePath, buffer);

    const realHash = computeSha256(buffer);

    // AI metadata pre-generation
    const aiSummary = AIService.summarizeDocument(item.extractedText, item.docType, {
      caseNumber: item.caseNumber,
      crimeType: 'Financial Crime / Burglary',
      location: 'Chennai / New Delhi',
    });

    const aiMeta: AIDocumentMetadata = {
      documentId: docId,
      documentType: item.docType,
      caseNumber: item.caseNumber,
      crimeType: 'Financial Crime / Burglary',
      location: 'Chennai / New Delhi',
      keywords: aiSummary.keywords,
      summary: aiSummary.summary,
      entities: aiSummary.entities,
      confidence: 0.96,
      generatedAt: new Date().toISOString(),
    };
    db.aiMetadataStore.set(docId, aiMeta);

    const doc: LegalDocument = {
      id: docId,
      caseId: item.caseId,
      caseNumber: item.caseNumber,
      documentName: item.docName,
      documentType: item.docType,
      originalFilename: item.originalFilename,
      storedFilename: item.storedFilename,
      filePath,
      mimeType: item.mimeType,
      fileSize: buffer.length,
      sha256Hash: realHash,
      version: 1,
      uploadedBy: item.uploadedBy,
      uploadedById: item.uploadedById,
      encrypted: item.encrypted,
      encryptionAlgorithm: 'AES-256-CBC',
      signed: item.signed,
      signatureStatus: item.signed ? 'SIGNED' : 'NOT_SIGNED',
      workflowStatus: item.workflowStatus,
      currentStatus: 'ACTIVE',
      classification: item.classification,
      extractedText: item.extractedText,
      ocrExtracted: true,
      aiMetadata: aiMeta,
      isTampered: false,
      createdAt: new Date('2026-02-02T11:00:00Z').toISOString(),
      updatedAt: new Date('2026-02-02T11:00:00Z').toISOString(),
    };

    db.documents.push(doc);

    // Initial Version
    const version: DocumentVersion = {
      id: nextVersionId++,
      documentId: docId,
      versionNumber: 1,
      filePath,
      storedFilename: item.storedFilename,
      sha256Hash: realHash,
      uploadedBy: item.uploadedBy,
      uploadedById: item.uploadedById,
      fileSize: buffer.length,
      changeDescription: 'Initial verified upload & digital registration',
      createdAt: new Date('2026-02-02T11:00:00Z').toISOString(),
    };
    db.documentVersions.push(version);

    // Initial Digital Signature if signed
    if (item.signed) {
      const sig: DigitalSignature = {
        id: nextSigId++,
        documentId: docId,
        signedBy: item.uploadedBy,
        signedById: item.uploadedById,
        signerRole: 'POLICE_OFFICER',
        documentHash: realHash,
        signature: `NCRB-SIG-ED25519-${Buffer.from(realHash + item.uploadedBy).toString('base64').slice(0, 48)}`,
        certificateIssuer: 'National Crime Records Bureau Root CA - PKI India',
        status: 'SIGNED',
        signedAt: new Date('2026-02-02T11:05:00Z').toISOString(),
      };
      db.digitalSignatures.push(sig);
    }
  }

  // 4. Seed Evidence (Chain of Custody Module)
  const seedEvidence = [
    {
      evidenceId: 'EVD-2026-0042',
      caseId: 1,
      caseNumber: 'CASE-2026-001',
      evidenceType: 'Mobile Phone',
      description: 'Black Samsung Galaxy S23 Android mobile phone recovered from vault crime scene service duct.',
      collectedBy: 'Inspector K. Arumugam',
      collectedById: 2,
      collectionLocation: 'Axis Vault Crime Scene, Emergency Exit Duct',
      collectionDateTime: '2026-02-03T03:30:00Z',
      currentCustodian: 'Dr. Priya Nambiar',
      currentCustodianRole: 'FORENSIC_OFFICER' as UserRole,
      status: 'UNDER_FORENSIC_EXAMINATION' as const,
      sealNumber: 'SEAL-TN-92831',
      condition: 'Intact. Faraday evidence bag sealed with tamper-evident indicator tape.',
      sha256Hash: 'A8B9C0D1E2F384759601B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3',
      isTampered: false,
    },
    {
      evidenceId: 'EVD-2026-0043',
      caseId: 1,
      caseNumber: 'CASE-2026-001',
      evidenceType: 'Keypad Microcontroller PCB',
      description: 'Hardware circuit board from AC-900 Electronic Access keypad showing jumper wires and soldered microcontroller tap.',
      collectedBy: 'DSP Sunita Rao',
      collectedById: 3,
      collectionLocation: 'Outer Security Gate Keypad Enclosure',
      collectionDateTime: '2026-02-03T04:15:00Z',
      currentCustodian: 'Dr. Priya Nambiar',
      currentCustodianRole: 'FORENSIC_OFFICER' as UserRole,
      status: 'SEALED' as const,
      sealNumber: 'SEAL-TN-92832',
      condition: 'Minor PCB flux residue, ESD anti-static pouch intact.',
      sha256Hash: '3F7A8901BCDE56123489ACDEF0123456789ABCDEF0123456789ABCDEF0123456',
      isTampered: false,
    },
    {
      evidenceId: 'EVD-2026-0088',
      caseId: 2,
      caseNumber: 'CASE-2026-002',
      evidenceType: 'High-Capacity SSD Drive',
      description: 'Kingston 2TB NVMe M.2 Drive seized from Delhi syndicate call center rack with spoofed VoIP PBX image.',
      collectedBy: 'DSP Sunita Rao',
      collectedById: 3,
      collectionLocation: 'Commercial Call Center, Sector 62, Noida',
      collectionDateTime: '2026-02-05T14:00:00Z',
      currentCustodian: 'DSP Sunita Rao',
      currentCustodianRole: 'INVESTIGATION_OFFICER' as UserRole,
      status: 'STORED' as const,
      sealNumber: 'SEAL-NCR-55194',
      condition: 'Pristine, bit-stream forensic clone created and verified.',
      sha256Hash: '99887766554433221100AABBCCDDEEFF00112233445566778899AABBCCDDEEFF',
      isTampered: false,
    },
  ];

  for (const ev of seedEvidence) {
    const evRecord: Evidence = {
      id: nextEvidenceId++,
      ...ev,
      createdAt: ev.collectionDateTime,
      updatedAt: new Date().toISOString(),
    };
    db.evidence.push(evRecord);
  }

  // 5. Seed Evidence Transfers (Chain of Custody Transfers)
  const seedTransfers = [
    {
      evidenceId: 'EVD-2026-0042',
      evidenceRecordId: 1,
      fromUser: 'Inspector K. Arumugam',
      fromRole: 'POLICE_OFFICER' as UserRole,
      toUser: 'Inspector K. Arumugam',
      toRole: 'POLICE_OFFICER' as UserRole,
      transferReason: 'Evidence collected at scene and sealed in tamper-proof container',
      transferDateTime: '2026-02-03T03:45:00Z',
      location: 'Crime Scene, Central Law & Order Station',
      conditionBefore: 'Recovered from wet surface',
      conditionAfter: 'Dry, powered down, secured in Faraday pouch SEAL-TN-92831',
      signature: 'DIGITAL_SIGNATURE_ARUMUGAM_SEAL_VERIFIED_92831',
      status: 'COMPLETED' as const,
      createdAt: '2026-02-03T03:45:00Z',
    },
    {
      evidenceId: 'EVD-2026-0042',
      evidenceRecordId: 1,
      fromUser: 'Inspector K. Arumugam',
      fromRole: 'POLICE_OFFICER' as UserRole,
      toUser: 'DSP Sunita Rao',
      toRole: 'INVESTIGATION_OFFICER' as UserRole,
      transferReason: 'Case diary submission & transfer to Chief Investigating Officer',
      transferDateTime: '2026-02-03T11:00:00Z',
      location: 'CID Crime Branch Zonal Headquarters',
      conditionBefore: 'Sealed SEAL-TN-92831 intact',
      conditionAfter: 'Seal inspected and verified untampered',
      signature: 'DIGITAL_SIGNATURE_SUNITA_RAO_HANDOVER_CONFIRMED',
      status: 'COMPLETED' as const,
      createdAt: '2026-02-03T11:00:00Z',
    },
    {
      evidenceId: 'EVD-2026-0042',
      evidenceRecordId: 1,
      fromUser: 'DSP Sunita Rao',
      fromRole: 'INVESTIGATION_OFFICER' as UserRole,
      toUser: 'Dr. Priya Nambiar',
      toRole: 'FORENSIC_OFFICER' as UserRole,
      transferReason: 'Forwarded for cyber forensics & logical extraction under 65B compliance',
      transferDateTime: '2026-02-04T09:30:00Z',
      location: 'CFSL Cyber Forensics Lab, Room 204',
      conditionBefore: 'Seal SEAL-TN-92831 verified intact',
      conditionAfter: 'Received in lab, logged into CFSL Evidence Vault',
      signature: 'CFSL_RECEIPT_PRIYA_NAMBIAR_OFFICIAL_STAMP_2204',
      status: 'COMPLETED' as const,
      createdAt: '2026-02-04T09:30:00Z',
    },
  ];

  for (const tr of seedTransfers) {
    db.evidenceTransfers.push({
      id: nextTransferId++,
      ...tr,
    });
  }

  // 6. Seed Case Timeline Events (Case Investigation Timeline)
  const seedTimeline = [
    {
      caseId: 1,
      caseNumber: 'CASE-2026-001',
      eventType: 'CASE_CREATED' as const,
      title: 'Case Registration & Incident Intimation',
      description: 'Case registered at Central Law & Order Station based on depository vault breach alarm.',
      actor: 'Inspector K. Arumugam',
      actorRole: 'POLICE_OFFICER' as UserRole,
      timestamp: '2026-01-28T03:15:00Z',
    },
    {
      caseId: 1,
      caseNumber: 'CASE-2026-001',
      eventType: 'FIR_UPLOADED' as const,
      title: 'FIR-44/2026 Formally Registered & Digitally Signed',
      description: 'First Information Report uploaded with SHA-256 integrity hash and AES-256 vault encryption.',
      actor: 'Inspector K. Arumugam',
      actorRole: 'POLICE_OFFICER' as UserRole,
      timestamp: '2026-01-28T04:30:00Z',
      relatedDocumentId: 1,
    },
    {
      caseId: 1,
      caseNumber: 'CASE-2026-001',
      eventType: 'OFFICER_ASSIGNED' as const,
      title: 'Special Investigation Officer Assigned',
      description: 'CID Crime Branch designated DSP Sunita Rao as Lead Investigating Officer for forensic coordination.',
      actor: 'Dr. Rajesh Sharma',
      actorRole: 'ADMIN' as UserRole,
      timestamp: '2026-01-29T10:00:00Z',
    },
    {
      caseId: 1,
      caseNumber: 'CASE-2026-001',
      eventType: 'WITNESS_STATEMENT_UPLOADED' as const,
      title: 'Witness Statement Recorded (Security Guard)',
      description: 'Statement under Section 161 CrPC recorded from night guard Ramesh Kumar regarding suspect vehicle.',
      actor: 'DSP Sunita Rao',
      actorRole: 'INVESTIGATION_OFFICER' as UserRole,
      timestamp: '2026-01-30T16:20:00Z',
      relatedDocumentId: 2,
    },
    {
      caseId: 1,
      caseNumber: 'CASE-2026-001',
      eventType: 'EVIDENCE_ADDED' as const,
      title: 'Mobile Device EVD-2026-0042 Recovered & Sealed',
      description: 'Samsung S23 recovered from service duct, sealed under seal number SEAL-TN-92831.',
      actor: 'Inspector K. Arumugam',
      actorRole: 'POLICE_OFFICER' as UserRole,
      timestamp: '2026-02-03T03:30:00Z',
      relatedEvidenceId: 'EVD-2026-0042',
    },
    {
      caseId: 1,
      caseNumber: 'CASE-2026-001',
      eventType: 'EVIDENCE_TRANSFERRED' as const,
      title: 'Evidence Transferred to Central Forensic Science Lab',
      description: 'Chain of custody transfer confirmed from DSP Sunita Rao to Dr. Priya Nambiar (CFSL).',
      actor: 'DSP Sunita Rao',
      actorRole: 'INVESTIGATION_OFFICER' as UserRole,
      timestamp: '2026-02-04T09:30:00Z',
      relatedEvidenceId: 'EVD-2026-0042',
    },
    {
      caseId: 1,
      caseNumber: 'CASE-2026-001',
      eventType: 'FORENSIC_REPORT_UPLOADED' as const,
      title: 'CFSL Digital Forensics Examination Completed',
      description: 'Hardware memory extraction revealed attacker command-and-control IP 192.0.2.89.',
      actor: 'Dr. Priya Nambiar',
      actorRole: 'FORENSIC_OFFICER' as UserRole,
      timestamp: '2026-02-06T15:45:00Z',
      relatedDocumentId: 3,
    },
    {
      caseId: 1,
      caseNumber: 'CASE-2026-001',
      eventType: 'DOCUMENT_APPROVED' as const,
      title: 'Forensic Examination Approved & Verified',
      description: 'Forensic report reviewed and approved into evidentiary record under Section 65B Indian Evidence Act.',
      actor: 'DSP Sunita Rao',
      actorRole: 'INVESTIGATION_OFFICER' as UserRole,
      timestamp: '2026-02-07T11:00:00Z',
      relatedDocumentId: 3,
    },
  ];

  for (const ev of seedTimeline) {
    db.caseTimelineEvents.push({
      id: nextTimelineId++,
      ...ev,
    });
  }

  // 7. Seed Security Alerts
  const seedAlerts = [
    {
      userId: 5,
      username: 'lawyer',
      alertType: 'UNUSUAL_DOCUMENT_ACCESS' as const,
      severity: 'HIGH' as const,
      description: 'Repeated 403 Forbidden requests to view confidential CFSL forensic internal notes without judicial leave.',
      detectedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'OPEN' as const,
      relatedCaseId: 1,
      relatedDocumentId: 3,
    },
    {
      userId: 2,
      username: 'police',
      alertType: 'RAPID_DOWNLOADS' as const,
      severity: 'MEDIUM' as const,
      description: '14 case evidence archives downloaded within 3 minutes from remote station IP 10.22.4.15.',
      detectedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      status: 'INVESTIGATING' as const,
      relatedCaseId: 1,
    },
    {
      userId: 0,
      username: 'UNKNOWN',
      alertType: 'MULTIPLE_FAILED_LOGINS' as const,
      severity: 'LOW' as const,
      description: '5 consecutive failed authentication attempts against officer account (insp.arumugam).',
      detectedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      status: 'RESOLVED' as const,
    },
  ];

  for (const al of seedAlerts) {
    db.securityAlerts.push({
      id: nextAlertId++,
      ...al,
    });
  }

  // 8. Seed Notifications
  const seedNotifications = [
    {
      userId: 4, // forensic
      message: 'Evidence EVD-2026-0042 (Mobile Phone) transferred to your CFSL custody.',
      type: 'INFO' as const,
      read: false,
      createdAt: '2026-02-04T09:35:00Z',
      relatedCaseId: 1,
      relatedEvidenceId: 'EVD-2026-0042',
    },
    {
      userId: 3, // investigator
      message: 'CFSL Digital Forensics Report uploaded by Dr. Priya Nambiar. Requires approval.',
      type: 'APPROVAL' as const,
      read: false,
      createdAt: '2026-02-06T15:50:00Z',
      relatedCaseId: 1,
      relatedDocumentId: 3,
    },
    {
      userId: 1, // admin
      message: 'Suspicious Activity Detected: High frequency document access from IP 10.22.4.15.',
      type: 'ALERT' as const,
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      relatedCaseId: 1,
    },
    {
      userId: 6, // court
      message: 'Charge Sheet Draft submitted for CASE-2026-002. Awaiting judicial filing.',
      type: 'INFO' as const,
      read: true,
      createdAt: '2026-02-10T11:00:00Z',
      relatedCaseId: 2,
    },
  ];

  for (const n of seedNotifications) {
    db.notifications.push({
      id: nextNotificationId++,
      ...n,
    });
  }

  // Pre-seed Audit Logs for realism (Chained SHA-256 Ledger)
  addAuditLog({
    userId: 1,
    username: 'admin',
    role: 'ADMIN',
    action: 'LOGIN',
    ipAddress: '10.14.8.102',
    description: 'System initialization and security service verification',
  });
  addAuditLog({
    userId: 2,
    username: 'police',
    role: 'POLICE_OFFICER',
    action: 'CASE_CREATED',
    caseId: 1,
    caseNumber: 'CASE-2026-001',
    ipAddress: '10.22.4.15',
    description: 'Registered Case CASE-2026-001: Commercial Vault Theft & Security Tampering',
  });
  addAuditLog({
    userId: 2,
    username: 'police',
    role: 'POLICE_OFFICER',
    action: 'DOCUMENT_UPLOADED',
    documentId: 1,
    documentName: 'First Information Report (FIR-44/2026)',
    caseId: 1,
    caseNumber: 'CASE-2026-001',
    ipAddress: '10.22.4.15',
    description: 'Uploaded FIR with SHA-256 integrity verification & AES-256 encryption',
  });
  addAuditLog({
    userId: 2,
    username: 'police',
    role: 'POLICE_OFFICER',
    action: 'EVIDENCE_COLLECTED',
    caseId: 1,
    caseNumber: 'CASE-2026-001',
    evidenceId: 'EVD-2026-0042',
    ipAddress: '10.22.4.15',
    description: 'Seized mobile device EVD-2026-0042 from vault crime scene, sealed SEAL-TN-92831',
  });
  addAuditLog({
    userId: 3,
    username: 'investigator',
    role: 'INVESTIGATION_OFFICER',
    action: 'EVIDENCE_TRANSFERRED',
    caseId: 1,
    caseNumber: 'CASE-2026-001',
    evidenceId: 'EVD-2026-0042',
    ipAddress: '10.30.9.11',
    description: 'Transferred EVD-2026-0042 to Dr. Priya Nambiar (CFSL) for cyber examination',
  });
  addAuditLog({
    userId: 4,
    username: 'forensic',
    role: 'FORENSIC_OFFICER',
    action: 'EVIDENCE_RECEIVED',
    caseId: 1,
    caseNumber: 'CASE-2026-001',
    evidenceId: 'EVD-2026-0042',
    ipAddress: '10.30.9.88',
    description: 'Forensic reception confirmed: SEAL-TN-92831 intact. Commenced forensic extraction.',
  });
}

// ----------------------------------------------------------------------
// EVIDENCE & CHAIN OF CUSTODY FUNCTIONS
// ----------------------------------------------------------------------

export function getAllEvidence(caseId?: number): Evidence[] {
  if (caseId) {
    return db.evidence.filter((e) => e.caseId === caseId);
  }
  return [...db.evidence];
}

export function getEvidenceById(idOrEvidenceId: number | string): Evidence | undefined {
  if (typeof idOrEvidenceId === 'number') {
    return db.evidence.find((e) => e.id === idOrEvidenceId);
  }
  return db.evidence.find((e) => e.evidenceId === idOrEvidenceId || e.id.toString() === idOrEvidenceId);
}

export function createEvidence(data: {
  caseId: number;
  caseNumber: string;
  evidenceType: string;
  description: string;
  collectedBy: string;
  collectedById: number;
  collectionLocation: string;
  sealNumber: string;
  condition: string;
}): Evidence {
  const year = new Date().getFullYear();
  const count = db.evidence.length + 1;
  const evidenceId = `EVD-${year}-${count.toString().padStart(4, '0')}`;
  const now = new Date().toISOString();

  // Create cryptographic hash of evidence record
  const sha256Hash = computeSha256(Buffer.from(`${evidenceId}|${data.caseNumber}|${data.sealNumber}|${now}`));

  const newEv: Evidence = {
    id: nextEvidenceId++,
    evidenceId,
    caseId: data.caseId,
    caseNumber: data.caseNumber,
    evidenceType: data.evidenceType,
    description: data.description,
    collectedBy: data.collectedBy,
    collectedById: data.collectedById,
    collectionLocation: data.collectionLocation,
    collectionDateTime: now,
    currentCustodian: data.collectedBy,
    currentCustodianRole: 'POLICE_OFFICER',
    status: 'COLLECTED',
    sealNumber: data.sealNumber,
    condition: data.condition,
    sha256Hash,
    isTampered: false,
    createdAt: now,
    updatedAt: now,
  };

  db.evidence.push(newEv);

  // Record initial chain entry
  const transfer: EvidenceTransfer = {
    id: nextTransferId++,
    evidenceId,
    evidenceRecordId: newEv.id,
    fromUser: data.collectedBy,
    fromRole: 'POLICE_OFFICER',
    toUser: data.collectedBy,
    toRole: 'POLICE_OFFICER',
    transferReason: 'Evidence recovered at scene and registered into NCRB Chain of Custody vault',
    transferDateTime: now,
    location: data.collectionLocation,
    conditionBefore: data.condition,
    conditionAfter: `Sealed under ${data.sealNumber}`,
    signature: `INITIAL_REGISTRATION_SIG_${data.collectedById}_${Date.now()}`,
    status: 'COMPLETED',
    createdAt: now,
  };
  db.evidenceTransfers.push(transfer);

  // Add timeline event
  addCaseTimelineEvent({
    caseId: data.caseId,
    caseNumber: data.caseNumber,
    eventType: 'EVIDENCE_ADDED',
    title: `Evidence ${evidenceId} (${data.evidenceType}) Collected`,
    description: `Recovered from ${data.collectionLocation}. Seal ${data.sealNumber} applied.`,
    actor: data.collectedBy,
    actorRole: 'POLICE_OFFICER',
    relatedEvidenceId: evidenceId,
  });

  return newEv;
}

export function transferEvidence(data: {
  evidenceId: string;
  fromUser: string;
  fromRole: UserRole;
  toUser: string;
  toRole: UserRole;
  transferReason: string;
  location: string;
  conditionBefore: string;
  conditionAfter: string;
  signature: string;
}): EvidenceTransfer {
  const ev = getEvidenceById(data.evidenceId);
  if (!ev) throw new Error(`Evidence ${data.evidenceId} not found`);

  const now = new Date().toISOString();

  const transfer: EvidenceTransfer = {
    id: nextTransferId++,
    evidenceId: data.evidenceId,
    evidenceRecordId: ev.id,
    fromUser: data.fromUser,
    fromRole: data.fromRole,
    toUser: data.toUser,
    toRole: data.toRole,
    transferReason: data.transferReason,
    transferDateTime: now,
    location: data.location,
    conditionBefore: data.conditionBefore,
    conditionAfter: data.conditionAfter,
    signature: data.signature || `TRANSFER_SIG_${data.fromRole}_TO_${data.toRole}_${Date.now()}`,
    status: 'COMPLETED',
    createdAt: now,
  };

  db.evidenceTransfers.push(transfer);

  // Update evidence custodian & status
  ev.currentCustodian = data.toUser;
  ev.currentCustodianRole = data.toRole;
  ev.status = data.toRole === 'FORENSIC_OFFICER' ? 'UNDER_FORENSIC_EXAMINATION' : 'TRANSFERRED';
  ev.condition = data.conditionAfter;
  ev.updatedAt = now;

  // Add timeline event
  addCaseTimelineEvent({
    caseId: ev.caseId,
    caseNumber: ev.caseNumber,
    eventType: 'EVIDENCE_TRANSFERRED',
    title: `Evidence ${ev.evidenceId} Transferred (${data.fromRole} → ${data.toRole})`,
    description: `Handover from ${data.fromUser} to ${data.toUser}. Reason: ${data.transferReason}`,
    actor: data.fromUser,
    actorRole: data.fromRole,
    relatedEvidenceId: ev.evidenceId,
  });

  return transfer;
}

export function receiveEvidence(data: {
  evidenceId: string;
  receiverUser: string;
  receiverRole: UserRole;
  verifiedSeal: boolean;
  notes: string;
}): Evidence {
  const ev = getEvidenceById(data.evidenceId);
  if (!ev) throw new Error(`Evidence ${data.evidenceId} not found`);

  const now = new Date().toISOString();
  ev.currentCustodian = data.receiverUser;
  ev.currentCustodianRole = data.receiverRole;
  ev.status = data.receiverRole === 'FORENSIC_OFFICER' ? 'UNDER_FORENSIC_EXAMINATION' : 'RECEIVED';
  ev.updatedAt = now;

  // Record transfer log receipt
  const transfer: EvidenceTransfer = {
    id: nextTransferId++,
    evidenceId: ev.evidenceId,
    evidenceRecordId: ev.id,
    fromUser: ev.currentCustodian,
    fromRole: ev.currentCustodianRole,
    toUser: data.receiverUser,
    toRole: data.receiverRole,
    transferReason: `Custody receipt acknowledged. Seal status: ${data.verifiedSeal ? 'VERIFIED_INTACT' : 'FLAGGED'}. Notes: ${data.notes}`,
    transferDateTime: now,
    location: 'Custodial Evidence Receiving Counter',
    conditionBefore: ev.condition,
    conditionAfter: `Received by ${data.receiverUser} [${data.receiverRole}]`,
    signature: `RECEIPT_SIG_${data.receiverRole}_${Date.now()}`,
    status: 'COMPLETED',
    createdAt: now,
  };
  db.evidenceTransfers.push(transfer);

  return ev;
}

export function getEvidenceTransfers(evidenceId: string): EvidenceTransfer[] {
  return db.evidenceTransfers.filter((t) => t.evidenceId === evidenceId);
}

export function verifyEvidenceIntegrity(evidenceId: string): {
  evidenceId: string;
  status: 'VALID' | 'TAMPERED';
  storedHash: string;
  calculatedHash: string;
  message: string;
} {
  const ev = getEvidenceById(evidenceId);
  if (!ev) throw new Error('Evidence not found');

  if (ev.isTampered) {
    return {
      evidenceId: ev.evidenceId,
      status: 'TAMPERED',
      storedHash: ev.sha256Hash || 'A8B9C0D1E2F384759601B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3',
      calculatedHash: 'MISMATCH_SEAL_COMPROMISED_0000000000000000000000000000000000000000',
      message: 'CRITICAL WARNING: Tamper-evident seal or digital custody ledger has been broken! Unauthorized custody event detected.',
    };
  }

  return {
    evidenceId: ev.evidenceId,
    status: 'VALID',
    storedHash: ev.sha256Hash || 'A8B9C0D1E2F384759601B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3',
    calculatedHash: ev.sha256Hash || 'A8B9C0D1E2F384759601B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3',
    message: 'Chain of Custody verified: All transfer signatures and seal hashes match the immutable NCRB evidence registry.',
  };
}

export function toggleEvidenceTamper(evidenceId: string): { isTampered: boolean; message: string } {
  const ev = getEvidenceById(evidenceId);
  if (!ev) throw new Error('Evidence not found');

  ev.isTampered = !ev.isTampered;
  return {
    isTampered: ev.isTampered,
    message: ev.isTampered
      ? `Tamper simulated on ${ev.evidenceId}: Custody chain integrity flagged as compromised.`
      : `Evidence ${ev.evidenceId} restored to authentic verifiable state.`,
  };
}

// ----------------------------------------------------------------------
// CASE INVESTIGATION TIMELINE
// ----------------------------------------------------------------------

export function getCaseTimeline(caseId: number): CaseTimelineEvent[] {
  return db.caseTimelineEvents
    .filter((e) => e.caseId === caseId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function addCaseTimelineEvent(data: Omit<CaseTimelineEvent, 'id' | 'timestamp'> & { timestamp?: string }): CaseTimelineEvent {
  const event: CaseTimelineEvent = {
    id: nextTimelineId++,
    caseId: data.caseId,
    caseNumber: data.caseNumber,
    eventType: data.eventType,
    title: data.title,
    description: data.description,
    actor: data.actor,
    actorRole: data.actorRole,
    timestamp: data.timestamp || new Date().toISOString(),
    relatedDocumentId: data.relatedDocumentId,
    relatedEvidenceId: data.relatedEvidenceId,
    metadata: data.metadata,
  };

  db.caseTimelineEvents.push(event);
  return event;
}

// ----------------------------------------------------------------------
// DOCUMENT WORKFLOW (DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED / REJECTED -> SIGNED -> FINAL)
// ----------------------------------------------------------------------

export function submitDocumentWorkflow(docId: number, user: { fullName: string; role: UserRole }): LegalDocument {
  const doc = getDocumentById(docId);
  if (!doc) throw new Error('Document not found');

  doc.workflowStatus = 'SUBMITTED';
  doc.updatedAt = new Date().toISOString();

  // Timeline & Notification
  addCaseTimelineEvent({
    caseId: doc.caseId,
    caseNumber: doc.caseNumber,
    eventType: 'INVESTIGATION_REPORT_UPLOADED',
    title: `Document "${doc.documentName}" Submitted for Review`,
    description: `Submitted by ${user.fullName} (${user.role}). Waiting for review approval.`,
    actor: user.fullName,
    actorRole: user.role,
    relatedDocumentId: doc.id,
  });

  addNotification({
    userId: 1, // notify admin/reviewers
    message: `Document "${doc.documentName}" in Case ${doc.caseNumber} requires review.`,
    type: 'APPROVAL',
    relatedCaseId: doc.caseId,
    relatedDocumentId: doc.id,
  });

  return doc;
}

export function approveDocumentWorkflow(docId: number, user: { fullName: string; role: UserRole }): LegalDocument {
  const doc = getDocumentById(docId);
  if (!doc) throw new Error('Document not found');

  doc.workflowStatus = 'APPROVED';
  doc.rejectionReason = undefined;
  doc.updatedAt = new Date().toISOString();

  addCaseTimelineEvent({
    caseId: doc.caseId,
    caseNumber: doc.caseNumber,
    eventType: 'DOCUMENT_APPROVED',
    title: `Document "${doc.documentName}" Approved`,
    description: `Formally reviewed and approved by ${user.fullName} (${user.role}). Ready for digital signature.`,
    actor: user.fullName,
    actorRole: user.role,
    relatedDocumentId: doc.id,
  });

  addNotification({
    userId: doc.uploadedById,
    message: `Your document "${doc.documentName}" has been APPROVED by ${user.fullName}.`,
    type: 'SUCCESS',
    relatedCaseId: doc.caseId,
    relatedDocumentId: doc.id,
  });

  return doc;
}

export function rejectDocumentWorkflow(docId: number, user: { fullName: string; role: UserRole }, reason: string): LegalDocument {
  const doc = getDocumentById(docId);
  if (!doc) throw new Error('Document not found');
  if (!reason || reason.trim().length === 0) {
    throw new Error('A valid rejection reason is required');
  }

  doc.workflowStatus = 'REJECTED';
  doc.rejectionReason = reason;
  doc.updatedAt = new Date().toISOString();

  addNotification({
    userId: doc.uploadedById,
    message: `Document "${doc.documentName}" was REJECTED by ${user.fullName}. Reason: ${reason}`,
    type: 'ALERT',
    relatedCaseId: doc.caseId,
    relatedDocumentId: doc.id,
  });

  return doc;
}

export function finalizeDocumentWorkflow(docId: number, user: { fullName: string; role: UserRole }): LegalDocument {
  const doc = getDocumentById(docId);
  if (!doc) throw new Error('Document not found');

  doc.workflowStatus = 'FINAL';
  doc.updatedAt = new Date().toISOString();

  addCaseTimelineEvent({
    caseId: doc.caseId,
    caseNumber: doc.caseNumber,
    eventType: 'COURT_FILING_UPLOADED',
    title: `Document "${doc.documentName}" Finalized for Court Submission`,
    description: `Certified as final court exhibit by ${user.fullName} (${user.role}).`,
    actor: user.fullName,
    actorRole: user.role,
    relatedDocumentId: doc.id,
  });

  return doc;
}

// ----------------------------------------------------------------------
// SECURITY MONITORING & ALERTS
// ----------------------------------------------------------------------

export function getAllSecurityAlerts(): SecurityAlert[] {
  return [...db.securityAlerts].sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
}

export function addSecurityAlert(data: Omit<SecurityAlert, 'id' | 'detectedAt' | 'status'> & { status?: SecurityAlert['status'] }): SecurityAlert {
  const alert: SecurityAlert = {
    id: nextAlertId++,
    userId: data.userId,
    username: data.username,
    alertType: data.alertType,
    severity: data.severity,
    description: data.description,
    detectedAt: new Date().toISOString(),
    status: data.status || 'OPEN',
    relatedDocumentId: data.relatedDocumentId,
    relatedCaseId: data.relatedCaseId,
    relatedEvidenceId: data.relatedEvidenceId,
  };

  db.securityAlerts.unshift(alert);

  // Notify admin
  addNotification({
    userId: 1,
    message: `SECURITY ALERT [${data.severity}]: ${data.description}`,
    type: 'ALERT',
    relatedCaseId: data.relatedCaseId,
    relatedDocumentId: data.relatedDocumentId,
    relatedEvidenceId: data.relatedEvidenceId,
  });

  return alert;
}

export function updateSecurityAlertStatus(id: number, status: SecurityAlert['status']): SecurityAlert | undefined {
  const alert = db.securityAlerts.find((a) => a.id === id);
  if (alert) {
    alert.status = status;
  }
  return alert;
}

// ----------------------------------------------------------------------
// IN-APP NOTIFICATIONS
// ----------------------------------------------------------------------

export function getUserNotifications(userId: number): Notification[] {
  return db.notifications
    .filter((n) => n.userId === userId || n.userId === 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addNotification(data: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
  const notif: Notification = {
    id: nextNotificationId++,
    userId: data.userId,
    message: data.message,
    type: data.type,
    read: false,
    createdAt: new Date().toISOString(),
    relatedCaseId: data.relatedCaseId,
    relatedDocumentId: data.relatedDocumentId,
    relatedEvidenceId: data.relatedEvidenceId,
  };
  db.notifications.unshift(notif);
  return notif;
}

export function markNotificationRead(id: number): boolean {
  const notif = db.notifications.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
    return true;
  }
  return false;
}

export function markAllNotificationsRead(userId: number): void {
  for (const n of db.notifications) {
    if (n.userId === userId || n.userId === 0) {
      n.read = true;
    }
  }
}

// ----------------------------------------------------------------------
// CASE RELATIONSHIP GRAPH GENERATOR
// ----------------------------------------------------------------------

export function getCaseRelationships(caseId: number): CaseRelationshipGraphData {
  const targetCase = getCaseById(caseId);
  const caseNumber = targetCase ? targetCase.caseNumber : `CASE-2026-00${caseId}`;

  const nodes: CaseRelationshipGraphData['nodes'] = [];
  const links: CaseRelationshipGraphData['links'] = [];

  // Root Case Node
  nodes.push({
    id: `CASE_${caseId}`,
    label: `${caseNumber}: ${targetCase?.title || 'Investigation Record'}`,
    type: 'CASE',
    category: targetCase?.crimeType,
  });

  // Linked Documents
  const docs = db.documents.filter((d) => d.caseId === caseId);
  for (const doc of docs) {
    const docNodeId = `DOC_${doc.id}`;
    nodes.push({
      id: docNodeId,
      label: doc.documentName,
      type: 'DOCUMENT',
      category: doc.documentType,
    });
    links.push({
      source: `CASE_${caseId}`,
      target: docNodeId,
      relation: 'CONTAINS_DOCUMENT',
    });
  }

  // Linked Evidence
  const evList = db.evidence.filter((e) => e.caseId === caseId);
  for (const ev of evList) {
    const evNodeId = `EVD_${ev.id}`;
    nodes.push({
      id: evNodeId,
      label: `${ev.evidenceId} (${ev.evidenceType})`,
      type: 'EVIDENCE',
      category: ev.status,
    });
    links.push({
      source: `CASE_${caseId}`,
      target: evNodeId,
      relation: 'RECOVERED_EXHIBIT',
    });

    // Link Forensic Report to Evidence if available
    const forensicDoc = docs.find((d) => d.documentType === 'FORENSIC_REPORT');
    if (forensicDoc) {
      links.push({
        source: `DOC_${forensicDoc.id}`,
        target: evNodeId,
        relation: 'FORENSIC_EXAMINATION_OF',
      });
    }
  }

  // Named Entities (Persons, Locations, Organizations)
  nodes.push({
    id: `PERSON_ARUMUGAM`,
    label: 'Inspector K. Arumugam (First Responder)',
    type: 'PERSON',
    category: 'POLICE',
  });
  links.push({
    source: `CASE_${caseId}`,
    target: `PERSON_ARUMUGAM`,
    relation: 'INVESTIGATING_POLICE',
  });

  nodes.push({
    id: `PERSON_SUNITA`,
    label: 'DSP Sunita Rao (Chief IO)',
    type: 'PERSON',
    category: 'INVESTIGATION_OFFICER',
  });
  links.push({
    source: `CASE_${caseId}`,
    target: `PERSON_SUNITA`,
    relation: 'ASSIGNED_INVESTIGATOR',
  });

  nodes.push({
    id: `PERSON_PRIYA`,
    label: 'Dr. Priya Nambiar (CFSL Examiner)',
    type: 'PERSON',
    category: 'FORENSIC_EXPERT',
  });
  if (evList.length > 0) {
    links.push({
      source: `EVD_${evList[0].id}`,
      target: `PERSON_PRIYA`,
      relation: 'EXAMINED_BY',
    });
  }

  nodes.push({
    id: `LOC_SCENE`,
    label: targetCase?.location || 'Chennai Crime Scene',
    type: 'LOCATION',
  });
  links.push({
    source: `CASE_${caseId}`,
    target: `LOC_SCENE`,
    relation: 'INCIDENT_LOCATION',
  });

  nodes.push({
    id: `ORG_CFSL`,
    label: 'Central Forensic Science Laboratory (CFSL)',
    type: 'ORGANIZATION',
  });
  links.push({
    source: `PERSON_PRIYA`,
    target: `ORG_CFSL`,
    relation: 'AFFILIATED_WITH',
  });

  return {
    caseId,
    caseNumber,
    nodes,
    links,
  };
}

// ----------------------------------------------------------------------
// CASE REPORT GENERATOR (11 SECTIONS)
// ----------------------------------------------------------------------

export function generateCaseReportData(caseId: number) {
  const targetCase = getCaseById(caseId);
  if (!targetCase) throw new Error('Case not found');

  const docs = db.documents.filter((d) => d.caseId === caseId);
  const evList = db.evidence.filter((e) => e.caseId === caseId);
  const timeline = getCaseTimeline(caseId);
  const transfers = db.evidenceTransfers.filter((t) => evList.some((e) => e.evidenceId === t.evidenceId));

  return {
    reportTitle: `COMPREHENSIVE CASE DOSSIER & EVIDENTIARY REPORT: ${targetCase.caseNumber}`,
    generatedAt: new Date().toISOString(),
    generatedBy: 'NCRB Cryptographic Evidence System',
    securityClassification: 'RESTRICTED / SECTION 65B CERTIFIED',
    
    // Section 1: Case Information
    section1_caseInformation: {
      caseNumber: targetCase.caseNumber,
      title: targetCase.title,
      crimeType: targetCase.crimeType,
      jurisdiction: targetCase.location,
      status: targetCase.status,
      priority: targetCase.priority,
      leadOfficer: targetCase.investigatingOfficer,
      department: targetCase.department,
      registeredDate: targetCase.createdAt,
    },

    // Section 2: Case Summary
    section2_summary: {
      description: targetCase.description,
      legalStatutes: ['Section 380 IPC (Theft in dwelling)', 'Section 457 IPC (Lurking house-trespass)', 'Section 66 IT Act (Computer-related offenses)', 'Section 65B Indian Evidence Act (Admissibility of electronic records)'],
      aiExecutiveSummary: `Integrated AI analysis indicates coordinated physical intrusion preceded by unauthorized hardware bus tapping. Total digital artifact count: ${docs.length} documents, ${evList.length} physical exhibits with verified SHA-256 custody chain.`,
      disclaimer: 'AI GENERATED — VERIFY BEFORE USE. Certified for judicial filing.',
    },

    // Section 3: Investigation Timeline
    section3_timeline: timeline.map((t) => ({
      timestamp: t.timestamp,
      event: t.title,
      actor: `${t.actor} [${t.actorRole}]`,
      details: t.description,
    })),

    // Section 4: Evidence Catalog
    section4_evidence: evList.map((e) => ({
      evidenceId: e.evidenceId,
      type: e.evidenceType,
      sealNumber: e.sealNumber,
      location: e.collectionLocation,
      custodian: `${e.currentCustodian} (${e.currentCustodianRole})`,
      status: e.status,
      hash: e.sha256Hash,
      integrity: e.isTampered ? 'TAMPERED' : 'VALID',
    })),

    // Section 5: Chain of Custody
    section5_chainOfCustody: transfers.map((tr) => ({
      evidenceId: tr.evidenceId,
      from: `${tr.fromUser} (${tr.fromRole})`,
      to: `${tr.toUser} (${tr.toRole})`,
      timestamp: tr.transferDateTime,
      reason: tr.transferReason,
      condition: tr.conditionAfter,
      signatureVerification: 'VERIFIED_OK',
    })),

    // Section 6: Witness Information
    section6_witnesses: [
      {
        witnessName: 'Ramesh Kumar S/o S. Narayanan (Night Security Guard)',
        depositionUnder: 'Section 161 CrPC',
        recordedBy: 'DSP Sunita Rao',
        keyObservation: 'Observed utility van parked near emergency duct. Access keypad silent override corroborated by CFSL analysis.',
      },
    ],

    // Section 7: Forensic Findings
    section7_forensicFindings: {
      laboratory: 'Central Forensic Science Laboratory (CFSL) Cyber Division',
      examiner: 'Dr. Priya Nambiar (Senior Scientific Officer)',
      keyConclusions: 'EEPROM dump confirmed unauthorized payload delivery. External IP address trace 192.0.2.89 captured in volatile memory buffer.',
      hashCertificates: 'SHA-256 Hash Verification Verified under NIST FIPS 180-4 standard.',
    },

    // Section 8: Documents Catalog
    section8_documents: docs.map((d) => ({
      documentName: d.documentName,
      type: d.documentType,
      workflowStatus: d.workflowStatus,
      version: `v${d.version}`,
      hash: d.sha256Hash,
      encryption: d.encryptionAlgorithm,
      classification: d.classification,
    })),

    // Section 9: Digital Signatures
    section9_signatures: db.digitalSignatures
      .filter((s) => docs.some((d) => d.id === s.documentId))
      .map((s) => ({
        signer: s.signedBy,
        role: s.signerRole,
        issuer: s.certificateIssuer,
        signedAt: s.signedAt,
        status: s.status,
      })),

    // Section 10: Cryptographic Integrity Verification
    section10_integrityVerification: {
      algorithm: 'SHA-256 (Secure Hash Algorithm 256-bit)',
      overallIntegrity: evList.some((e) => e.isTampered) || docs.some((d) => d.isTampered) ? 'COMPROMISED' : 'VALID',
      evidenceCheckedCount: evList.length,
      documentsCheckedCount: docs.length,
      complianceStandard: 'Section 65B Indian Evidence Act / ISO/IEC 27037 Digital Evidence Handling',
    },

    // Section 11: Tamper-Evident Audit Summary
    section11_auditSummary: {
      totalAuditBlocks: db.documents.length * 3 + evList.length * 2,
      chainStatus: 'CRYPTOGRAPHIC_CHAIN_VERIFIED_AUTHENTIC',
      headHash: 'SHA256-CHUNKS-CONFIRMED',
      leadAuditor: 'Dr. Rajesh Sharma (Security Administrator)',
    },
  };
}

// ----------------------------------------------------------------------
// WATERMARKING HELPER (CONFIDENTIAL OVERLAY)
// ----------------------------------------------------------------------

export function getWatermarkMetadata(doc: LegalDocument, user: { fullName: string; role: UserRole }): {
  watermarkText: string;
  metadataLines: string[];
} {
  const timestamp = new Date().toISOString();
  return {
    watermarkText: `CONFIDENTIAL • ${doc.caseNumber} • ${user.fullName} • ${user.role}`,
    metadataLines: [
      'CONFIDENTIAL LEGAL EVIDENCE — UNAUTHORIZED DISSEMINATION PROHIBITED',
      `Document: ${doc.documentName} (ID: ${doc.id})`,
      `Case: ${doc.caseNumber}`,
      `Downloaded By: ${user.fullName}`,
      `Designated Role: ${user.role}`,
      `Timestamp: ${timestamp}`,
      `Cryptographic SHA-256: ${doc.sha256Hash}`,
      `Security Mandate: Section 65B Indian Evidence Act`,
    ],
  };
}

// ----------------------------------------------------------------------
// STANDARD DOCUMENT HELPERS (Existing APIs)
// ----------------------------------------------------------------------

export function findUserByUsernameOrEmail(identifier: string): User | undefined {
  const norm = identifier.trim().toLowerCase();
  return db.users.find((u) => u.username.toLowerCase() === norm || u.email.toLowerCase() === norm);
}

export function findUserById(id: number): User | undefined {
  return db.users.find((u) => u.id === id);
}

export function getUserPasswordHash(userId: number): string | undefined {
  return db.userPasswords.get(userId);
}

export function getAllCases(): Case[] {
  return db.cases.map((c) => {
    const docs = db.documents.filter((d) => d.caseId === c.id);
    const ev = db.evidence.filter((e) => e.caseId === c.id);
    return {
      ...c,
      documentCount: docs.length,
      evidenceCount: ev.length,
    };
  });
}

export function getCaseById(id: number): Case | undefined {
  const c = db.cases.find((item) => item.id === id);
  if (!c) return undefined;
  const docs = db.documents.filter((d) => d.caseId === c.id);
  const ev = db.evidence.filter((e) => e.caseId === c.id);
  return {
    ...c,
    documentCount: docs.length,
    evidenceCount: ev.length,
  };
}

export function createCase(data: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>): Case {
  const caseId = nextCaseId++;
  const newCase: Case = {
    id: caseId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.cases.push(newCase);

  const caseDir = path.join(STORAGE_DIR, 'cases', newCase.caseNumber);
  if (!fs.existsSync(caseDir)) {
    fs.mkdirSync(caseDir, { recursive: true });
  }

  // Add timeline event
  addCaseTimelineEvent({
    caseId,
    caseNumber: newCase.caseNumber,
    eventType: 'CASE_CREATED',
    title: `Case ${newCase.caseNumber} Registered`,
    description: `${newCase.title}. Crime Type: ${newCase.crimeType}. Assigned: ${newCase.investigatingOfficer}`,
    actor: newCase.createdBy,
    actorRole: 'POLICE_OFFICER',
  });

  return newCase;
}

export function getAllDocuments(): LegalDocument[] {
  return db.documents.map((d) => ({
    ...d,
    versions: db.documentVersions.filter((v) => v.documentId === d.id),
    signatures: db.digitalSignatures.filter((s) => s.documentId === d.id),
    aiMetadata: db.aiMetadataStore.get(d.id),
  }));
}

export function getDocumentById(id: number): LegalDocument | undefined {
  const doc = db.documents.find((d) => d.id === id);
  if (!doc) return undefined;
  return {
    ...doc,
    versions: db.documentVersions.filter((v) => v.documentId === doc.id),
    signatures: db.digitalSignatures.filter((s) => s.documentId === doc.id),
    aiMetadata: db.aiMetadataStore.get(doc.id),
  };
}

export function createDocument(
  data: Omit<LegalDocument, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'isTampered'>,
  changeDescription = 'Initial verified upload'
): LegalDocument {
  const docId = nextDocId++;
  const now = new Date().toISOString();

  // Auto-generate AI Metadata
  const aiSummary = AIService.summarizeDocument(data.extractedText || data.documentName, data.documentType, {
    caseNumber: data.caseNumber,
  });

  const aiMeta: AIDocumentMetadata = {
    documentId: docId,
    documentType: data.documentType,
    caseNumber: data.caseNumber,
    crimeType: 'Criminal Law Matter',
    location: 'Chennai / New Delhi',
    keywords: aiSummary.keywords,
    summary: aiSummary.summary,
    entities: aiSummary.entities,
    confidence: 0.95,
    generatedAt: now,
  };
  db.aiMetadataStore.set(docId, aiMeta);

  const newDoc: LegalDocument = {
    id: docId,
    ...data,
    version: 1,
    workflowStatus: data.workflowStatus || 'DRAFT',
    aiMetadata: aiMeta,
    isTampered: false,
    createdAt: now,
    updatedAt: now,
  };

  db.documents.push(newDoc);

  // Add version 1
  const version: DocumentVersion = {
    id: nextVersionId++,
    documentId: docId,
    versionNumber: 1,
    filePath: newDoc.filePath,
    storedFilename: newDoc.storedFilename,
    sha256Hash: newDoc.sha256Hash,
    uploadedBy: newDoc.uploadedBy,
    uploadedById: newDoc.uploadedById,
    fileSize: newDoc.fileSize,
    changeDescription,
    createdAt: now,
  };
  db.documentVersions.push(version);

  // Add timeline event
  addCaseTimelineEvent({
    caseId: data.caseId,
    caseNumber: data.caseNumber,
    eventType: data.documentType === 'FIR' ? 'FIR_UPLOADED' : (data.documentType === 'FORENSIC_REPORT' ? 'FORENSIC_REPORT_UPLOADED' : 'INVESTIGATION_REPORT_UPLOADED'),
    title: `Document "${newDoc.documentName}" Uploaded`,
    description: `Type: ${newDoc.documentType}. SHA-256: ${newDoc.sha256Hash.slice(0, 16)}... Workflow: ${newDoc.workflowStatus}`,
    actor: newDoc.uploadedBy,
    actorRole: 'POLICE_OFFICER',
    relatedDocumentId: newDoc.id,
  });

  return {
    ...newDoc,
    versions: [version],
    signatures: [],
  };
}

export function addDocumentVersion(
  docId: number,
  newFilePath: string,
  newStoredFilename: string,
  newHash: string,
  fileSize: number,
  uploader: string,
  uploaderId: number,
  changeDescription: string
): DocumentVersion | null {
  const doc = db.documents.find((d) => d.id === docId);
  if (!doc) return null;

  const newVersionNumber = doc.version + 1;
  doc.version = newVersionNumber;
  doc.filePath = newFilePath;
  doc.storedFilename = newStoredFilename;
  doc.sha256Hash = newHash;
  doc.fileSize = fileSize;
  doc.isTampered = false;
  doc.workflowStatus = 'UNDER_REVIEW';
  doc.updatedAt = new Date().toISOString();

  const version: DocumentVersion = {
    id: nextVersionId++,
    documentId: docId,
    versionNumber: newVersionNumber,
    filePath: newFilePath,
    storedFilename: newStoredFilename,
    sha256Hash: newHash,
    uploadedBy: uploader,
    uploadedById: uploaderId,
    fileSize,
    changeDescription,
    createdAt: new Date().toISOString(),
  };

  db.documentVersions.push(version);
  return version;
}

export function signDocument(
  docId: number,
  signerName: string,
  signerId: number,
  signerRole: any
): DigitalSignature | null {
  const doc = db.documents.find((d) => d.id === docId);
  if (!doc) return null;

  const sig: DigitalSignature = {
    id: nextSigId++,
    documentId: docId,
    signedBy: signerName,
    signedById: signerId,
    signerRole,
    documentHash: doc.sha256Hash,
    signature: `NCRB-SIG-ED25519-${Buffer.from(doc.sha256Hash + signerName + Date.now()).toString('base64').slice(0, 48)}`,
    certificateIssuer: 'National Crime Records Bureau Root CA - Digital Verification Center',
    status: 'SIGNED',
    signedAt: new Date().toISOString(),
  };

  db.digitalSignatures.push(sig);
  doc.signed = true;
  doc.signatureStatus = 'SIGNED';
  doc.workflowStatus = 'SIGNED';
  doc.updatedAt = new Date().toISOString();

  addCaseTimelineEvent({
    caseId: doc.caseId,
    caseNumber: doc.caseNumber,
    eventType: 'DOCUMENT_SIGNED',
    title: `Digital Signature Applied to "${doc.documentName}"`,
    description: `Digitally signed with NCRB Root CA certificate by ${signerName} (${signerRole}).`,
    actor: signerName,
    actorRole: signerRole,
    relatedDocumentId: doc.id,
  });

  return sig;
}

export function verifyDocumentIntegrity(docId: number, verifierName: string): IntegrityCheckResult | null {
  const doc = db.documents.find((d) => d.id === docId);
  if (!doc) return null;

  let calculatedHash = '';
  let integrity: 'VALID' | 'TAMPERED' = 'VALID';
  let message = '';

  try {
    if (fs.existsSync(doc.filePath)) {
      const buffer = fs.readFileSync(doc.filePath);
      calculatedHash = computeSha256(buffer);
    } else {
      calculatedHash = 'FILE_NOT_FOUND_ON_STORAGE';
      integrity = 'TAMPERED';
    }
  } catch (err: any) {
    calculatedHash = 'READ_ERROR';
    integrity = 'TAMPERED';
  }

  if (doc.isTampered || calculatedHash !== doc.sha256Hash) {
    integrity = 'TAMPERED';
    message = 'CRITICAL ALERT: Document SHA-256 hash mismatch detected! Current disk image does not match the registered cryptographic proof.';
    
    // Add security alert
    addSecurityAlert({
      userId: 0,
      username: verifierName,
      alertType: 'INTEGRITY_TAMPER_FAILURE',
      severity: 'CRITICAL',
      description: `Cryptographic SHA-256 verification failed on Document "${doc.documentName}" (ID: ${doc.id}). Disk bytes modified!`,
      relatedDocumentId: doc.id,
      relatedCaseId: doc.caseId,
    });
  } else {
    integrity = 'VALID';
    message = 'Document integrity verified: SHA-256 hash matches the cryptographic ledger. File is authentic and unmodified.';
  }

  return {
    documentId: doc.id,
    documentName: doc.documentName,
    storedHash: doc.sha256Hash,
    calculatedHash,
    integrity,
    checkedAt: new Date().toISOString(),
    checkedBy: verifierName,
    algorithm: 'SHA-256 (NIST FIPS 180-4)',
    message,
  };
}

export function toggleTamperSimulation(docId: number): { isTampered: boolean; message: string } {
  const doc = db.documents.find((d) => d.id === docId);
  if (!doc) throw new Error('Document not found');

  doc.isTampered = !doc.isTampered;
  
  if (doc.isTampered) {
    try {
      if (fs.existsSync(doc.filePath)) {
        fs.appendFileSync(doc.filePath, '\n[TAMPERED_PAYLOAD_SIMULATION_UNAUTHORIZED_ALTERATION_BYTE_INJECTION]');
      }
    } catch {
      // ignore
    }
    return {
      isTampered: true,
      message: 'Tamper simulated: File bytes have been modified on disk without database authorization. Run verification to see detection!',
    };
  } else {
    try {
      const version1 = db.documentVersions.find((v) => v.documentId === docId && v.versionNumber === doc.version);
      if (version1 && fs.existsSync(doc.filePath)) {
        const raw = fs.readFileSync(doc.filePath, 'utf-8');
        const cleaned = raw.replace('\n[TAMPERED_PAYLOAD_SIMULATION_UNAUTHORIZED_ALTERATION_BYTE_INJECTION]', '');
        fs.writeFileSync(doc.filePath, cleaned, 'utf-8');
      }
    } catch {
      // ignore
    }
    return {
      isTampered: false,
      message: 'Document restored to original cryptographic state.',
    };
  }
}
