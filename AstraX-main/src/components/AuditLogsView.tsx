import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { AuditLog } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  History,
  Shield,
  Download,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isAuthorized = currentUser?.role === 'ADMIN' || currentUser?.role === 'COURT_OFFICER';

  const fetchLogs = async () => {
    if (!isAuthorized) return;
    try {
      setLoading(true);
      const data = await api.getAuditLogs({ limit: 100 });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentUser?.role]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'User', 'Role', 'Action', 'Target Type', 'Target ID', 'Status', 'IP Address', 'Description'];
    const rows = logs.map(l => [
      l.id,
      new Date(l.createdAt).toISOString(),
      `"${l.username}"`,
      l.role,
      l.action,
      l.targetType || '',
      l.targetId || '',
      l.status,
      l.ipAddress,
      `"${l.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ncrb-audit-trail-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthorized) {
    return (
      <div className="gov-card" style={{ borderLeft: '6px solid #dc2626', background: '#fef2f2', padding: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
          <AlertTriangle size={32} color="#dc2626" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#991b1b' }}>
            403 Forbidden - Security Restricted Area (DEMO 8)
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: '#7f1d1d', lineHeight: 1.6, maxWidth: '700px' }}>
          Your active role <strong>{currentUser?.role}</strong> does not possess clearance to inspect the Master Immutable Audit Trail. In compliance with NCRB Security Directive 2026, audit logs are strictly restricted to <strong>ADMIN</strong> and <strong>COURT_OFFICER</strong> roles.
        </p>
        <div style={{ marginTop: '18px' }}>
          <span style={{ fontSize: '12px', background: '#fee2e2', color: '#991b1b', padding: '6px 12px', borderRadius: '4px', border: '1px solid #f87171', fontWeight: 600 }}>
            Incident logged under security audit ref #NCRB-AC-DENIED-{Date.now().toString().slice(-6)}
          </span>
        </div>
      </div>
    );
  }

  const filteredLogs = logs.filter((l) => {
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    const matchesSearch =
      l.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.ipAddress.includes(searchQuery) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="audit-logs-view" id="ncrb-audit-logs-view">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gov-navy-950)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={26} color="var(--gov-blue-600)" />
            Cryptographically Chained Immutable Audit Trail (DEMO 9)
          </h2>
          <p style={{ color: 'var(--gov-text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Append-only tamper-evident event log &bull; Section 65B Admissibility Ledger
          </p>
        </div>

        <button className="btn-gov btn-gov-primary" onClick={handleExportCSV}>
          <FileSpreadsheet size={16} /> Export Audit Trail (CSV)
        </button>
      </div>

      {/* Filter and Search */}
      <div className="gov-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by User, Description, IP Address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#64748b" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Action Filter:</span>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="VIEW_DOCUMENT">VIEW_DOCUMENT</option>
              <option value="UPLOAD_DOCUMENT">UPLOAD_DOCUMENT</option>
              <option value="UPLOAD_VERSION">UPLOAD_VERSION</option>
              <option value="VERIFY_HASH">VERIFY_HASH</option>
              <option value="TAMPER_ATTEMPT">TAMPER_ATTEMPT</option>
              <option value="SIGN_DOCUMENT">SIGN_DOCUMENT</option>
              <option value="DOWNLOAD_DOCUMENT">DOWNLOAD_DOCUMENT</option>
              <option value="ACCESS_DENIED">ACCESS_DENIED</option>
              <option value="UNAUTHORIZED_ACCESS_ATTEMPT">UNAUTHORIZED_ACCESS_ATTEMPT (DEMO 8)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="gov-table-wrap">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Actor &amp; Role</th>
              <th>Status</th>
              <th>Description / Event Details</th>
              <th>Client IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} style={{ background: log.status === 'DENIED' ? '#fff5f5' : undefined }}>
                <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>

                <td>
                  <span className={`badge-status ${log.status === 'DENIED' ? 'danger' : log.action.includes('TAMPER') ? 'danger' : 'info'}`}>
                    {log.action}
                  </span>
                </td>

                <td>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gov-navy-950)' }}>
                    {log.username}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>
                    {log.role}
                  </div>
                </td>

                <td>
                  <span className={`badge-status ${log.status === 'SUCCESS' ? 'success' : log.status === 'DENIED' ? 'danger' : 'warning'}`}>
                    {log.status}
                  </span>
                </td>

                <td style={{ fontSize: '13px', maxWidth: '420px', lineHeight: 1.4 }}>
                  {log.description}
                </td>

                <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--gov-text-muted)' }}>
                  {log.ipAddress}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
