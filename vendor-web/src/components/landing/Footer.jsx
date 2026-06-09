import Image from 'next/image';
import Link from 'next/link';
import { CONFIG, scrollToSection } from './config';

const platformLinks = [
  { label: 'How it Works', target: 'how-it-works' },
  { label: 'Why PaperPrints', target: 'why' },
  { label: 'Download App', target: 'download' },
];

const vendorLinks = [
  { label: 'Register Your Shop', target: 'for-shops' },
  { label: 'For Print Shops', target: 'for-shops' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Refund Policy', href: '/refund-policy' },
];

export default function Footer() {
  return (
    <footer style={{ background: '#1C1A16', padding: '60px 24px 40px' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40, marginBottom: 64 }}>
          <style jsx>{`
            @media (min-width: 768px) {
              .footer-grid { grid-template-columns: 2fr 1fr 1fr !important; gap: 48px !important; }
            }
            @media (max-width: 767px) {
              .footer-grid { text-align: center !important; }
              .footer-logo { margin: 0 auto !important; }
              .footer-links { display: flex !important; flex-wrap: wrap !important; justify-content: center !important; gap: 16px !important; }
              .footer-bottom { justify-content: center !important; }
            }
          `}</style>
          <div>
            <div className="footer-logo" style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: '#FFFFFF', margin: '0 auto 0 0' }}>
              <Image
                src="/main_logo.png"
                alt="PaperPrints"
                width={160}
                height={160}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.2)' }}
              />
            </div>

            <p style={{ 
              fontFamily: "'Courier New', Courier, monospace", 
              fontSize: 13, 
              color: 'rgba(255,255,255,0.3)', 
              marginTop: 16 
            }}>
              skip the line. just print.
            </p>
            <a
              href={`mailto:${CONFIG.CONTACT_EMAIL}`}
              className="inline-block mt-8 no-underline transition-colors duration-200"
              style={{ 
                fontFamily: "'Courier New', Courier, monospace", 
                fontSize: 13, 
                color: 'rgba(255,255,255,0.4)' 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
            >
              {CONFIG.CONTACT_EMAIL}
            </a>
          </div>

          <div>
            <ul className="footer-links list-none p-0 m-0" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {platformLinks.map((l) => (
                <li key={l.target}>
                  <button
                    onClick={() => scrollToSection(l.target)}
                    className="bg-transparent border-none cursor-pointer transition-colors duration-200 p-0 text-left"
                    style={{ 
                      fontFamily: "'Courier New', Courier, monospace", 
                      fontSize: 13, 
                      color: 'rgba(255,255,255,0.4)' 
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ul className="footer-links list-none p-0 m-0" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {vendorLinks.map((l) => (
                <li key={l.label}>
                  <button
                    onClick={() => scrollToSection(l.target)}
                    className="bg-transparent border-none cursor-pointer transition-colors duration-200 p-0 text-left"
                    style={{ 
                      fontFamily: "'Courier New', Courier, monospace", 
                      fontSize: 13, 
                      color: 'rgba(255,255,255,0.4)' 
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                  >
                    {l.label}
                  </button>
                </li>
              ))}
              <li>
                <a
                  href={CONFIG.VENDOR_LOGIN_URL}
                  className="no-underline transition-colors duration-200"
                  style={{ 
                    fontFamily: "'Courier New', Courier, monospace", 
                    fontSize: 13, 
                    color: 'rgba(255,255,255,0.4)' 
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  Vendor Login
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', marginBottom: 40, justifyContent: 'center' }}>
          {legalLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                textDecoration: 'none',
                letterSpacing: '0.04em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', marginBottom: 32 }} />

        {/* Bottom */}
        <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: "'Courier New', Courier, monospace", color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>© 2026 PaperPrints. All rights reserved.</span>
          <span style={{ fontFamily: "'Courier New', Courier, monospace", color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Made with ♥ in India</span>
        </div>
      </div>
    </footer>
  );
}
