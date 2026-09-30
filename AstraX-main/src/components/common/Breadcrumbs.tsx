import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: '#64748b',
        marginBottom: '16px',
        fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      <Link
        to="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: '#64748b',
          textDecoration: 'none',
          transition: 'color 0.15s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#1d4ed8')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
      >
        <Home size={13} />
        <span>Dashboard</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight size={13} color="#94a3b8" />
            {isLast || !item.to ? (
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{item.label}</span>
            ) : (
              <Link
                to={item.to}
                style={{
                  color: '#64748b',
                  textDecoration: 'none',
                  transition: 'color 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1d4ed8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
