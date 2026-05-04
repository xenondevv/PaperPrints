'use client';
import { useRouter } from 'next/navigation';
import { CONFIG } from './config';

const benefits = [
  { title: 'Zero commission during early access', desc: 'Keep every rupee you earn — no hidden fees or platform cuts.' },
  { title: 'Print orders delivered directly to your dashboard', desc: 'Orders appear in real-time with all file details attached.' },
  { title: 'Real-time sound + popup notification for every order', desc: 'Never miss an incoming order, even when multitasking.' },
  { title: 'Manage pricing, hours, and availability anytime', desc: 'Update your shop profile instantly from any device.' },
  { title: 'Works on laptop, tablet, or any browser', desc: 'No app installation required for vendors — just open and go.' },
];

export default function ForShops() {
  const router = useRouter();

  return (
    <section id="for-shops" className="relative" style={{ background: '#FFFFFE', padding: '100px 24px' }}>
      {/* Torn paper edge top */}
      <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ position: 'absolute', top: -1, left: 0, width: '100%', height: 40, zIndex: 10 }}>
        <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,0 L0,0 Z" fill="#1C1A16" />
      </svg>

      <div className="shops-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 80, maxWidth: 1024, margin: '0 auto', alignItems: 'start', position: 'relative', zIndex: 11, paddingTop: 32 }}>
        <style jsx>{`
          @media (min-width: 1024px) {
            .shops-grid { grid-template-columns: 1fr 1fr !important; }
          }
        `}</style>
        {/* Left */}
        <div className="will-animate">
          <p style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#8A8680',
            marginBottom: 16
          }}>
            // FOR PRINT SHOPS
          </p>
          <h2 style={{
            fontFamily: "Georgia, serif",
            fontSize: 'clamp(36px,5vw,44px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#1A1814',
            marginBottom: 48,
          }}>
            Turn walk-ins into<br />digital orders
          </h2>

          <div className="space-y-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="flex-shrink-0 mt-1 flex items-center justify-center" style={{
                  width: 24, height: 24, borderRadius: '50%',
                  border: '1.5px solid #22C55E',
                  filter: 'url(#roughpaper)',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <div>
                  <p style={{ fontFamily: 'system-ui, sans-serif', color: '#1A1814', fontWeight: 600, fontSize: 14 }}>{b.title}</p>
                  <p style={{ fontFamily: "'Courier New', Courier, monospace", color: '#8A8680', fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right – Registration Card */}
        <div className="will-animate lg:sticky lg:top-24" style={{
          background: '#F0EDE6',
          border: '1.5px solid rgba(26,24,20,0.15)',
          borderRadius: 8,
          padding: 40,
          position: 'relative',
          filter: 'url(#roughpaper)',
          transitionDelay: '150ms',
        }}>
          {/* Rubber stamp badge */}
          <div style={{
            position: 'absolute', top: 24, right: 24,
            transform: 'rotate(12deg)',
            border: '2px solid #22C55E',
            borderRadius: 2,
            padding: '2px 8px',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 10,
            color: '#22C55E',
            letterSpacing: '0.1em',
            opacity: 0.9,
          }}>
            FREE TO JOIN
          </div>

          <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: '#1A1814', marginBottom: 16, paddingRight: 80 }}>
            Start receiving orders today
          </h3>
          <p style={{ fontFamily: "'Courier New', Courier, monospace", color: '#8A8680', fontSize: 13, lineHeight: 1.6, marginBottom: 40 }}>
            Register your shop in under 5 minutes. Our team reviews every application personally.
          </p>

          <button
            onClick={() => router.push(CONFIG.VENDOR_REGISTER_URL)}
            className="w-full cursor-pointer transition-colors duration-200"
            style={{
              background: '#1A1814',
              color: '#F0EDE6',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 700,
              fontSize: 15,
              padding: '16px 0',
              borderRadius: 4,
              border: 'none',
              filter: 'url(#roughpaper)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2D2A25'; e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 rgba(26,24,20,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1814'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            Register Your Shop →
          </button>

          <p style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 12,
            color: '#8A8680',
            textAlign: 'center',
            marginTop: 20,
          }}>
            Reviewed personally within 1–2 business days.
          </p>
        </div>
      </div>
    </section>
  );
}
