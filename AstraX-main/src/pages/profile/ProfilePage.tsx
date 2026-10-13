import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Breadcrumbs } from '../../components/common/Breadcrumbs.tsx';
import { useToast } from '../../components/common/Toast.tsx';
import {
  User,
  ShieldCheck,
  KeyRound,
  FileCheck,
  Building,
  Mail,
  Award,
  CheckCircle2,
  Calendar,
  Camera
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser, profilePhotoUrl, uploadProfilePhoto } = useAuth();
  const { showToast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const photo = event.target.files?.[0];
    event.target.value = '';
    if (!photo) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(photo.type)) {
      showToast('Choose a JPEG, PNG, or WebP image.', 'error');
      return;
    }
    if (photo.size > 5 * 1024 * 1024) {
      showToast('Profile photos must be 5 MB or smaller.', 'error');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      await uploadProfilePhoto(photo);
      showToast('Profile photo updated successfully.', 'success');
    } catch (error) {
      console.error('Failed to upload profile photo:', error);
      showToast(error instanceof Error ? error.message : 'Unable to update profile photo.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Officer Profile & Credentials' }]} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
            Officer Profile &amp; Cryptographic Identity
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Official law enforcement credentials and Public Key Infrastructure (PKI) digital certificate verification.
          </p>
        </div>
      </div>

      <div className="profile-layout-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* Left ID Badge Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#eff6ff',
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '28px',
              fontWeight: 800,
              border: '2px solid #bfdbfe'
            }}
          >
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={`${currentUser?.fullName || 'Officer'} profile`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              currentUser?.fullName?.charAt(0) || 'O'
            )}
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoSelected}
            style={{ display: 'none' }}
            aria-label="Choose profile photo"
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => photoInputRef.current?.click()}
            disabled={isUploadingPhoto}
            style={{ marginBottom: '14px' }}
          >
            <Camera size={14} />
            {isUploadingPhoto ? 'Uploading photo...' : profilePhotoUrl ? 'Change photo' : 'Upload photo'}
          </button>
          <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '16px' }}>
            JPEG, PNG, or WebP · up to 5 MB
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
            {currentUser?.fullName || 'Investigating Officer'}
          </h2>

          <div
            style={{
              display: 'inline-block',
              background: '#eff6ff',
              color: '#1d4ed8',
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 800,
              marginBottom: '16px'
            }}
          >
            {currentUser?.role?.replace(/_/g, ' ') || 'POLICE_OFFICER'}
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', textAlign: 'left', fontSize: '13px' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                BADGE / OFFICER ID
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: "'JetBrains Mono', monospace" }}>
                {currentUser?.badgeNumber || 'MHA-DL-4491'}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                DEPARTMENT
              </div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                {currentUser?.department || 'Cyber Crime Investigation Division'}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                OFFICIAL EMAIL
              </div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                {currentUser?.email || 'officer@mha.gov.in'}
              </div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                SECURITY CLEARANCE
              </div>
              <div style={{ fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} />
                LEVEL 4 — RESTRICTED DOCKET
              </div>
            </div>
          </div>
        </div>

        {/* Right Details Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
              PKI Digital Signature &amp; Cryptographic Keys
            </h3>

            <div
              style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <KeyRound size={20} color="#059669" />
                <div>
                  <div style={{ fontWeight: 800, color: '#065f46', fontSize: '13px' }}>
                    Digital Certificate Status: ACTIVE &amp; VERIFIED
                  </div>
                  <div style={{ fontSize: '11px', color: '#047857' }}>
                    Issuer: National Forensic Sciences University (NFSU) Root CA
                  </div>
                </div>
              </div>
              <span
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                RSA-4096 VALID
              </span>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
              All legal document approvals, custody transfer receipts, and digital evidence certifications executed by this account are mathematically signed using this keypair under the Information Technology Act 2000.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
              Statutory Roles &amp; Responsibilities
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', marginBottom: '6px' }}>
                  Section 65B Authorizations
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Authorized to generate computer output certificates and certify digital evidence authenticity for production in court.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', marginBottom: '6px' }}>
                  Evidence Custody Protocols
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Mandated to apply tamper-evident seals and perform dual-party biometric transfers for forensic examination.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
