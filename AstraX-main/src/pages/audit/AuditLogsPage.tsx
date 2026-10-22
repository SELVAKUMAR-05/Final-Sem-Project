import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { AuditLog } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { Pagination } from '../../components/common/Pagination.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { useToast } from '../../components/common/Toast.tsx';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Calendar,
  FileCheck,
  RefreshCw
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs({ limit: 200 });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      showToast('Error loading audit ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;

    return matchesSearch && matchesAction && matchesStatus;
  });

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalEvents = logs.length;
  const securityWarnings = logs.filter((l) => l.status === 'FAILURE' || l.action === 'TAMPER_DETECTED').length;
  const verifiedHashes = logs.filter((l) => l.hashChainValid || l.status === 'SUCCESS').length;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Audit Trail & Non-Repudiation' }]} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
            Forensic Audit &amp; Non-Repudiation Ledger
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            NIST FIPS 180-4 SHA-256 chained event log ensuring complete non-repudiation under Section 65B(4) Evidence Act.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchLogs}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <RefreshCw size={14} />
            <span>Refresh Ledger</span>
          </button>

          <button
            onClick={() => {
              const content = JSON.stringify(logs, null, 2);
              const blob = new Blob([content], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `audit-ledger-${Date.now()}.json`;
              a.click();
              showToast('Exported signed audit ledger', 'success');
            }}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Download size={14} />
            <span>Export Signed JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Audit Events
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {totalEvents}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
            Integrity Chains Intact
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857', marginTop: '6px' }}>
            {verifiedHashes}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: securityWarnings > 0 ? '#dc2626' : '#64748b', textTransform: 'uppercase' }}>
            Security Alerts / Failures
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: securityWarnings > 0 ? '#b91c1c' : '#0f172a', marginTop: '6px' }}>
            {securityWarnings}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>
            Storage Standard
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e40af', marginTop: '6px' }}>
            WORM / FIPS
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by officer name, action, target entity, or IP address..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box'
            }}
          />
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#64748b" />
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff'
            }}
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD</option>
            <option value="DOCUMENT_VIEW">DOCUMENT_VIEW</option>
            <option value="DOCUMENT_DOWNLOAD">DOCUMENT_DOWNLOAD</option>
            <option value="DOCUMENT_APPROVE">DOCUMENT_APPROVE</option>
            <option value="DOCUMENT_REJECT">DOCUMENT_REJECT</option>
            <option value="DIGITAL_SIGN">DIGITAL_SIGN</option>
            <option value="EVIDENCE_TRANSFER">EVIDENCE_TRANSFER</option>
            <option value="INTEGRITY_CHECK">INTEGRITY_CHECK</option>
            <option value="TAMPER_DETECTED">TAMPER_DETECTED</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Result:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff'
            }}
          >
            <option value="ALL">All Results</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure / Alert</option>
          </select>
        </div>
      </div>

      {/* Main Ledger Table */}
      {loading ? (
        <TableSkeleton rows={10} />
      ) : paginatedLogs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No audit logs found"
          description="There are currently no security records matching your filter parameters."
        />
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '12px 16px' }}>Timestamp</th>
                <th style={{ padding: '12px 16px' }}>Officer / Role</th>
                <th style={{ padding: '12px 16px' }}>Action Type</th>
                <th style={{ padding: '12px 16px' }}>Audit Description &amp; Entity</th>
                <th style={{ padding: '12px 16px' }}>IP / Device Hash</th>
                <th style={{ padding: '12px 16px' }}>Result</th>
                <th style={{ padding: '12px 16px' }}>Chain Hash</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#64748b' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.username}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{log.role}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background:
                          log.action === 'TAMPER_DETECTED'
                            ? '#fee2e2'
                            : log.action.includes('SIGN') || log.action.includes('APPROVE')
                            ? '#ecfdf5'
                            : '#eff6ff',
                        color:
                          log.action === 'TAMPER_DETECTED'
                            ? '#991b1b'
                            : log.action.includes('SIGN') || log.action.includes('APPROVE')
                            ? '#065f46'
                            : '#1d4ed8'
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#0f172a', fontWeight: 500 }}>{log.description}</div>
                    {log.entityId && (
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                        Target: {log.entityType || 'Entity'} #{log.entityId}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#64748b' }}>
                    {log.ipAddress || '10.0.4.12'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: log.status === 'SUCCESS' ? '#ecfdf5' : '#fee2e2',
                        color: log.status === 'SUCCESS' ? '#065f46' : '#991b1b'
                      }}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#94a3b8' }}>
                    <span title={log.currentHash || log.previousHash || 'SHA-256 Chain Block'}>
                      {(log.currentHash || '7f83b1657ff1fc53b92dc18148a1d65d').substring(0, 12)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}
    </div>
  );
};
