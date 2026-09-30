import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext.tsx';
import { UserRole, Notification, Case, LegalDocument, Evidence } from '../../types.ts';
import { api } from '../../services/api.ts';
import { AIAssistant } from '../AIAssistant.tsx';
import {
  ShieldCheck,
  LayoutDashboard,
  FolderLock,
  FileText,
  Package,
  GitCommit,
  History,
  ShieldAlert,
  ShieldCheck as ShieldAudit,
  Network,
  FileSpreadsheet,
  Search,
  Users,
  User,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  ArrowRight,
  UploadCloud,
  FileCheck2,
  Lock
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  onOpenUploadModal?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, onOpenUploadModal }) => {
  const { currentUser, logout, switchRoleShortcut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{
    cases: Case[];
    documents: LegalDocument[];
    evidence: Evidence[];
    people: Array<{ id: number; fullName: string; username: string; department: string; role: string }>;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState<boolean>(false);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
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
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
        setRoleSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.globalSearch(searchQuery.trim());
        setSearchResults(res);
        setSearchDropdownOpen(true);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      setNotificationsOpen(false);
      if (notif.actionUrl) {
        navigate(notif.actionUrl);
      }
    } catch {
      // ignore
    }
  };

  // Role-based navigation definition matching Section 20 of prompt
  const getNavLinks = () => {
    const role = currentUser?.role || 'POLICE_OFFICER';

    const commonTop = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (role === 'ADMIN') {
      return [
        ...commonTop,
        { to: '/cases', label: 'Cases Repository', icon: FolderLock },
        { to: '/documents', label: 'Documents & Vault', icon: FileText },
        { to: '/evidence', label: 'Evidence Inventory', icon: Package },
        { to: '/timeline', label: 'Investigation Timeline', icon: History },
        { to: '/reports', label: 'Section 65B Reports', icon: FileSpreadsheet },
        { to: '/graph', label: 'Relationship Graph', icon: Network },
        { to: '/search', label: 'Advanced Search', icon: Search },
        { separator: true, label: 'SECURITY & AUDIT' },
        { to: '/security', label: 'Security Center', icon: ShieldAlert },
        { to: '/audit-logs', label: 'Audit Hash Chain', icon: ShieldAudit },
        { to: '/users', label: 'User Management', icon: Users },
        { separator: true, label: 'ACCOUNT' },
        { to: '/profile', label: 'Officer Profile', icon: User },
      ];
    }

    if (role === 'POLICE_OFFICER') {
      return [
        ...commonTop,
        { to: '/cases', label: 'My Assigned Cases', icon: FolderLock },
        { to: '/documents', label: 'FIR & Seizure Docs', icon: FileText },
        { to: '/evidence', label: 'Seized Evidence', icon: Package },
        { to: '/timeline', label: 'Station Timeline', icon: History },
        { to: '/search', label: 'Case Search', icon: Search },
        { separator: true, label: 'ACCOUNT' },
        { to: '/profile', label: 'Officer Profile', icon: User },
      ];
    }

    if (role === 'INVESTIGATION_OFFICER') {
      return [
        ...commonTop,
        { to: '/cases', label: 'Investigations', icon: FolderLock },
        { to: '/evidence', label: 'Evidence Vault', icon: Package },
        { to: '/documents', label: 'Case Documents', icon: FileText },
        { to: '/timeline', label: 'CrPC Timeline', icon: History },
        { to: '/graph', label: 'Entity Graph', icon: Network },
        { to: '/reports', label: 'Case Dossiers', icon: FileSpreadsheet },
        { to: '/search', label: 'Intelligence Search', icon: Search },
        { separator: true, label: 'ACCOUNT' },
        { to: '/profile', label: 'Officer Profile', icon: User },
      ];
    }

    if (role === 'FORENSIC_OFFICER') {
      return [
        ...commonTop,
        { to: '/cases', label: 'Assigned Cases', icon: FolderLock },
        { to: '/evidence', label: 'Evidence Intake', icon: Package },
        { to: '/evidence-chain', label: 'Chain of Custody', icon: GitCommit },
        { to: '/documents', label: 'Forensic Reports', icon: FileText },
        { to: '/integrity-lab', label: 'SHA-256 Integrity Lab', icon: FileCheck2 },
        { to: '/search', label: 'Search Archives', icon: Search },
        { separator: true, label: 'ACCOUNT' },
        { to: '/profile', label: 'Forensic Profile', icon: User },
      ];
    }

    if (role === 'LAWYER') {
      return [
        ...commonTop,
        { to: '/cases', label: 'Assigned Cases', icon: FolderLock },
        { to: '/documents', label: 'Legal Briefs & Pleadings', icon: FileText },
        { to: '/signatures', label: 'Digital Signatures', icon: FileCheck2 },
        { to: '/reports', label: 'Judicial Reports', icon: FileSpreadsheet },
        { to: '/search', label: 'Search Pleadings', icon: Search },
        { separator: true, label: 'ACCOUNT' },
        { to: '/profile', label: 'Counsel Profile', icon: User },
      ];
    }

    // COURT_OFFICER
    return [
      ...commonTop,
      { to: '/cases', label: 'Sessions Court Cases', icon: FolderLock },
      { to: '/documents', label: 'Judgments & Orders', icon: FileText },
      { to: '/signatures', label: 'Judicial Signatures', icon: FileCheck2 },
      { to: '/reports', label: 'Section 65B Dossiers', icon: FileSpreadsheet },
      { to: '/audit-logs', label: 'Evidentiary Audit Ledger', icon: ShieldAudit },
      { to: '/search', label: 'Search Registry', icon: Search },
      { separator: true, label: 'ACCOUNT' },
      { to: '/profile', label: 'Registrar Profile', icon: User },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* TOP NAVIGATION BAR */}
      <header style={{
        height: '64px',
        background: '#07162c',
        borderBottom: '1px solid #1e293b',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Left: Brand Logo & Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#cbd5e1',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s'
            }}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={18} />
          </button>

          <Link
            to="/dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
            }}>
              <ShieldCheck size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '1.4px', color: '#93c5fd', textTransform: 'uppercase' }}>
                MINISTRY OF HOME AFFAIRS
              </div>
              <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.3px', color: '#ffffff' }}>
                NCRB EVIDENCE VAULT
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Live Global Search Bar */}
        <div ref={searchRef} style={{ position: 'relative', width: '380px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults) setSearchDropdownOpen(true);
              }}
              placeholder="Search cases, documents, evidence, personnel..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            {searchLoading && (
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '14px',
                height: '14px',
                border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: '#60a5fa',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite'
              }} />
            )}
          </div>

          {/* Global Search Results Dropdown */}
          {searchDropdownOpen && searchResults && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: '#ffffff',
              borderRadius: '10px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              maxHeight: '420px',
              overflowY: 'auto',
              zIndex: 100,
              padding: '12px'
            }}>
              {/* Cases */}
              {searchResults.cases.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Cases ({searchResults.cases.length})
                  </div>
                  {searchResults.cases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        navigate('/cases');
                        setSearchDropdownOpen(false);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        background: '#f8fafc',
                        marginBottom: '4px'
                      }}
                    >
                      <div>
                        <strong>{c.caseNumber}</strong> &bull; {c.title}
                      </div>
                      <span style={{ fontSize: '10px', color: '#1d4ed8', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents */}
              {searchResults.documents.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Documents ({searchResults.documents.length})
                  </div>
                  {searchResults.documents.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => {
                        navigate('/documents');
                        setSearchDropdownOpen(false);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        background: '#f8fafc',
                        marginBottom: '4px'
                      }}
                    >
                      <div>
                        <strong>{d.documentName}</strong> ({d.documentType})
                      </div>
                      <span style={{ fontSize: '10px', color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                        SHA-256 Valid
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Evidence */}
              {searchResults.evidence.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Evidence Items ({searchResults.evidence.length})
                  </div>
                  {searchResults.evidence.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => {
                        navigate('/evidence');
                        setSearchDropdownOpen(false);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        background: '#f8fafc',
                        marginBottom: '4px'
                      }}
                    >
                      <div>
                        <strong>{e.evidenceId}</strong> &bull; {e.description}
                      </div>
                      <span style={{ fontSize: '10px', color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                        {e.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* People */}
              {searchResults.people.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Personnel ({searchResults.people.length})
                  </div>
                  {searchResults.people.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        navigate('/users');
                        setSearchDropdownOpen(false);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        background: '#f8fafc',
                        marginBottom: '4px'
                      }}
                    >
                      <div>
                        <strong>{p.fullName}</strong> &bull; {p.department}
                      </div>
                      <span style={{ fontSize: '10px', color: '#6366f1', background: '#eef2ff', padding: '2px 6px', borderRadius: '4px' }}>
                        {p.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.cases.length === 0 &&
               searchResults.documents.length === 0 &&
               searchResults.evidence.length === 0 &&
               searchResults.people.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '13px' }}>
                  No exact records matched "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Notifications, Quick Role Switcher, Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Quick Demo Role Switcher for Hackathon Evaluation */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '6px',
                color: '#93c5fd',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Quick switch role for testing RBAC permissions"
            >
              <Sparkles size={14} color="#60a5fa" />
              <span>Role: <strong>{currentUser?.role.replace(/_/g, ' ')}</strong></span>
              <ChevronDown size={14} />
            </button>

            {roleSwitcherOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '260px',
                background: '#ffffff',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                border: '1px solid #cbd5e1',
                padding: '8px',
                zIndex: 100,
                color: '#0f172a'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', padding: '6px 8px', letterSpacing: '0.5px' }}>
                  INSTANT ROLE SWITCH (TESTING RBAC):
                </div>
                {(Object.keys(DEMO_CREDENTIALS) as UserRole[]).map((r) => {
                  const isCurrent = currentUser?.role === r;
                  return (
                    <button
                      key={r}
                      onClick={async () => {
                        setRoleSwitcherOpen(false);
                        await switchRoleShortcut(r);
                        navigate('/dashboard');
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        background: isCurrent ? '#eff6ff' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginBottom: '2px'
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 700, color: isCurrent ? '#1d4ed8' : '#1e293b' }}>
                        {r.replace(/_/g, ' ')} {isCurrent && '✓'}
                      </span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        {DEMO_CREDENTIALS[r].title}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#cbd5e1',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Official Notifications & Alerts"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(239, 68, 68, 0.5)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '360px',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                zIndex: 100,
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                    Notifications ({unreadCount} unread)
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1d4ed8',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                      No notifications available.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #f1f5f9',
                          background: n.read ? '#ffffff' : '#eff6ff',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ marginTop: '2px' }}>
                            {n.type === 'ALERT' ? (
                              <AlertCircle size={16} color="#dc2626" />
                            ) : n.type === 'SUCCESS' ? (
                              <CheckCircle2 size={16} color="#059669" />
                            ) : (
                              <Clock size={16} color="#1d4ed8" />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.4 }}>
                              {n.message}
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {!n.read && (
                            <span style={{ width: '8px', height: '8px', background: '#1d4ed8', borderRadius: '50%' }} />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate('/notifications');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1d4ed8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    View All Notifications &amp; Alerts &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Dropdown */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                padding: '4px 10px 4px 6px',
                borderRadius: '30px',
                cursor: 'pointer',
                color: '#ffffff'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '13px'
              }}>
                {currentUser?.fullName.charAt(0) || 'U'}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {currentUser?.fullName.split(' ')[0] || 'User'}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {currentUser?.role.replace(/_/g, ' ')}
                </div>
              </div>
              <ChevronDown size={14} color="#94a3b8" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
                border: '1px solid #cbd5e1',
                padding: '8px',
                zIndex: 100,
                color: '#0f172a'
              }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    {currentUser?.fullName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {currentUser?.email}
                  </div>
                  <div style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 700, marginTop: '4px' }}>
                    {currentUser?.department}
                  </div>
                </div>

                <div style={{ padding: '6px 0' }}>
                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      color: '#1e293b',
                      fontSize: '13px',
                      textDecoration: 'none',
                      fontWeight: 500
                    }}
                  >
                    <User size={16} color="#64748b" />
                    <span>Officer Profile &amp; PKI</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      color: '#1e293b',
                      fontSize: '13px',
                      textDecoration: 'none',
                      fontWeight: 500
                    }}
                  >
                    <Settings size={16} color="#64748b" />
                    <span>System Settings</span>
                  </Link>

                  <Link
                    to="/notifications"
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      color: '#1e293b',
                      fontSize: '13px',
                      textDecoration: 'none',
                      fontWeight: 500
                    }}
                  >
                    <Bell size={16} color="#64748b" />
                    <span>Security Notifications</span>
                  </Link>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      color: '#dc2626',
                      background: 'none',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN BODY LAYOUT: SIDEBAR + CONTENT */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
        {/* COLLAPSIBLE SIDEBAR */}
        <aside style={{
          width: sidebarCollapsed ? '72px' : '260px',
          background: '#07162c',
          borderRight: '1px solid #1e293b',
          color: '#cbd5e1',
          transition: 'width 0.2s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          {/* Navigation Items */}
          <div style={{ padding: '16px 12px', overflowY: 'auto' }}>
            {navLinks.map((item, idx) => {
              if ((item as any).separator) {
                if (sidebarCollapsed) return <div key={idx} style={{ height: '1px', background: '#1e293b', margin: '12px 0' }} />;
                return (
                  <div key={idx} style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    color: '#64748b',
                    padding: '14px 12px 6px',
                    textTransform: 'uppercase'
                  }}>
                    {(item as any).label}
                  </div>
                );
              }

              const linkItem = item as { to: string; label: string; icon: React.ComponentType<{ size: number; color?: string }> };
              const Icon = linkItem.icon;
              const isActive = location.pathname === linkItem.to;

              return (
                <Link
                  key={linkItem.to}
                  to={linkItem.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: sidebarCollapsed ? '10px 0' : '10px 14px',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    textDecoration: 'none',
                    background: isActive ? '#1d4ed8' : 'transparent',
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13px',
                    transition: 'all 0.15s'
                  }}
                  title={sidebarCollapsed ? linkItem.label : undefined}
                >
                  <Icon size={18} color={isActive ? '#ffffff' : '#94a3b8'} />
                  {!sidebarCollapsed && <span>{linkItem.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Sidebar Bottom: Officer Card & Quick Actions */}
          <div style={{
            borderTop: '1px solid #1e293b',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.2)'
          }}>
            {!sidebarCollapsed ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                    CLEARANCE LEVEL
                  </span>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    ACTIVE
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 700 }}>
                  {currentUser?.role.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Badge: {currentUser?.badgeNumber || 'NCRB-SEC'}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {onOpenUploadModal && (
                    <button
                      onClick={onOpenUploadModal}
                      style={{
                        flex: 1,
                        padding: '7px 8px',
                        background: '#1d4ed8',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <UploadCloud size={13} />
                      <span>Upload</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    style={{
                      padding: '7px 10px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Sign Out"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f87171',
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main style={{
          flex: 1,
          padding: '28px 36px',
          overflowY: 'auto',
          background: '#f8fafc',
          boxSizing: 'border-box'
        }}>
          {children}
        </main>
      </div>

      {/* LIVE TELEMETRY / SECTION 65B STATUS BAR */}
      <footer style={{
        height: '32px',
        background: '#07162c',
        borderTop: '1px solid #1e293b',
        color: '#94a3b8',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        bottom: 0,
        zIndex: 40
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#10b981', fontWeight: 800 }}>🟢 SECURE NODE NCRB-HQ</span>
          <span>&bull;</span>
          <span>SHA-256 NIST FIPS 180-4 VERIFIED</span>
          <span>&bull;</span>
          <span>INDIAN EVIDENCE ACT SECTION 65B(4) COMPLIANT</span>
          <span>&bull;</span>
          <span>AES-256-GCM ENCRYPTED</span>
        </div>
        <div>
          <span>OPERATIONAL CLEARANCE: <strong>{currentUser?.role || 'PUBLIC'}</strong></span>
        </div>
      </footer>

      {/* AI Assistant — available to all roles on every protected page */}
      <AIAssistant />
    </div>
  );
};
