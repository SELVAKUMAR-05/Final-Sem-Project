import React, { useEffect, useRef, useState } from 'react';
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
  Camera,
  X,
  Move,
  ZoomIn
} from 'lucide-react';

interface CropImage {
  file: File;
  url: string;
  width: number;
  height: number;
}

interface CropOffset {
  x: number;
  y: number;
}

const CROP_VIEW_SIZE = 280;
const CROP_OUTPUT_SIZE = 512;

export const ProfilePage: React.FC = () => {
  const { currentUser, profilePhotoUrl, uploadProfilePhoto } = useAuth();
  const { showToast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cropImageRef = useRef<CropImage | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; offset: CropOffset } | null>(null);
  const [cropImage, setCropImage] = useState<CropImage | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => () => {
    if (cropImageRef.current) URL.revokeObjectURL(cropImageRef.current.url);
  }, []);

  const handlePhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    if (cropImageRef.current) URL.revokeObjectURL(cropImageRef.current.url);
    const url = URL.createObjectURL(photo);
    const image = new Image();
    image.onload = () => {
      const selectedImage = { file: photo, url, width: image.naturalWidth, height: image.naturalHeight };
      cropImageRef.current = selectedImage;
      setCropImage(selectedImage);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      showToast('Unable to open this image. Please choose another photo.', 'error');
    };
    image.src = url;
  };

  const closeCropDialog = () => {
    if (cropImageRef.current) URL.revokeObjectURL(cropImageRef.current.url);
    cropImageRef.current = null;
    setCropImage(null);
    setCropOffset({ x: 0, y: 0 });
    setCropZoom(1);
  };

  useEffect(() => {
    if (!cropImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isUploadingPhoto) closeCropDialog();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cropImage, isUploadingPhoto]);

  const handleCropZoomChange = (zoom: number) => {
    setCropZoom(zoom);
    if (!cropImage) return;

    const scale = Math.max(CROP_VIEW_SIZE / cropImage.width, CROP_VIEW_SIZE / cropImage.height) * zoom;
    const maxX = Math.max(0, (cropImage.width * scale - CROP_VIEW_SIZE) / 2);
    const maxY = Math.max(0, (cropImage.height * scale - CROP_VIEW_SIZE) / 2);
    setCropOffset((offset) => ({
      x: Math.max(-maxX, Math.min(maxX, offset.x)),
      y: Math.max(-maxY, Math.min(maxY, offset.y)),
    }));
  };

  const handleCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!cropImage) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = { x: event.clientX, y: event.clientY, offset: cropOffset };
  };

  const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;
    if (!cropImage || !dragStart) return;

    const scale = Math.max(CROP_VIEW_SIZE / cropImage.width, CROP_VIEW_SIZE / cropImage.height) * cropZoom;
    const maxX = Math.max(0, (cropImage.width * scale - CROP_VIEW_SIZE) / 2);
    const maxY = Math.max(0, (cropImage.height * scale - CROP_VIEW_SIZE) / 2);
    setCropOffset({
      x: Math.max(-maxX, Math.min(maxX, dragStart.offset.x + event.clientX - dragStart.x)),
      y: Math.max(-maxY, Math.min(maxY, dragStart.offset.y + event.clientY - dragStart.y)),
    });
  };

  const saveCroppedPhoto = async () => {
    if (!cropImage || isUploadingPhoto) return;

    try {
      setIsUploadingPhoto(true);
      const image = new Image();
      image.src = cropImage.url;
      await image.decode();

      const scale = Math.max(CROP_VIEW_SIZE / cropImage.width, CROP_VIEW_SIZE / cropImage.height) * cropZoom;
      const sourceSize = CROP_VIEW_SIZE / scale;
      const sourceX = (cropImage.width - sourceSize) / 2 - cropOffset.x / scale;
      const sourceY = (cropImage.height - sourceSize) / 2 - cropOffset.y / scale;
      const canvas = document.createElement('canvas');
      canvas.width = CROP_OUTPUT_SIZE;
      canvas.height = CROP_OUTPUT_SIZE;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Unable to prepare the cropped profile photo.');

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        CROP_OUTPUT_SIZE,
        CROP_OUTPUT_SIZE
      );

      const croppedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Unable to create the cropped profile photo.'));
        }, 'image/jpeg', 0.92);
      });

      const croppedPhoto = new File([croppedBlob], `${cropImage.file.name.replace(/\.[^.]+$/, '')}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      await uploadProfilePhoto(croppedPhoto);
      closeCropDialog();
      showToast('Profile photo updated successfully.', 'success');
    } catch (error) {
      console.error('Failed to crop or upload profile photo:', error);
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
            JPEG, PNG, or WebP · up to 5 MB · crop before saving
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

      {cropImage && (
        <div className="photo-crop-backdrop" onClick={() => !isUploadingPhoto && closeCropDialog()}>
          <section
            className="photo-crop-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-crop-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="photo-crop-dialog__header">
              <div>
                <span className="photo-crop-dialog__eyebrow">PROFILE PHOTO</span>
                <h2 id="photo-crop-title">Adjust your photo</h2>
                <p>Drag the image to choose what appears in your profile.</p>
              </div>
              <button
                type="button"
                className="photo-crop-dialog__close"
                onClick={closeCropDialog}
                disabled={isUploadingPhoto}
                aria-label="Cancel photo crop"
              >
                <X size={19} />
              </button>
            </header>

            <div className="photo-crop-dialog__content">
              <div
                className="photo-crop-viewport"
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={() => { dragStartRef.current = null; }}
                onPointerCancel={() => { dragStartRef.current = null; }}
                role="img"
                aria-label="Photo crop preview. Drag to reposition the image."
              >
                <img
                  src={cropImage.url}
                  alt=""
                  draggable={false}
                  style={{
                    width: cropImage.width * Math.max(CROP_VIEW_SIZE / cropImage.width, CROP_VIEW_SIZE / cropImage.height) * cropZoom,
                    height: cropImage.height * Math.max(CROP_VIEW_SIZE / cropImage.width, CROP_VIEW_SIZE / cropImage.height) * cropZoom,
                    left: `calc(50% + ${cropOffset.x}px)`,
                    top: `calc(50% + ${cropOffset.y}px)`,
                  }}
                />
                <div className="photo-crop-viewport__hint">
                  <Move size={14} />
                  <span>Drag to reposition</span>
                </div>
              </div>

              <label className="photo-crop-zoom">
                <span><ZoomIn size={16} /> Zoom</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={cropZoom}
                  onChange={(event) => handleCropZoomChange(Number(event.target.value))}
                  aria-label="Zoom photo"
                />
                <output>{Math.round(cropZoom * 100)}%</output>
              </label>

              <p className="photo-crop-dialog__note">
                The circular preview shows the area that will appear in your profile.
              </p>
            </div>

            <footer className="photo-crop-dialog__actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeCropDialog}
                disabled={isUploadingPhoto}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void saveCroppedPhoto()}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? 'Saving photo…' : 'Save profile photo'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};
