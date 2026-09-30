import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { User, UserRole } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Users,
  UserPlus,
  Shield,
  Check,
  X,
  Lock,
  Building,
  Key,
} from 'lucide-react';

export const UsersAdminView: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New user form state
  const [username, setUsername] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<UserRole>('POLICE_OFFICER');
  const [department, setDepartment] = useState<string>('');
  const [badgeNumber, setBadgeNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('officer123');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (user: User) => {
    try {
      await api.toggleUserActive(user.id, !user.active);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        username,
        fullName,
        role,
        department,
        badgeNumber,
        password,
      });
      setShowAddModal(false);
      setUsername('');
      setFullName('');
      setDepartment('');
      setBadgeNumber('');
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  return (
    <div className="users-admin-view" id="ncrb-users-admin-view">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gov-navy-950)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={26} color="var(--gov-blue-600)" />
            National User Directory &amp; RBAC Access Matrix
          </h2>
          <p style={{ color: 'var(--gov-text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Role-Based Access Control administration &bull; Credential management &bull; Official personnel
          </p>
        </div>

        <button className="btn-gov btn-gov-blue" onClick={() => setShowAddModal(true)}>
          <UserPlus size={16} /> Add Verified Personnel
        </button>
      </div>

      {/* Users Table */}
      <div className="gov-table-wrap" style={{ marginBottom: '32px' }}>
        <table className="gov-table">
          <thead>
            <tr>
              <th>Personnel Name &amp; Email</th>
              <th>Role</th>
              <th>Department / Station</th>
              <th>Badge ID</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--gov-navy-950)' }}>{u.fullName}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--gov-text-muted)' }}>{u.username}</div>
                </td>

                <td>
                  <span className="badge-status info">{u.role}</span>
                </td>

                <td style={{ fontSize: '13px' }}>{u.department}</td>

                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>{u.badgeNumber}</td>

                <td>
                  <span className={`badge-status ${u.active ? 'success' : 'danger'}`}>
                    {u.active ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </td>

                <td style={{ textAlign: 'right' }}>
                  <button
                    className={`btn-gov ${u.active ? 'btn-gov-danger' : 'btn-gov-success'} btn-gov-sm`}
                    onClick={() => handleToggleActive(u)}
                    disabled={u.id === currentUser?.id}
                  >
                    {u.active ? 'Suspend Access' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RBAC Matrix Table (Section 6 & 16 of prompt) */}
      <div className="gov-card">
        <div className="gov-card-header">
          <span className="gov-card-title">
            <Shield size={18} /> Official Role-Based Access Control (RBAC) Permission Matrix
          </span>
          <span style={{ fontSize: '12px', color: 'var(--gov-text-muted)' }}>
            Ministry of Home Affairs Security Directive
          </span>
        </div>

        <div className="gov-table-wrap">
          <table className="gov-table" style={{ fontSize: '12.5px' }}>
            <thead>
              <tr>
                <th>System Role</th>
                <th>Upload Document</th>
                <th>View All Cases</th>
                <th>View Confidential Evidence</th>
                <th>Affix Digital Signature</th>
                <th>View Audit Logs</th>
                <th>Manage Users</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>ADMIN</strong></td>
                <td><Check size={16} color="#059669" /></td>
                <td><Check size={16} color="#059669" /></td>
                <td><Check size={16} color="#059669" /></td>
                <td><Check size={16} color="#059669" /></td>
                <td><Check size={16} color="#059669" /></td>
                <td><Check size={16} color="#059669" /></td>
              </tr>
              <tr>
                <td><strong>POLICE_OFFICER</strong></td>
                <td><Check size={16} color="#059669" /> (FIR/Reports)</td>
                <td><Check size={16} color="#059669" /></td>
                <td><X size={16} color="#dc2626" /></td>
                <td><Check size={16} color="#059669" /></td>
                <td><X size={16} color="#dc2626" /></td>
                <td><X size={16} color="#dc2626" /></td>
              </tr>
              <tr>
                <td><strong>INVESTIGATION_OFFICER</strong></td>
                <td><Check size={16} color="#059669" /></td>
                <td><Check size={16} color="#059669" /></td>
                <td><Check size={16} color="#059669" /></td>
                <td><Check size={16} color="#059669" /></td>
                <td><X size={16} color="#dc2626" /></td>
                <td><X size={16} color="#dc2626" /></td>
              </tr>
              <tr>
                <td><strong>FORENSIC_OFFICER</strong></td>
                <td><Check size={16} color="#059669" /> (CFSL Reports)</td>
                <td><Check size={16} color="#059669" /></td>
                <td><Check size={16} color="#059669" /></td>
                <td><Check size={16} color="#059669" /></td>
                <td><X size={16} color="#dc2626" /></td>
                <td><X size={16} color="#dc2626" /></td>
              </tr>
              <tr>
                <td><strong>LAWYER</strong></td>
                <td><Check size={16} color="#059669" /> (Court Filings)</td>
                <td><Check size={16} color="#059669" /> (Disclosed only)</td>
                <td><X size={16} color="#dc2626" /> (403 Forbidden)</td>
                <td><X size={16} color="#dc2626" /></td>
                <td><X size={16} color="#dc2626" /></td>
                <td><X size={16} color="#dc2626" /></td>
              </tr>
              <tr>
                <td><strong>COURT_OFFICER</strong></td>
                <td><Check size={16} color="#059669" /> (Judgments/Orders)</td>
                <td><Check size={16} color="#059669" /></td>
                <td><Check size={16} color="#059669" /></td>
                <td><Check size={16} color="#059669" /></td>
                <td><Check size={16} color="#059669" /></td>
                <td><X size={16} color="#dc2626" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="modal-title">Provision New Verified Personnel</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name &amp; Title:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Inspector Ramesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Official Email / Username:</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. ramesh.kumar@secure-dms.local"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">System Role:</label>
                    <select
                      className="form-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                    >
                      <option value="POLICE_OFFICER">Police Officer</option>
                      <option value="INVESTIGATION_OFFICER">Investigation Officer</option>
                      <option value="FORENSIC_OFFICER">Forensic Officer (CFSL)</option>
                      <option value="LAWYER">Lawyer / Defense Counsel</option>
                      <option value="COURT_OFFICER">Court Officer / Judge</option>
                      <option value="ADMIN">System Administrator</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Badge / Bar Council ID:</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. TN-POL-8492"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Department / Jurisdiction:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cyber Crime Cell, Bengaluru"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-gov btn-gov-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-gov btn-gov-blue">
                  Create Personnel Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
