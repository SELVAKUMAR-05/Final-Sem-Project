import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';
import { api, getStoredToken, setStoredToken } from '../services/api.ts';

export interface AuthContextType {
  currentUser: User | null;
  profilePhotoUrl: string | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (userData: {
    fullName: string;
    username: string;
    email: string;
    department: string;
    role: string;
    password: string;
  }) => Promise<{ status: number; message: string; user: User }>;
  forgotPassword: (email: string) => Promise<{ status: number; message: string }>;
  logout: () => void;
  switchRoleShortcut: (role: UserRole) => Promise<void>;
  uploadProfilePhoto: (photo: File) => Promise<void>;
  unauthorizedAlert: string | null;
  setUnauthorizedAlert: (msg: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Pre-configured demo credentials map for developer / hackathon testing
export const DEMO_CREDENTIALS: Record<UserRole, { username: string; pass: string; title: string; desc: string }> = {
  ADMIN: {
    username: 'admin@secure-dms.local',
    pass: 'admin123',
    title: 'Dr. Rajesh Sharma',
    desc: 'System Administrator (Full Clearance)',
  },
  POLICE_OFFICER: {
    username: 'police@secure-dms.local',
    pass: 'police123',
    title: 'Inspector K. Arumugam',
    desc: 'Police Station Officer (First Responder)',
  },
  INVESTIGATION_OFFICER: {
    username: 'investigator@secure-dms.local',
    pass: 'invest123',
    title: 'DSP Sunita Rao',
    desc: 'Senior Investigating Officer (Lead Detective)',
  },
  FORENSIC_OFFICER: {
    username: 'forensic@secure-dms.local',
    pass: 'forensic123',
    title: 'Dr. Priya Nambiar',
    desc: 'CFSL Forensic Scientist (Evidence Custodian)',
  },
  LAWYER: {
    username: 'lawyer@secure-dms.local',
    pass: 'lawyer123',
    title: 'Adv. Vikram Malhotra',
    desc: 'Prosecution / Defense Counsel',
  },
  COURT_OFFICER: {
    username: 'court@secure-dms.local',
    pass: 'court123',
    title: 'Registrar Justice Meenakshi',
    desc: 'Sessions Court Judicial Registrar',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [profilePhotoVersion, setProfilePhotoVersion] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unauthorizedAlert, setUnauthorizedAlert] = useState<string | null>(null);

  useEffect(() => {
    async function verifyExistingSession() {
      const stored = getStoredToken();
      if (stored) {
        try {
          const user = await api.getCurrentUser();
          setCurrentUser(user);
          setToken(stored);
        } catch (err) {
          console.warn('Existing session token invalid or expired. Session cleared.');
          setStoredToken(null);
          setToken(null);
          setCurrentUser(null);
        }
      } else {
        setToken(null);
        setCurrentUser(null);
      }
      setIsLoading(false);
    }
    verifyExistingSession();
  }, []);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setProfilePhotoUrl(null);

    if (!currentUser) {
      return () => {
        active = false;
      };
    }

    api.getProfilePhoto()
      .then((photo) => {
        if (!active || !photo) return;
        objectUrl = URL.createObjectURL(photo);
        setProfilePhotoUrl(objectUrl);
      })
      .catch((error) => {
        if (active) console.error('Failed to load profile photo:', error);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [currentUser?.id, profilePhotoVersion]);

  const uploadProfilePhoto = async (photo: File) => {
    await api.uploadProfilePhoto(photo);
    setProfilePhotoVersion((version) => version + 1);
  };

  const login = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    setUnauthorizedAlert(null);
    try {
      const res = await api.login(username, password);
      setToken(res.token);
      const user = await api.getCurrentUser();
      setCurrentUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    fullName: string;
    username: string;
    email: string;
    department: string;
    role: string;
    password: string;
  }) => {
    return api.register(userData);
  };

  const forgotPassword = async (email: string) => {
    return api.forgotPassword(email);
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setCurrentUser(null);
    setUnauthorizedAlert(null);
  };

  const switchRoleShortcut = async (role: UserRole) => {
    setIsLoading(true);
    setUnauthorizedAlert(null);
    try {
      const cred = DEMO_CREDENTIALS[role];
      const res = await api.login(cred.username, cred.pass);
      setToken(res.token);
      const user = await api.getCurrentUser();
      setCurrentUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profilePhotoUrl,
        token,
        isLoading,
        isAuthenticated: Boolean(currentUser && token),
        login,
        register,
        forgotPassword,
        logout,
        switchRoleShortcut,
        uploadProfilePhoto,
        unauthorizedAlert,
        setUnauthorizedAlert,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
