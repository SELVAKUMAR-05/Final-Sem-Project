export type UserRole = 
  | 'ADMIN' 
  | 'POLICE_OFFICER' 
  | 'INVESTIGATION_OFFICER' 
  | 'FORENSIC_OFFICER' 
  | 'LAWYER' 
  | 'COURT_OFFICER';

export type CaseStatus = 
  | 'UNDER_INVESTIGATION' 
  | 'PENDING_REVIEW' 
  | 'CHARGE_SHEET_FILED' 
  | 'IN_COURT' 
  | 'CLOSED';

export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DocumentType = 
  | 'FIR'
  | 'POLICE_REPORT'
  | 'INVESTIGATION_REPORT'
  | 'WITNESS_STATEMENT'
  | 'CHARGE_SHEET'
  | 'COURT_FILING'
  | 'EVIDENCE'
  | 'FORENSIC_REPORT'
  | 'LEGAL_NOTICE'
  | 'JUDGMENT'
  | 'OTHER';

export type WorkflowStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SIGNED'
  | 'FINAL';

export type EvidenceStatus = 
  | 'COLLECTED'
  | 'SEALED'
  | 'STORED'
  | 'TRANSFERRED'
  | 'RECEIVED'
  | 'UNDER_FORENSIC_EXAMINATION'
  | 'RETURNED'
  | 'RELEASED'
  | 'PRESENTED_IN_COURT';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  department: string;
  badgeNumber?: string;
  active: boolean;
  createdAt: string;
}

export interface Case {
  id: number;
  caseNumber: string;
  title: string;
  crimeType: string;
  description: string;
  location: string;
  status: CaseStatus;
  priority: CasePriority;
  investigatingOfficer: string;
  department: string;
  createdBy: string;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  documentCount?: number;
  evidenceCount?: number;
}

export interface DocumentVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  filePath: string;
  storedFilename: string;
  sha256Hash: string;
  uploadedBy: string;
  uploadedById: number;
  fileSize: number;
  changeDescription: string;
  createdAt: string;
}

export interface DigitalSignature {
  id: number;
  documentId: number;
  signedBy: string;
  signedById: number;
  signerRole: UserRole;
  documentHash: string;
  signature: string;
  certificateIssuer: string;
  status: 'SIGNED' | 'NOT_SIGNED' | 'SIGNATURE_INVALID';
  signedAt: string;
}

export interface AIDocumentMetadata {
  documentId: number;
  documentType: DocumentType;
  caseNumber: string;
  crimeType: string;
  location: string;
  keywords: string[];
  summary: string;
  entities: {
    persons: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
    lawsOrSections: string[];
  };
  confidence: number;
  generatedAt: string;
}

export interface LegalDocument {
  id: number;
  caseId: number;
  caseNumber: string;
  documentName: string;
  documentType: DocumentType;
  originalFilename: string;
  storedFilename: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  sha256Hash: string;
  version: number;
  uploadedBy: string;
  uploadedById: number;
  encrypted: boolean;
  encryptionAlgorithm: string;
  signed: boolean;
  signatureStatus: 'SIGNED' | 'NOT_SIGNED' | 'SIGNATURE_INVALID';
  workflowStatus: WorkflowStatus;
  rejectionReason?: string;
  currentStatus: 'ACTIVE' | 'ARCHIVED' | 'SEALED';
  classification: 'CONFIDENTIAL' | 'RESTRICTED' | 'PUBLIC_RECORD';
  extractedText?: string;
  ocrExtracted: boolean;
  aiMetadata?: AIDocumentMetadata;
  isTampered?: boolean;
  createdAt: string;
  updatedAt: string;
  versions?: DocumentVersion[];
  signatures?: DigitalSignature[];
}

export interface Evidence {
  id: number;
  evidenceId: string; // e.g. EVD-2026-0042
  caseId: number;
  caseNumber: string;
  evidenceType: string; // e.g. Mobile Phone, Hard Drive, Weapon, Document, Blood Sample, Currency
  description: string;
  collectedBy: string;
  collectedById: number;
  collectionLocation: string;
  collectionDateTime: string;
  currentCustodian: string;
  currentCustodianRole: UserRole;
  status: EvidenceStatus;
  sealNumber: string;
  condition: string;
  sha256Hash?: string;
  isTampered?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceTransfer {
  id: number;
  evidenceId: string;
  evidenceRecordId: number;
  fromUser: string;
  fromRole: UserRole;
  toUser: string;
  toRole: UserRole;
  transferReason: string;
  transferDateTime: string;
  location: string;
  conditionBefore: string;
  conditionAfter: string;
  signature: string;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface CaseTimelineEvent {
  id: number;
  caseId: number;
  caseNumber: string;
  eventType: 
    | 'CASE_CREATED'
    | 'OFFICER_ASSIGNED'
    | 'FIR_UPLOADED'
    | 'INVESTIGATION_REPORT_UPLOADED'
    | 'WITNESS_STATEMENT_UPLOADED'
    | 'EVIDENCE_ADDED'
    | 'EVIDENCE_TRANSFERRED'
    | 'FORENSIC_REPORT_UPLOADED'
    | 'DOCUMENT_SIGNED'
    | 'DOCUMENT_APPROVED'
    | 'COURT_FILING_UPLOADED'
    | 'JUDGMENT_UPLOADED'
    | 'CASE_STATUS_CHANGED';
  title: string;
  description: string;
  actor: string;
  actorRole: UserRole;
  timestamp: string;
  relatedDocumentId?: number;
  relatedEvidenceId?: string;
  metadata?: Record<string, any>;
}

export interface AuditLog {
  id: number;
  userId: number;
  username: string;
  role: UserRole;
  action: 
    | 'LOGIN'
    | 'LOGOUT'
    | 'CASE_CREATED'
    | 'CASE_UPDATED'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_VIEWED'
    | 'DOCUMENT_DOWNLOADED'
    | 'DOCUMENT_UPDATED'
    | 'DOCUMENT_DELETED'
    | 'DOCUMENT_SHARED'
    | 'DOCUMENT_VERIFIED'
    | 'DOCUMENT_SIGNED'
    | 'DOCUMENT_SUBMITTED'
    | 'DOCUMENT_APPROVED'
    | 'DOCUMENT_REJECTED'
    | 'DOCUMENT_FINALIZED'
    | 'EVIDENCE_COLLECTED'
    | 'EVIDENCE_SEALED'
    | 'EVIDENCE_TRANSFERRED'
    | 'EVIDENCE_RECEIVED'
    | 'USER_CREATED'
    | 'USER_DELETED'
    | 'USER_DISABLED'
    | 'PROFILE_PHOTO_UPDATED'
    | 'PERMISSION_CHANGED'
    | 'UNAUTHORIZED_ACCESS_ATTEMPT'
    | 'TAMPER_SIMULATION'
    | 'AUDIT_VERIFIED'
    | 'INTEGRITY_VERIFIED'
    | 'CASE_REPORT_GENERATED'
    | 'AI_ASSISTANT_QUERY';
  documentId?: number;
  documentName?: string;
  caseId?: number;
  caseNumber?: string;
  evidenceId?: string;
  ipAddress: string;
  description: string;
  status: 'SUCCESS' | 'DENIED' | 'FLAGGED';
  previousLogHash: string;
  currentLogHash: string;
  createdAt: string;
}

export interface SecurityAlert {
  id: number;
  userId: number;
  username: string;
  alertType: 
    | 'MULTIPLE_FAILED_LOGINS'
    | 'RAPID_DOWNLOADS'
    | 'REPEATED_ACCESS_DENIED'
    | 'UNUSUAL_DOCUMENT_ACCESS'
    | 'INTEGRITY_TAMPER_FAILURE'
    | 'UNAUTHORIZED_TRANSFER_ATTEMPT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detectedAt: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  relatedDocumentId?: number;
  relatedCaseId?: number;
  relatedEvidenceId?: string;
}

export interface Notification {
  id: number;
  userId: number;
  title?: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'APPROVAL' | 'SUCCESS';
  read: boolean;
  actionUrl?: string;
  createdAt: string;
  relatedCaseId?: number;
  relatedDocumentId?: number;
  relatedEvidenceId?: string;
}

export interface CaseRelationshipNode {
  id: string;
  label: string;
  type: 'CASE' | 'DOCUMENT' | 'EVIDENCE' | 'PERSON' | 'LOCATION' | 'VEHICLE' | 'ORGANIZATION';
  category?: string;
  properties?: Record<string, any>;
  metadata?: Record<string, string>;
}

export interface CaseRelationshipLink {
  source: string;
  target: string;
  relation?: string;
  label?: string;
}

export interface CaseRelationshipGraphData {
  caseId: number;
  caseNumber: string;
  nodes: CaseRelationshipNode[];
  links?: CaseRelationshipLink[];
  edges?: CaseRelationshipLink[];
}

export interface IntegrityCheckResult {
  documentId: number;
  documentName: string;
  storedHash: string;
  calculatedHash: string;
  integrity: 'VALID' | 'TAMPERED';
  checkedAt: string;
  checkedBy: string;
  algorithm: string;
  message: string;
}

export interface AuditVerificationResult {
  integrity: 'VALID' | 'COMPROMISED';
  isValid?: boolean;
  status?: string;
  totalLogs?: number;
  totalVerified: number;
  brokenLogId?: number;
  brokenRecordId?: number;
  brokenAt?: string;
  message: string;
  verifiedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalCases: number;
  totalDocuments: number;
  totalEvidence: number;
  documentsUploadedToday: number;
  verifiedDocuments: number;
  pendingReviews: number;
  activeInvestigations: number;
  auditLogsCount: number;
  securityAlertsCount: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  evidenceSecurity: {
    total: number;
    valid: number;
    tampered: number;
    underExamination: number;
    transferred: number;
    pendingTransfer: number;
  };
  casesByStatus: Record<string, number>;
  docsByType: Record<string, number>;
  recentActivities: AuditLog[];
}
