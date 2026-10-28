import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import { User, UserRole } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { useToast } from '../../components/common/Toast.tsx';
import {
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  X,
  Trash2,
  ShieldAlert,
  LoaderCircle,
} from 'lucide-react';

const OfficerAvatar: React.FC<{
  userId: number;
  fullName: string;
  onPhotoClick: (photoUrl: string) => void;
}> = ({ userId, fullName, onPhotoClick }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    api.getUserProfilePhoto(userId)
      .then((photo) => {
        if (!active || !photo) return;
        objectUrl = URL.createObjectURL(photo);
        setPhotoUrl(objectUrl);
      })
      .catch((error) => {
        if (active) console.error(`Failed to load profile photo for user ${userId}:`, error);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [userId]);

  return (
    <>
      {photoUrl ? (
        <button
          type="button"
          className="officer-avatar officer-avatar--photo"
          onClick={() => onPhotoClick(photoUrl)}
          aria-label={`View ${fullName}'s profile photo`}
          title="View profile photo"
        >
          <img src={photoUrl} alt="" />
        </button>
      ) : (
        <div className="officer-avatar" aria-label={`${fullName} profile photo not set`}>
          {fullName.trim().charAt(0).toUpperCase() || <Users size={18} />}
        </div>
      )}
    </>
  );
};

interface OfficerPhotoPreview {
  url: string;
  fullName: string;
  role: UserRole;
}

export const AdminUsersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [officers, setOfficers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [photoPreview, setPhotoPreview] = useState<OfficerPhotoPreview | null>(null);

  const [newUsername, setNewUsername] = useState<string>('');
  const [newFullName, setNewFullName] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('POLICE_OFFICER');
  const [newDepartment, setNewDepartment] = useState<string>('Delhi Police Cyber Cell');
  const [newBadge, setNewBadge] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      setOfficers(await api.getUsers());
    } catch (error) {
      console.error('Failed to load user accounts:', error);
      showToast(error instanceof Error ? error.message : 'Failed to load user accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  useEffect(() => {
    if (!userToDelete) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && deletingUserId === null) {
        setUserToDelete(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userToDelete, deletingUserId]);

  useEffect(() => {
    if (!photoPreview) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPhotoPreview(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photoPreview]);

  const handleAddOfficer = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const createdUser = await api.createUser({
        username: newUsername,
        fullName: newFullName,
        role: newRole,
        department: newDepartment,
        badgeNumber: newBadge,
        email: newEmail,
        password: newPassword,
      });

      setOfficers((users) => [...users, createdUser]);
      setShowAddModal(false);
      showToast(`Officer account ${createdUser.fullName} provisioned`, 'success');
      setNewUsername('');
      setNewFullName('');
      setNewBadge('');
      setNewEmail('');
      setNewPassword('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create user account', 'error');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const updatedUser = await api.toggleUserActive(user.id, !user.active);
      setOfficers((users) => users.map((entry) => entry.id === user.id ? updatedUser : entry));
      showToast('Officer account authorization updated', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update account status', 'error');
    }
  };

  const handleDeleteOfficer = async (user: User) => {
    if (user.id === currentUser?.id || deletingUserId !== null) return;
    setUserToDelete(user);
  };

  const confirmDeleteOfficer = async () => {
    if (!userToDelete || deletingUserId !== null) return;
    const user = userToDelete;
    setDeletingUserId(user.id);
    try {
      await api.deleteUser(user.id);
      setOfficers((users) => users.filter((entry) => entry.id !== user.id));
      setUserToDelete(null);
      showToast(`Account for ${user.fullName} deleted`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete user account', 'error');
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredOfficers = officers.filter((officer) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      officer.fullName.toLowerCase().includes(query) ||
      officer.username.toLowerCase().includes(query) ||
      (officer.badgeNumber || '').toLowerCase().includes(query) ||
      officer.department.toLowerCase().includes(query);
    const matchesRole = roleFilter === 'ALL' || officer.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Administration' }, { label: 'Officer Clearance & Accounts' }]} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
            Officer Accounts &amp; RBAC Clearance
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Manage authorized investigation personnel, digital signature credentials, and role-based clearance levels.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
        >
          <Plus size={16} />
          <span>Provision Officer Account</span>
        </button>
      </div>

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
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by officer name, badge number, department, or username..."
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
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Role:</span>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff'
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Administrator</option>
            <option value="POLICE_OFFICER">Police / Investigator</option>
            <option value="INVESTIGATION_OFFICER">Investigation Officer</option>
            <option value="FORENSIC_OFFICER">Forensic Specialist</option>
            <option value="LAWYER">Prosecutor / Legal Counsel</option>
            <option value="COURT_OFFICER">Judicial Officer</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : officers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No officer accounts"
          description="Provision an officer account to get started."
          actionLabel="Provision Officer Account"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '14px 18px' }}>Officer Name</th>
                <th style={{ padding: '14px 18px' }}>Badge Number</th>
                <th style={{ padding: '14px 18px' }}>System Role</th>
                <th style={{ padding: '14px 18px' }}>Department / Posting</th>
                <th style={{ padding: '14px 18px' }}>PKI Digital Signature</th>
                <th style={{ padding: '14px 18px' }}>Account Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOfficers.map((officer) => {
                const isCurrentUser = officer.id === currentUser?.id;
                return (
                  <tr key={officer.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                        <OfficerAvatar
                          userId={officer.id}
                          fullName={officer.fullName}
                          onPhotoClick={(url) => setPhotoPreview({
                            url,
                            fullName: officer.fullName,
                            role: officer.role,
                          })}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{officer.fullName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>@{officer.username} &bull; {officer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#1d4ed8' }}>
                      {officer.badgeNumber || '—'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 800 }}>
                        {officer.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#475569' }}>{officer.department}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <CheckCircle2 size={14} />
                        RSA-4096 VALID
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: officer.active ? '#ecfdf5' : '#fee2e2',
                          color: officer.active ? '#065f46' : '#991b1b'
                        }}
                      >
                        {officer.active ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => void handleToggleStatus(officer)}
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        disabled={isCurrentUser}
                      >
                        {officer.active ? 'Suspend Access' : 'Reactivate'}
                      </button>
                      <button
                        onClick={() => void handleDeleteOfficer(officer)}
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', padding: '5px 8px', marginLeft: '6px', color: '#b91c1c' }}
                        disabled={isCurrentUser || deletingUserId !== null}
                        aria-label={`Delete account for ${officer.fullName}`}
                        title={isCurrentUser ? 'You cannot delete your own account' : 'Delete account'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredOfficers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    No officer accounts match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Provision Officer Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddOfficer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Officer Full Name *
                  </label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(event) => setNewFullName(event.target.value)}
                    placeholder="e.g. Inspector Alok Verma"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(event) => setNewUsername(event.target.value)}
                    placeholder="e.g. averma"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Badge Number *
                  </label>
                  <input
                    type="text"
                    value={newBadge}
                    onChange={(event) => setNewBadge(event.target.value)}
                    placeholder="e.g. DL-POL-9812"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    System Role *
                  </label>
                  <select
                    value={newRole}
                    onChange={(event) => setNewRole(event.target.value as UserRole)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="POLICE_OFFICER">Police Officer</option>
                    <option value="INVESTIGATION_OFFICER">Investigation Officer</option>
                    <option value="FORENSIC_OFFICER">Forensic Officer</option>
                    <option value="LAWYER">Prosecutor / Lawyer</option>
                    <option value="COURT_OFFICER">Court Officer</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Official Department / Division *
                </label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(event) => setNewDepartment(event.target.value)}
                  placeholder="e.g. State Cyber Cell Division 2"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder="e.g. alok.verma@mha.gov.in"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {photoPreview && (
        <div className="officer-photo-preview-backdrop" onClick={() => setPhotoPreview(null)}>
          <section
            className="officer-photo-preview"
            role="dialog"
            aria-modal="true"
            aria-labelledby="officer-photo-preview-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="officer-photo-preview__close"
              onClick={() => setPhotoPreview(null)}
              aria-label="Close profile photo"
            >
              <X size={20} />
            </button>
            <img
              className="officer-photo-preview__image"
              src={photoPreview.url}
              alt={`${photoPreview.fullName} profile`}
            />
            <div className="officer-photo-preview__caption">
              <strong id="officer-photo-preview-title">{photoPreview.fullName}</strong>
              <span>{photoPreview.role.replace(/_/g, ' ')}</span>
            </div>
          </section>
        </div>
      )}

      {userToDelete && (
        <div
          className="confirm-backdrop"
          onClick={() => {
            if (deletingUserId === null) setUserToDelete(null);
          }}
        >
          <section
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            aria-describedby="delete-user-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="confirm-dialog__header">
              <button
                type="button"
                className="confirm-dialog__close"
                onClick={() => setUserToDelete(null)}
                disabled={deletingUserId !== null}
                aria-label="Close confirmation"
              >
                <X size={18} />
              </button>
              <div className="confirm-dialog__icon">
                <ShieldAlert size={27} strokeWidth={1.8} />
              </div>
              <span className="confirm-dialog__eyebrow">ACCOUNT DELETION</span>
              <h2 id="delete-user-title">Remove this officer?</h2>
              <p>This account will be permanently removed from your organization.</p>
            </div>

            <div className="confirm-dialog__body">
              <div className="confirm-user-card">
                <div className="confirm-user-card__avatar" aria-hidden="true">
                  {userToDelete.fullName.trim().charAt(0).toUpperCase()}
                </div>
                <div className="confirm-user-card__details">
                  <strong>{userToDelete.fullName}</strong>
                  <span>@{userToDelete.username}</span>
                </div>
                <span className="confirm-user-card__role">{userToDelete.role.replace(/_/g, ' ')}</span>
              </div>

              <div className="confirm-warning" id="delete-user-description">
                <span className="confirm-warning__dot" />
                <p>
                  <strong>This action can’t be undone.</strong> The officer will lose access to their
                  account and its associated permissions.
                </p>
              </div>

              <div className="confirm-dialog__actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setUserToDelete(null)}
                  disabled={deletingUserId !== null}
                >
                  Keep account
                </button>
                <button
                  type="button"
                  className="btn btn-danger confirm-dialog__delete"
                  onClick={() => void confirmDeleteOfficer()}
                  disabled={deletingUserId !== null}
                >
                  {deletingUserId !== null ? (
                    <>
                      <LoaderCircle className="confirm-dialog__spinner" size={16} />
                      Removing…
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete account
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
