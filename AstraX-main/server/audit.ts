import crypto from 'node:crypto';
import { AuditLog, UserRole, AuditVerificationResult } from '../src/types.ts';

// In chronological order for forward cryptographic chaining
let auditLogsChronological: AuditLog[] = [];
let nextAuditId = 1;
let onAuditLedgerChange: (() => void) | undefined;
const GENESIS_HASH = '0000000000000000GENESIS_NCRB_AUDIT_LEDGER_ROOT_2026_BLOCK_0';

export function setAuditLedgerChangeHandler(handler: () => void): void {
  onAuditLedgerChange = handler;
}

export function getAuditLedgerSnapshot(): AuditLog[] {
  return [...auditLogsChronological];
}

export function restoreAuditLedger(logs: AuditLog[]): void {
  auditLogsChronological = [...logs].sort((a, b) => a.id - b.id);
  nextAuditId = auditLogsChronological.reduce((maxId, log) => Math.max(maxId, log.id + 1), 1);
}

function computeRecordHash(data: {
  id: number;
  userId: number;
  action: string;
  documentId?: number;
  caseId?: number;
  ipAddress: string;
  description: string;
  timestamp: string;
  previousLogHash: string;
}): string {
  const content = `${data.id}|${data.userId}|${data.action}|${data.documentId || 0}|${data.caseId || 0}|${data.ipAddress}|${data.description}|${data.timestamp}|${data.previousLogHash}`;
  return crypto.createHash('sha256').update(content).digest('hex').toUpperCase();
}

export function addAuditLog(entry: {
  userId: number;
  username: string;
  role: UserRole;
  action: AuditLog['action'];
  documentId?: number;
  documentName?: string;
  caseId?: number;
  caseNumber?: string;
  evidenceId?: string;
  ipAddress?: string;
  description: string;
  status?: 'SUCCESS' | 'DENIED' | 'FLAGGED';
}): AuditLog {
  const id = nextAuditId++;
  const timestamp = new Date().toISOString();
  
  // Previous log hash from the tail of chronological records
  const prevRecord = auditLogsChronological[auditLogsChronological.length - 1];
  const previousLogHash = prevRecord ? prevRecord.currentLogHash : GENESIS_HASH;

  const currentLogHash = computeRecordHash({
    id,
    userId: entry.userId,
    action: entry.action,
    documentId: entry.documentId,
    caseId: entry.caseId,
    ipAddress: entry.ipAddress || '127.0.0.1',
    description: entry.description,
    timestamp,
    previousLogHash,
  });

  const log: AuditLog = {
    id,
    userId: entry.userId,
    username: entry.username,
    role: entry.role,
    action: entry.action,
    documentId: entry.documentId,
    documentName: entry.documentName,
    caseId: entry.caseId,
    caseNumber: entry.caseNumber,
    evidenceId: entry.evidenceId,
    ipAddress: entry.ipAddress || '127.0.0.1',
    description: entry.description,
    status: entry.status || 'SUCCESS',
    previousLogHash,
    currentLogHash,
    createdAt: timestamp,
  };

  auditLogsChronological.push(log);
  onAuditLedgerChange?.();
  return log;
}

export function getAuditLogs(filter?: {
  userId?: number;
  caseId?: number;
  action?: string;
  role?: string;
  limit?: number;
}): AuditLog[] {
  // Return newest first for standard display
  let list = [...auditLogsChronological].reverse();

  if (filter?.userId) {
    list = list.filter((l) => l.userId === filter.userId);
  }
  if (filter?.caseId) {
    list = list.filter((l) => l.caseId === filter.caseId);
  }
  if (filter?.action) {
    list = list.filter((l) => l.action === filter.action);
  }
  if (filter?.role) {
    list = list.filter((l) => l.role === filter.role);
  }

  const limit = filter?.limit || 100;
  return list.slice(0, limit);
}

/**
 * Verify cryptographic hash integrity across the chained audit records
 */
export function verifyAuditChain(): AuditVerificationResult {
  const verifiedAt = new Date().toISOString();

  if (auditLogsChronological.length === 0) {
    return {
      integrity: 'VALID',
      totalVerified: 0,
      message: 'Audit ledger is currently empty. Initial state valid.',
      verifiedAt,
    };
  }

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < auditLogsChronological.length; i++) {
    const record = auditLogsChronological[i];

    // Check if previousLogHash matches expected
    if (record.previousLogHash !== expectedPrevHash) {
      return {
        integrity: 'COMPROMISED',
        totalVerified: i,
        brokenLogId: record.id,
        brokenAt: record.createdAt,
        message: `Audit Trail Integrity Compromised! Cryptographic pointer mismatch at Record #${record.id} (${record.action}). Expected parent: ${expectedPrevHash.slice(0, 16)}..., Found: ${record.previousLogHash.slice(0, 16)}...`,
        verifiedAt,
      };
    }

    // Recompute current hash
    const recalculated = computeRecordHash({
      id: record.id,
      userId: record.userId,
      action: record.action,
      documentId: record.documentId,
      caseId: record.caseId,
      ipAddress: record.ipAddress,
      description: record.description,
      timestamp: record.createdAt,
      previousLogHash: record.previousLogHash,
    });

    if (recalculated !== record.currentLogHash) {
      return {
        integrity: 'COMPROMISED',
        totalVerified: i,
        brokenLogId: record.id,
        brokenAt: record.createdAt,
        message: `Audit Trail Integrity Compromised! Record #${record.id} has been modified on storage! SHA-256 recalculated: ${recalculated.slice(0, 16)}... does not match recorded: ${record.currentLogHash.slice(0, 16)}...`,
        verifiedAt,
      };
    }

    expectedPrevHash = record.currentLogHash;
  }

  return {
    integrity: 'VALID',
    totalVerified: auditLogsChronological.length,
    message: `All ${auditLogsChronological.length} audit records cryptographically verified. SHA-256 chained hash ledger is fully authentic and uncompromised.`,
    verifiedAt,
  };
}

let originalTamperedBackup: { id: number; description: string } | null = null;

export function toggleAuditTamperSimulation(targetId?: number): { isTampered: boolean; message: string } {
  if (originalTamperedBackup) {
    // Restore
    const rec = auditLogsChronological.find((l) => l.id === originalTamperedBackup!.id);
    if (rec) {
      rec.description = originalTamperedBackup.description;
    }
    originalTamperedBackup = null;
    onAuditLedgerChange?.();
    return {
      isTampered: false,
      message: 'Audit log entry restored. Cryptographic hash chain is now intact.',
    };
  } else {
    // Tamper
    const target = targetId 
      ? auditLogsChronological.find((l) => l.id === targetId)
      : auditLogsChronological[Math.floor(auditLogsChronological.length / 2)] || auditLogsChronological[0];

    if (!target) {
      throw new Error('No audit logs available to tamper');
    }

    originalTamperedBackup = {
      id: target.id,
      description: target.description,
    };

    target.description = `${target.description} [UNAUTHORIZED_SQL_MODIFICATION_INJECTED]`;
    onAuditLedgerChange?.();
    return {
      isTampered: true,
      message: `Simulated unauthorized edit on Audit Record #${target.id}. Run verification to detect the broken block!`,
    };
  }
}
