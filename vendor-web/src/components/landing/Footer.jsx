import Image from 'next/image';
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

export default function Footer() {
  return (
    <footer style={{ background: '#1C1A16', padding: '60px 24px 40px' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Col 1 – Brand */}
          <div className="md:col-span-2">
            <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: '#FFFFFF', position: 'relative' }}>
              <Image
                src="/main_logo.png"
                alt="PaperPrints"
                width={160}
                height={160}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15)' }}
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

          {/* Col 2 – Platform */}
          <div>
            <ul className="space-y-4 list-none p-0 m-0">
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

          {/* Col 3 – Vendors */}
          <div>
            <ul className="space-y-4 list-none p-0 m-0">
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

        {/* Divider */}
        <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', marginBottom: 32 }} />

        {/* Bottom */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <span style={{ fontFamily: "'Courier New', Courier, monospace", color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>© 2026 PaperPrints. All rights reserved.</span>
          <span style={{ fontFamily: "'Courier New', Courier, monospace", color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Made with ♥ in India</span>
        </div>
      </div>
    </footer>
  );
}
