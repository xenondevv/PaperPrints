'use client';

export default function SocialSidebar() {
  const socials = [
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/paperprints.store?igsh=MXRkaXh2MXh0OHJ0YQ==',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/company/paper-prints-store/',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="hidden md:flex"
      style={{
        position: 'fixed',
        left: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 30,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        background: '#1C1A16',
        borderRadius: 28,
        padding: '12px 8px',
        boxShadow: '0 4px 20px rgba(26,24,20,0.15)',
      }}
    >
      {socials.map((s, i) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            color: 'rgba(255,255,255,0.7)',
            textDecoration: 'none',
            transition: 'color 0.2s ease, background 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#22C55E';
            e.currentTarget.style.background = 'rgba(34,197,94,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {s.icon}
        </a>
      ))}
    </div>
  );
}
