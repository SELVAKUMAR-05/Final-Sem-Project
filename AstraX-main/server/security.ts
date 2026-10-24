import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { UserRole, DocumentType } from '../src/types.ts';
import { UPLOADABLE_DOCUMENT_TYPES } from '../src/documentPermissions.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'ncrb-secure-legal-dms-mha-secret-key-2026';
const ENCRYPTION_KEY = process.env.DOCUMENT_ENCRYPTION_KEY || 'ncrb-aes256-evidence-enc-key-32b!'; // 32 chars

// Hash password using PBKDF2
export function hashPassword(password: string): string {
  const salt = 'ncrb-legal-salt-2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash || password === hash;
}

// JWT Token operations
export interface JWTPayload {
  userId: number;
  username: string;
  role: UserRole;
  fullName: string;
  department: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// SHA-256 file hashing
export function computeSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

// AES-256-CBC Encryption & Decryption
const IV_LENGTH = 16;

export function encryptBuffer(buffer: Buffer): { encrypted: Buffer; iv: string } {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return {
    encrypted,
    iv: iv.toString('hex'),
  };
}

export function decryptBuffer(encryptedBuffer: Buffer, ivHex: string): Buffer {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

// Role-Based Access Control Rules
export const ROLE_PERMISSIONS: Record<UserRole, {
  canCreateCase: boolean;
  canViewAllCases: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  canUploadDocTypes: DocumentType[];
  canViewDocTypes: DocumentType[] | 'ALL';
  canSignDocuments: boolean;
  canVerifyIntegrity: boolean;
}> = {
  ADMIN: {
    canCreateCase: true,
    canViewAllCases: true,
    canManageUsers: true,
    canViewAuditLogs: true,
    canUploadDocTypes: UPLOADABLE_DOCUMENT_TYPES.ADMIN,
    canViewDocTypes: 'ALL',
    canSignDocuments: true,
    canVerifyIntegrity: true,
  },
  POLICE_OFFICER: {
    canCreateCase: true,
    canViewAllCases: false, // only assigned or standard
    canManageUsers: false,
    canViewAuditLogs: false,
    canUploadDocTypes: UPLOADABLE_DOCUMENT_TYPES.POLICE_OFFICER,
    canViewDocTypes: ['FIR', 'POLICE_REPORT', 'INVESTIGATION_REPORT', 'WITNESS_STATEMENT', 'CHARGE_SHEET', 'EVIDENCE', 'FORENSIC_REPORT', 'LEGAL_NOTICE', 'OTHER'],
    canSignDocuments: true,
    canVerifyIntegrity: true,
  },
  INVESTIGATION_OFFICER: {
    canCreateCase: true,
    canViewAllCases: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canUploadDocTypes: UPLOADABLE_DOCUMENT_TYPES.INVESTIGATION_OFFICER,
    canViewDocTypes: ['FIR', 'POLICE_REPORT', 'INVESTIGATION_REPORT', 'WITNESS_STATEMENT', 'CHARGE_SHEET', 'EVIDENCE', 'FORENSIC_REPORT', 'COURT_FILING', 'LEGAL_NOTICE', 'JUDGMENT', 'OTHER'],
    canSignDocuments: true,
    canVerifyIntegrity: true,
  },
  FORENSIC_OFFICER: {
    canCreateCase: false,
    canViewAllCases: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canUploadDocTypes: UPLOADABLE_DOCUMENT_TYPES.FORENSIC_OFFICER,
    canViewDocTypes: ['FIR', 'EVIDENCE', 'FORENSIC_REPORT', 'POLICE_REPORT', 'INVESTIGATION_REPORT', 'OTHER'],
    canSignDocuments: true,
    canVerifyIntegrity: true,
  },
  LAWYER: {
    canCreateCase: false,
    canViewAllCases: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canUploadDocTypes: UPLOADABLE_DOCUMENT_TYPES.LAWYER,
    // Lawyer CANNOT view raw internal POLICE_REPORT, classified EVIDENCE, or unfiled INVESTIGATION_REPORT
    canViewDocTypes: ['FIR', 'CHARGE_SHEET', 'COURT_FILING', 'LEGAL_NOTICE', 'JUDGMENT', 'OTHER'],
    canSignDocuments: false,
    canVerifyIntegrity: true,
  },
  COURT_OFFICER: {
    canCreateCase: false,
    canViewAllCases: true,
    canManageUsers: false,
    canViewAuditLogs: false,
    canUploadDocTypes: UPLOADABLE_DOCUMENT_TYPES.COURT_OFFICER,
    canViewDocTypes: 'ALL',
    canSignDocuments: true,
    canVerifyIntegrity: true,
  },
};

export function canUserViewDocument(role: UserRole, docType: DocumentType, classification: string): boolean {
  if (role === 'ADMIN') return true;
  
  // Restricted confidential docs cannot be seen by LAWYER unless permitted
  if (role === 'LAWYER') {
    if (classification === 'CONFIDENTIAL' && docType === 'FORENSIC_REPORT') return false;
    if (docType === 'POLICE_REPORT' || docType === 'EVIDENCE') return false;
  }

  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.canViewDocTypes === 'ALL') return true;
  return perms.canViewDocTypes.includes(docType);
}

export function canUserUploadDocument(role: UserRole, docType: DocumentType): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.canUploadDocTypes.includes(docType);
}

export function canUserCollectEvidence(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'POLICE_OFFICER' || role === 'INVESTIGATION_OFFICER';
}

export function canUserTransferEvidence(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'POLICE_OFFICER' || role === 'INVESTIGATION_OFFICER' || role === 'FORENSIC_OFFICER';
}

export function canUserExamineEvidence(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'FORENSIC_OFFICER' || role === 'INVESTIGATION_OFFICER';
}

export function canUserApproveDocument(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'INVESTIGATION_OFFICER' || role === 'COURT_OFFICER';
}

export function canUserFinalizeDocument(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'COURT_OFFICER';
}
