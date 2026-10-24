import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { SecurityAlert } from '../types.ts';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Play,
  User,
  Clock,
} from 'lucide-react';

export const SecurityAlertsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getSecurityAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load security alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleUpdateStatus = async (alertId: number, newStatus: string) => {
    try {
      await api.updateSecurityAlertStatus(alertId, newStatus);
      loadAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to update alert status');
    }
  };

  const handleSimulateAlert = async (type: string, severity: string) => {
    try {
      await api.simulateSecurityAlert({
        alertType: type,
        severity,
        description: `Live test trigger: ${type.replace(/_/g, ' ')} detected on high-clearance evidentiary record.`,
      });
      loadAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to simulate alert');
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="badge-pill priority-critical">🔴 CRITICAL</span>;
      case 'HIGH':
        return <span className="badge-pill priority-high">🟠 HIGH</span>;
      case 'MEDIUM':
        return <span className="badge-pill priority-medium">🟡 MEDIUM</span>;
      default:
        return <span className="badge-pill">🔵 LOW</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="badge-status tampered" style={{ fontSize: '10px' }}>🔴 OPEN</span>;
      case 'INVESTIGATING':
        return <span className="badge-status under-review" style={{ fontSize: '10px' }}>🟠 INVESTIGATING</span>;
      case 'RESOLVED':
        return <span className="badge-status valid" style={{ fontSize: '10px' }}>🟢 RESOLVED</span>;
      default:
        return <span className="badge-status valid">{status}</span>;
    }
  };

  const filteredAlerts = alerts.filter((a) => (filterSeverity === 'ALL' ? true : a.severity === filterSeverity));

  const totalCritical = alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
  const totalOpen = alerts.filter((a) => a.status === 'OPEN').length;
  const totalInvestigating = alerts.filter((a) => a.status === 'INVESTIGATING').length;
  const totalResolved = alerts.filter((a) => a.status === 'RESOLVED').length;

  return (
    <div id="security-alerts-view">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>
            <ShieldAlert size={24} color="#dc2626" />
            Security Threat &amp; Abnormal Activity Center
          </h1>
          <p>Real-Time Heuristic Monitoring for Access Breaches, Brute Force &amp; Seal Violations</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadAlerts}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            className="btn btn-danger"
            onClick={() => handleSimulateAlert('RAPID_DOWNLOADS', 'CRITICAL')}
            title="Simulate sudden mass download of evidence files"
          >
            <Play size={14} />
            Simulate Mass Download
          </button>
          <button
            className="btn btn-warning"
            onClick={() => handleSimulateAlert('INTEGRITY_TAMPER_FAILURE', 'HIGH')}
            title="Simulate cryptographic hash mismatch trigger"
          >
            <Play size={14} />
            Simulate Hash Tamper
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="stats-grid">
        <div className="stat-metric-card">
          <span className="label">Critical Threats</span>
          <span className="value" style={{ color: totalCritical > 0 ? '#dc2626' : '#16a34a' }}>
            {totalCritical}
          </span>
          <span className="sub">{totalCritical > 0 ? 'Requires immediate action' : 'All clear'}</span>
        </div>
        <div className="stat-metric-card">
          <span className="label">Open Alerts</span>
          <span className="value" style={{ color: '#dc2626' }}>{totalOpen}</span>
          <span className="sub">Unacknowledged incidents</span>
        </div>
        <div className="stat-metric-card">
          <span className="label">Under Investigation</span>
          <span className="value" style={{ color: '#d97706' }}>{totalInvestigating}</span>
          <span className="sub">Assigned to security officer</span>
        </div>
        <div className="stat-metric-card">
          <span className="label">Resolved Incidents</span>
          <span className="value" style={{ color: '#16a34a' }}>{totalResolved}</span>
          <span className="sub">Audited &amp; neutralized</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="gov-card" style={{ marginBottom: '20px' }}>
        <div className="gov-card-body" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Filter Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              className={`btn btn-sm ${filterSeverity === sev ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterSeverity(sev)}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <h2>
            <AlertTriangle size={18} color="#dc2626" />
            Active Security Incidents ({filteredAlerts.length})
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Powered by Automated Threat Detection &amp; Audit Anomaly Scoring
          </span>
        </div>
        <div className="gov-table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Alert Type</th>
                <th>Description</th>
                <th>Associated Account</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Resolution Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No security alerts matching this severity.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((a) => (
                  <tr key={a.id}>
                    <td>{getSeverityBadge(a.severity)}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0b2545', fontSize: '12px' }}>
                        {a.alertType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#334155' }}>
                        {a.description}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#0b2545' }}>
                        <User size={12} />
                        <strong>{a.username}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="timeline-time">
                        {new Date(a.detectedAt).toLocaleString()}
                      </span>
                    </td>
                    <td>{getStatusBadge(a.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {a.status !== 'INVESTIGATING' && a.status !== 'RESOLVED' && (
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleUpdateStatus(a.id, 'INVESTIGATING')}
                          >
                            Investigate
                          </button>
                        )}
                        {a.status !== 'RESOLVED' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleUpdateStatus(a.id, 'RESOLVED')}
                          >
                            <CheckCircle2 size={12} />
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
