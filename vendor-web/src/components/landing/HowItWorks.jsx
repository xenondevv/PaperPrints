export default function HowItWorks() {
  const steps = [
    {
      num: '01', title: 'Upload Your File',
      desc: 'Select your PDF and choose which pages to print in color or black & white.',
      icon: (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>),
    },
    {
      num: '02', title: 'Pick a Nearby Shop',
      desc: 'Browse verified shops near you and place your order in seconds.',
      icon: (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>),
    },
    {
      num: '03', title: 'Collect Your Prints',
      desc: 'Walk in, show your 4-digit code, and you\'re done.',
      icon: (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1814" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>),
    },
  ];

  return (
    <section id="how-it-works" className="relative" style={{ background: '#FFFFFE', padding: '100px 24px' }}>
      {/* Torn paper edge top */}
      <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ position: 'absolute', top: -1, left: 0, width: '100%', height: 40, zIndex: 10 }}>
        <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,0 L0,0 Z" fill="#F0EDE6" />
      </svg>

      <div style={{ textAlign: 'center', marginBottom: 80, position: 'relative', zIndex: 11 }}>
        <p style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#8A8680',
          marginBottom: 16
        }}>
          // HOW IT WORKS
        </p>
        <h2 style={{
          fontFamily: "Georgia, serif",
          fontSize: 44,
          fontWeight: 700,
          color: '#1A1814',
          letterSpacing: '-0.02em',
        }}>
          Three steps to your prints
        </h2>
      </div>

      <div style={{ maxWidth: 896, margin: '0 auto', position: 'relative' }}>
        {/* Connecting line (desktop) */}
        <div className="hidden md:block absolute" style={{
          top: 66,
          left: 'calc(16.66% + 44px)',
          right: 'calc(16.66% + 44px)',
          borderTop: '2px dashed rgba(26,24,20,0.15)',
          zIndex: 0,
        }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
          {steps.map((s, i) => (
            <div key={s.num} className="will-animate" style={{ textAlign: 'center', position: 'relative', zIndex: 10, transitionDelay: `${i * 100}ms` }}>
              <div style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 11,
                color: '#8A8680',
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}>
                {s.num}
              </div>

              {/* Icon circle */}
              <div
                className="transition-transform duration-200 hover:rotate-3"
                style={{
                  width: 88, height: 88,
                  border: '2px solid #1A1814',
                  borderRadius: '50%',
                  background: '#F0EDE6',
                  filter: 'url(#roughpaper)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                }}
              >
                {s.icon}
              </div>

              <h3 style={{
                fontFamily: "Georgia, serif",
                fontSize: 20,
                fontWeight: 700,
                color: '#1A1814',
                marginBottom: 12,
              }}>
                {s.title}
              </h3>
              
              <p style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: 14,
                color: '#8A8680',
                lineHeight: 1.7,
                maxWidth: 200,
                margin: '0 auto',
              }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: stack to single column */}
      <style jsx>{`
        @media (max-width: 767px) {
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
        }
      `}</style>
    </section>
  );
}
