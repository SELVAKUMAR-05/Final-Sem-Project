import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  CheckCircle2,
  Lock,
  UserCheck,
  AlertTriangle,
  X
} from 'lucide-react';

interface MockOfficer {
  id: number;
  username: string;
  fullName: string;
  role: string;
  department: string;
  badgeNumber: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED';
  pkiStatus: 'VALID' | 'PENDING';
}

export const AdminUsersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [officers, setOfficers] = useState<MockOfficer[]>([
    {
      id: 1,
      username: 'admin',
      fullName: 'Vikramaditya Sharma',
      role: 'ADMIN',
      department: 'Ministry of Home Affairs - IT Cell',
      badgeNumber: 'MHA-ADM-001',
      email: 'admin@mha.gov.in',
      status: 'ACTIVE',
      pkiStatus: 'VALID'
    },
    {
      id: 2,
      username: 'police',
      fullName: 'Inspector Rajesh Deshmukh',
      role: 'POLICE_OFFICER',
      department: 'Cyber Crime Investigation Cell, Delhi',
      badgeNumber: 'DL-POL-4412',
      email: 'rajesh.deshmukh@delhipolice.gov.in',
      status: 'ACTIVE',
      pkiStatus: 'VALID'
    },
    {
      id: 3,
      username: 'forensics',
      fullName: 'Dr. Sunita Sen',
      role: 'FORENSIC_EXAMINER',
      department: 'Central Forensic Science Laboratory (CFSL)',
      badgeNumber: 'CFSL-BIO-109',
      email: 'sunita.sen@cfsl.gov.in',
      status: 'ACTIVE',
      pkiStatus: 'VALID'
    },
    {
      id: 4,
      username: 'lawyer',
      fullName: 'Advocate Ananya Roy',
      role: 'LAWYER',
      department: 'Directorate of Prosecution, High Court',
      badgeNumber: 'BAR-DEL-9081',
      email: 'ananya.roy@delhicourts.nic.in',
      status: 'ACTIVE',
      pkiStatus: 'VALID'
    },
    {
      id: 5,
      username: 'court',
      fullName: 'Hon. Magistrate S. K. Verma',
      role: 'COURT_CLERK',
      department: 'Special CBI / Judicial Court 3',
      badgeNumber: 'JUD-DL-033',
      email: 'sk.verma@delhicourts.nic.in',
      status: 'ACTIVE',
      pkiStatus: 'VALID'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [newUsername, setNewUsername] = useState<string>('');
  const [newFullName, setNewFullName] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('POLICE_OFFICER');
  const [newDepartment, setNewDepartment] = useState<string>('Delhi Police Cyber Cell');
  const [newBadge, setNewBadge] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');

  const handleAddOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newFullName || !newBadge || !newEmail) return;

    const newOff: MockOfficer = {
      id: Date.now(),
      username: newUsername,
      fullName: newFullName,
      role: newRole,
      department: newDepartment,
      badgeNumber: newBadge,
      email: newEmail,
      status: 'ACTIVE',
      pkiStatus: 'VALID'
    };

    setOfficers([...officers, newOff]);
    setShowAddModal(false);
    showToast(`Officer account ${newFullName} provisioned with PKI certificate`, 'success');

    // Reset
    setNewUsername('');
    setNewFullName('');
    setNewBadge('');
    setNewEmail('');
  };

  const handleToggleStatus = (id: number) => {
    setOfficers(
      officers.map((o) =>
        o.id === id ? { ...o, status: o.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : o
      )
    );
    showToast('Officer account authorization toggled', 'info');
  };

  const filteredOfficers = officers.filter((o) => {
    const matchesSearch =
      o.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || o.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Administration' }, { label: 'Officer Clearance & Accounts' }]} />

      {/* Header */}
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

      {/* Search and Filters */}
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
            onChange={(e) => setRoleFilter(e.target.value)}
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
            <option value="FORENSIC_EXAMINER">Forensic Specialist</option>
            <option value="LAWYER">Prosecutor / Legal Counsel</option>
            <option value="COURT_CLERK">Judicial Officer</option>
          </select>
        </div>
      </div>

      {/* Table */}
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
            {filteredOfficers.map((off) => (
              <tr key={off.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{off.fullName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>@{off.username} &bull; {off.email}</div>
                </td>
                <td style={{ padding: '14px 18px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#1d4ed8' }}>
                  {off.badgeNumber}
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 800 }}>
                    {off.role}
                  </span>
                </td>
                <td style={{ padding: '14px 18px', color: '#475569' }}>
                  {off.department}
                </td>
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
                      background: off.status === 'ACTIVE' ? '#ecfdf5' : '#fee2e2',
                      color: off.status === 'ACTIVE' ? '#065f46' : '#991b1b'
                    }}
                  >
                    {off.status}
                  </span>
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleToggleStatus(off.id)}
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    {off.status === 'ACTIVE' ? 'Suspend Access' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Provision Modal */}
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
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Provision Officer Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
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
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Inspector Alok Verma"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
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
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. averma"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
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
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder="e.g. DL-POL-9812"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    System Role *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="POLICE_OFFICER">Police Officer</option>
                    <option value="FORENSIC_EXAMINER">Forensic Examiner</option>
                    <option value="LAWYER">Prosecutor / Lawyer</option>
                    <option value="COURT_CLERK">Court Clerk</option>
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
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="e.g. State Cyber Cell Division 2"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Official Email Address *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. alok.verma@mha.gov.in"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
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
    </div>
  );
};
