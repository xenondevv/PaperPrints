'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CONFIG, scrollToSection } from './config';

const navLinks = [
  { label: 'How it Works', target: 'how-it-works' },
  { label: 'Why Us', target: 'why' },
  { label: 'For Shops', target: 'for-shops' },
];

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [hoverIdx, setHoverIdx] = useState(-1);
  const pillRef = useRef(null);
  const linksRef = useRef([]);

  /* Track scroll to add shadow + detect active section */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);

      // Detect which section is closest to viewport center
      const sectionIds = navLinks.map((l) => l.target);
      let closest = '';
      let closestDist = Infinity;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - 120);
        if (dist < closestDist && rect.top < window.innerHeight * 0.6) {
          closestDist = dist;
          closest = id;
        }
      }
      setActiveSection(closest);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Move the pill indicator behind the active/hovered link */
  useEffect(() => {
    const idx = hoverIdx >= 0 ? hoverIdx : navLinks.findIndex((l) => l.target === activeSection);
    const pill = pillRef.current;
    const link = linksRef.current[idx];
    if (pill && link) {
      const parentRect = pill.parentElement.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      pill.style.opacity = '1';
      pill.style.width = `${linkRect.width + 20}px`;
      pill.style.transform = `translateX(${linkRect.left - parentRect.left - 10}px)`;
    } else if (pill) {
      pill.style.opacity = '0';
    }
  }, [hoverIdx, activeSection]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          height: 60,
          background: scrolled ? 'rgba(240,237,230,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(26,24,20,0.08)' : '1px solid transparent',
          transition: 'background 0.3s ease, backdrop-filter 0.3s ease, border-bottom 0.3s ease, box-shadow 0.3s ease',
          boxShadow: scrolled ? '0 1px 8px rgba(26,24,20,0.04)' : 'none',
        }}
      >
        <div style={{ maxWidth: 1152, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '100%' }}>
          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', mixBlendMode: 'multiply', flexShrink: 0 }}>
              <Image
                src="/main_logo.png"
                alt="PaperPrints"
                width={160}
                height={160}
                style={{ width: 40, height: 40, objectFit: 'cover' }}
              />
            </div>
            <span style={{
              fontFamily: 'Georgia, serif',
              fontSize: 18,
              fontWeight: 700,
              color: '#1A1814',
              letterSpacing: '-0.02em',
            }}>
              PaperPrints
            </span>
          </a>

          {/* Center links – desktop with sliding pill */}
          <div className="hidden lg:flex" style={{ position: 'relative', alignItems: 'center', gap: 4 }}>
            {/* Sliding pill background */}
            <div
              ref={pillRef}
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                height: 36,
                marginTop: -18,
                background: 'rgba(26,24,20,0.06)',
                borderRadius: 18,
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease',
                opacity: 0,
                pointerEvents: 'none',
              }}
            />
            {navLinks.map((l, i) => {
              const isActive = activeSection === l.target;
              return (
                <button
                  key={l.target}
                  ref={(el) => { linksRef.current[i] = el; }}
                  onClick={() => scrollToSection(l.target)}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(-1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 16px',
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 13,
                    letterSpacing: '0.04em',
                    color: isActive ? '#1A1814' : '#8A8680',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'color 0.2s ease',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {l.label}
                </button>
              );
            })}
          </div>

          {/* Right buttons – desktop */}
          <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => router.push(CONFIG.VENDOR_LOGIN_URL)}
              style={{
                background: 'none',
                border: '1.5px solid rgba(26,24,20,0.2)',
                borderRadius: 6,
                cursor: 'pointer',
                padding: '8px 18px',
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 13,
                color: '#1A1814',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1A1814'; e.currentTarget.style.background = 'rgba(26,24,20,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(26,24,20,0.2)'; e.currentTarget.style.background = 'none'; }}
            >
              Vendor Login
            </button>
            <a
              href={CONFIG.PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#1A1814',
                color: '#F0EDE6',
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 600,
                fontSize: 13,
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                cursor: 'pointer',
                filter: 'url(#roughpaper)',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#22C55E'; e.currentTarget.style.color = '#0F0F0F'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1814'; e.currentTarget.style.color = '#F0EDE6'; }}
            >
              <svg width="14" height="16" viewBox="0 0 505 584" fill="none">
                <path d="M4.93 6.81C1.77 10.07 0 15.14 0 21.84v540.32c0 6.7 1.77 11.77 4.93 15.03l.82.77L289.13 294.5v-5L5.75 6.04l-.82.77z" fill="#4285F4"/>
                <path d="M383.6 389.04L289.13 294.5v-5l94.47-94.54 2.13 1.23 111.96 63.6c31.99 18.16 31.99 47.9 0 66.08L385.73 387.8l-2.13 1.24z" fill="#FFBA00"/>
                <path d="M385.73 387.8L289.13 292 4.93 577.19c10.55 11.18 27.95 12.56 47.57 1.43L385.73 387.8" fill="#F84437"/>
                <path d="M385.73 196.2L52.5 5.38C32.88-5.75 15.48-4.37 4.93 6.81L289.13 292l96.6-95.8z" fill="#34A853"/>
              </svg>
              Get it on Google Play
            </a>
          </div>

          {/* Hamburger – mobile */}
          <button
            className="lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              filter: 'url(#roughpaper)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1814" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          transform: menuOpen ? 'scale(1)' : 'scale(0.98)',
          transition: 'opacity 200ms ease, transform 200ms ease',
          background: '#F0EDE6',
        }}
      >
        <button
          style={{
            position: 'absolute', top: 16, right: 20,
            background: 'none', border: 'none', cursor: 'pointer', padding: 8,
          }}
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1814" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {navLinks.map((l) => (
          <button
            key={l.target}
            onClick={() => { setMenuOpen(false); setTimeout(() => scrollToSection(l.target), 100); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 22, color: '#1A1814', fontWeight: 600,
            }}
          >
            {l.label}
          </button>
        ))}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16, width: 220, alignItems: 'center' }}>
          <button
            onClick={() => { setMenuOpen(false); router.push(CONFIG.VENDOR_LOGIN_URL); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Courier New', Courier, monospace", fontSize: 16, color: '#8A8680',
            }}
          >
            Vendor Login
          </button>
          <a
            href={CONFIG.PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { setMenuOpen(false); }}
            style={{
              width: '100%', cursor: 'pointer', border: 'none',
              background: '#1A1814', color: '#F0EDE6',
              fontFamily: 'system-ui, sans-serif', fontWeight: 600, fontSize: 16,
              padding: '14px 0', borderRadius: 6, filter: 'url(#roughpaper)',
              textDecoration: 'none', textAlign: 'center', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <svg width="16" height="18" viewBox="0 0 505 584" fill="none">
              <path d="M4.93 6.81C1.77 10.07 0 15.14 0 21.84v540.32c0 6.7 1.77 11.77 4.93 15.03l.82.77L289.13 294.5v-5L5.75 6.04l-.82.77z" fill="#4285F4"/>
              <path d="M383.6 389.04L289.13 294.5v-5l94.47-94.54 2.13 1.23 111.96 63.6c31.99 18.16 31.99 47.9 0 66.08L385.73 387.8l-2.13 1.24z" fill="#FFBA00"/>
              <path d="M385.73 387.8L289.13 292 4.93 577.19c10.55 11.18 27.95 12.56 47.57 1.43L385.73 387.8" fill="#F84437"/>
              <path d="M385.73 196.2L52.5 5.38C32.88-5.75 15.48-4.37 4.93 6.81L289.13 292l96.6-95.8z" fill="#34A853"/>
            </svg>
            Get it on Google Play
          </a>
        </div>
      </div>
    </>
  );
}
