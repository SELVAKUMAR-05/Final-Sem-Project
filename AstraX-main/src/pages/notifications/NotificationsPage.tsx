import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.ts';
import { Notification } from '../../types.ts';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { useToast } from '../../components/common/Toast.tsx';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Package,
  ShieldCheck,
  CheckCheck,
  ExternalLink
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      showToast('Error loading notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      showToast('Notification marked as read', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'UNREAD') return !n.read;
    if (filterType === 'TAMPER') return n.type.includes('TAMPER');
    if (filterType === 'WORKFLOW') return n.type.includes('WORKFLOW') || n.type.includes('APPROV');
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Notifications & Security Alerts' }]} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
            Notifications &amp; Security Alerts
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Real-time notifications regarding document workflow actions, custody handoffs, and tamper detection alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <CheckCheck size={15} />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '12px'
        }}
      >
        <button
          onClick={() => setFilterType('ALL')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: filterType === 'ALL' ? 800 : 600,
            background: filterType === 'ALL' ? '#1d4ed8' : '#f1f5f9',
            color: filterType === 'ALL' ? '#ffffff' : '#475569',
            cursor: 'pointer'
          }}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setFilterType('UNREAD')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: filterType === 'UNREAD' ? 800 : 600,
            background: filterType === 'UNREAD' ? '#1d4ed8' : '#f1f5f9',
            color: filterType === 'UNREAD' ? '#ffffff' : '#475569',
            cursor: 'pointer'
          }}
        >
          Unread ({unreadCount})
        </button>

        <button
          onClick={() => setFilterType('TAMPER')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: filterType === 'TAMPER' ? 800 : 600,
            background: filterType === 'TAMPER' ? '#dc2626' : '#f1f5f9',
            color: filterType === 'TAMPER' ? '#ffffff' : '#475569',
            cursor: 'pointer'
          }}
        >
          Tamper Alerts
        </button>

        <button
          onClick={() => setFilterType('WORKFLOW')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: filterType === 'WORKFLOW' ? 800 : 600,
            background: filterType === 'WORKFLOW' ? '#1d4ed8' : '#f1f5f9',
            color: filterType === 'WORKFLOW' ? '#ffffff' : '#475569',
            cursor: 'pointer'
          }}
        >
          Workflow &amp; Approvals
        </button>
      </div>

      {/* List */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You are fully caught up with all case updates and security alert dispatches."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotifications.map((notif) => {
            const isAlert = notif.type.includes('TAMPER') || notif.type.includes('FAIL');
            return (
              <div
                key={notif.id}
                style={{
                  background: notif.read ? '#ffffff' : isAlert ? '#fef2f2' : '#f0f9ff',
                  border: isAlert
                    ? '1px solid #fecaca'
                    : notif.read
                    ? '1px solid #e2e8f0'
                    : '1px solid #bae6fd',
                  borderRadius: '10px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: isAlert ? '#fee2e2' : '#e0f2fe',
                      color: isAlert ? '#dc2626' : '#0284c7',
                      marginTop: '2px'
                    }}
                  >
                    {isAlert ? <AlertTriangle size={18} /> : <Bell size={18} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '14px',
                          color: isAlert ? '#991b1b' : '#0f172a'
                        }}
                      >
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#1d4ed8',
                            display: 'inline-block'
                          }}
                        />
                      )}
                    </div>

                    <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                      {notif.message}
                    </p>

                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(notif.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '6px 10px' }}
                    >
                      Mark Read
                    </button>
                  )}

                  {notif.relatedCaseId && (
                    <button
                      onClick={() => navigate(`/cases/${notif.relatedCaseId}`)}
                      className="btn btn-primary"
                      style={{ fontSize: '11px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Open Docket</span>
                      <ExternalLink size={12} />
                    </button>
                  )}

                  {notif.relatedDocumentId && (
                    <button
                      onClick={() => navigate(`/documents/${notif.relatedDocumentId}`)}
                      className="btn btn-primary"
                      style={{ fontSize: '11px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Open Document</span>
                      <ExternalLink size={12} />
                    </button>
                  )}

                  {notif.relatedEvidenceId && (
                    <button
                      onClick={() => navigate(`/evidence/${notif.relatedEvidenceId}`)}
                      className="btn btn-primary"
                      style={{ fontSize: '11px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Open Exhibit</span>
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
