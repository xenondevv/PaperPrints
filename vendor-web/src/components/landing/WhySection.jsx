const benefits = [
  { title: '60-Second Orders', desc: 'Place and confirm a print order faster than walking to the shop.', span: 3,
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { title: 'Shops Near You', desc: 'See only verified shops within your area — sorted by distance.', span: 3,
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> },
  { title: 'Color Control', desc: 'Pick exactly which pages print in color.', span: 2,
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg> },
  { title: 'No Surprises', desc: 'Price shown upfront before you order.', span: 2,
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
  { title: 'Instant Alerts', desc: 'Notified the moment your order is ready.', span: 2,
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
];

export default function WhySection() {
  return (
    <section id="why" className="relative paper-texture" style={{ padding: '100px 24px' }}>
      {/* Torn paper edge top (flipped) */}
      <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ position: 'absolute', top: -1, left: 0, width: '100%', height: 40, zIndex: 10 }}>
        <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,0 L0,0 Z" fill="#FFFFFE" />
      </svg>

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 11, marginBottom: 80 }}>
        <p style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#8A8680',
          marginBottom: 16
        }}>
          // WHY PAPERPRINTS
        </p>
        <h2 style={{
          fontFamily: "Georgia, serif",
          fontSize: 'clamp(36px,5vw,44px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: '#1A1814',
        }}>
          Everything you need.<br />Nothing you don&apos;t.
        </h2>
      </div>

      <div style={{ maxWidth: 1024, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
        {benefits.map((b, i) => (
          <div key={b.title}
            className="will-animate cursor-default transition-all duration-200"
            style={{
              gridColumn: `span ${b.span}`,
              background: 'rgba(255,255,255,0.7)',
              border: '1.5px solid rgba(26,24,20,0.12)',
              borderRadius: 8,
              padding: 28,
              position: 'relative',
              overflow: 'hidden',
              filter: 'url(#roughpaper)',
              transitionDelay: `${i * 70}ms`,
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.transform = 'rotate(0.5deg) translateY(-2px)';
              e.currentTarget.style.boxShadow = '3px 3px 0 rgba(26,24,20,0.08)';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Dog-ear corner fold */}
            <div style={{
              position: 'absolute',
              top: 0, right: 0,
              width: 20, height: 20,
              background: 'linear-gradient(225deg, #F0EDE6 50%, transparent 50%)',
              borderBottomLeftRadius: 4,
            }} />

            <div style={{ marginBottom: 20 }}>
              {b.icon}
            </div>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: '#1A1814', marginBottom: 8 }}>{b.title}</h3>
            <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 13, color: '#8A8680', lineHeight: 1.6 }}>{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Mobile: override grid to stack */}
      <style jsx>{`
        @media (max-width: 767px) {
          div[style*="grid-template-columns: repeat(6"] > div {
            grid-column: span 6 !important;
          }
        }
      `}</style>
    </section>
  );
}
