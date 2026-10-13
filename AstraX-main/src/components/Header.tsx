import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole, Notification } from '../types.ts';
import { api } from '../services/api.ts';
import { ShieldCheck, Lock, UserCircle, LogOut, KeyRound, AlertTriangle, Bell, CheckCircle2, Search } from 'lucide-react';

interface HeaderProps {
  onOpenLogin: () => void;
  onNavigate?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLogin, onNavigate }) => {
  const { currentUser, profilePhotoUrl, logout, switchRoleShortcut, unauthorizedAlert, setUnauthorizedAlert } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const list = await api.getNotifications();
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 10000);
    return () => clearInterval(timer);
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    try {
      await api.markNotificationRead(notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      if (notif.actionUrl && onNavigate) {
        setShowNotifications(false);
        onNavigate(notif.actionUrl);
      }
    } catch {
      // ignore
    }
  };

  return (
    <header className="gov-header" id="ncrb-header">
      <div className="header-inner">
        {/* Brand Section */}
        <div className="brand-section">
          <div className="emblem-badge" title="National Crime Records Bureau">
            <ShieldCheck size={26} color="#ffffff" />
          </div>
          <div className="brand-text">
            <h1>
              Secure Digital Evidence & Legal Document Platform
              <span className="pki-tag">PKI &bull; SHA-256</span>
            </h1>
            <p>National Crime Records Bureau &bull; Ministry of Home Affairs &bull; Section 65B Certified</p>
          </div>
        </div>

        {/* Global Header Actions */}
        <div className="header-actions">
          {/* Live System Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-status valid" style={{ fontSize: '10px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
              PKI ARMED
            </span>
          </div>

          {currentUser ? (
            <>
              {/* Quick Role Switcher for Testing */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.08)', padding: '4px 10px', borderRadius: '6px' }}>
                <KeyRound size={13} color="#93c5fd" />
                <span style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 600 }}>Role:</span>
                <select
                  className="role-switcher-select"
                  value={currentUser.role}
                  onChange={(e) => switchRoleShortcut(e.target.value as UserRole)}
                  title="Switch role to test permissions and workflows"
                  id="role-switcher-dropdown"
                >
                  <option value="ADMIN">ADMIN (Dr. Rajesh Sharma)</option>
                  <option value="POLICE_OFFICER">POLICE OFFICER (Insp. Arumugam)</option>
                  <option value="INVESTIGATION_OFFICER">INVESTIGATION OFFICER (DSP Sunita Rao)</option>
                  <option value="FORENSIC_OFFICER">FORENSIC OFFICER (Dr. Priya Nambiar)</option>
                  <option value="LAWYER">LAWYER (Adv. Vikram Malhotra)</option>
                  <option value="COURT_OFFICER">COURT OFFICER (Justice Meenakshi)</option>
                </select>
              </div>

              {/* Notification Center */}
              <div style={{ position: 'relative' }}>
                <button
                  className="notif-bell-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                  title="In-App Security & Case Notifications"
                  id="notif-bell-btn"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>

                {showNotifications && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '46px',
                      width: '360px',
                      background: '#ffffff',
                      color: '#0f172a',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                      border: '1px solid #e2e8f0',
                      zIndex: 100,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ padding: '12px 16px', background: '#0b2545', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>Notifications ({notifications.length})</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{ background: 'transparent', border: 'none', color: '#93c5fd', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                          No notifications at this time
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: n.read ? '#ffffff' : '#f0f9ff',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: '12px', color: '#0b2545' }}>{n.title}</span>
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Info */}
              <div className="user-profile-widget">
                <div className="user-avatar" style={{ overflow: 'hidden' }}>
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    currentUser.fullName.charAt(0)
                  )}
                </div>
                <div className="user-info">
                  <span className="name">{currentUser.fullName}</span>
                  <span className="role-pill">{currentUser.role.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                className="btn btn-secondary btn-sm"
                onClick={logout}
                title="Sign out securely"
                style={{ color: '#dc2626', borderColor: 'rgba(255,255,255,0.2)', background: '#ffffff' }}
                id="logout-button"
              >
                <LogOut size={13} />
                Logout
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onOpenLogin} id="header-login-btn">
              <Lock size={14} />
              Login Portal
            </button>
          )}
        </div>
      </div>

      {/* Global Access Violation / Unauthorized Alert Banner */}
      {unauthorizedAlert && (
        <div style={{ background: '#fef2f2', color: '#991b1b', borderBottom: '2px solid #ef4444', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#dc2626" />
            <span>CRITICAL ACCESS VIOLATION: {unauthorizedAlert}</span>
          </div>
          <button
            onClick={() => setUnauthorizedAlert(null)}
            className="btn btn-sm btn-danger"
            style={{ padding: '3px 8px', fontSize: '11px' }}
          >
            Acknowledge [X]
          </button>
        </div>
      )}
    </header>
  );
};
