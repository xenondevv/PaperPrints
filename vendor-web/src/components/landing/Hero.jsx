'use client';
import { CONFIG, scrollToSection } from './config';

export default function Hero() {
  return (
    <section className="relative overflow-hidden flex flex-col items-center justify-center px-6 paper-texture" style={{ minHeight: '100svh', paddingTop: 52 }}>
      {/* Background illustration elements */}
      {/* 1. Crumpled paper lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.6 }}>
        <path d="M-50 150 Q 200 100 500 200 T 1200 150 M-50 400 Q 300 450 600 350 T 1300 400 M200 -50 Q 150 200 250 500 T 200 900 M800 -50 Q 850 300 750 600 T 800 1000" 
          stroke="rgba(26,24,20,0.04)" strokeWidth="1" fill="none" />
      </svg>

      {/* 2. Scattered ink dots */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.8 }}>
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: 4, height: 4, borderRadius: '50%', background: 'rgba(26,24,20,0.06)' }} />
        <div style={{ position: 'absolute', top: '35%', right: '20%', width: 6, height: 6, borderRadius: '50%', background: 'rgba(26,24,20,0.06)' }} />
        <div style={{ position: 'absolute', bottom: '25%', left: '25%', width: 3, height: 3, borderRadius: '50%', background: 'rgba(26,24,20,0.06)' }} />
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: 5, height: 5, borderRadius: '50%', background: 'rgba(26,24,20,0.06)' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '30%', width: 4, height: 4, borderRadius: '50%', background: 'rgba(26,24,20,0.06)' }} />
      </div>

      {/* 3. Folded corner */}
      <div className="absolute bottom-0 right-0 pointer-events-none" style={{
        width: 0, height: 0,
        borderBottom: '60px solid #FFFFFF',
        borderLeft: '60px solid transparent',
        boxShadow: '-4px -4px 10px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: -60,
          width: 0, height: 0,
          borderTop: '60px solid #E6E2D8',
          borderRight: '60px solid transparent',
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto w-full">
        {/* Rubber stamp badge */}
        <div className="inline-block mb-10" style={{
          border: '2px solid #1A1814',
          borderRadius: 2,
          transform: 'rotate(-2deg)',
          padding: '4px 12px',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#1A1814',
          opacity: 0.85,
          boxShadow: 'inset 0 0 0 1px #1A1814',
          filter: 'url(#roughline)',
        }}>
          LIVE AROUND YOUR COLLEGE
        </div>

        {/* Heading */}
        <h1 className="will-animate" style={{
          fontFamily: "Georgia, serif",
          fontSize: 'clamp(56px, 9vw, 120px)',
          fontWeight: 700,
          lineHeight: 0.95,
          letterSpacing: '-0.03em',
          color: '#1A1814',
          marginBottom: 0,
        }}>
          <div className="inline-block transition-transform duration-500 hover:-translate-y-1">Skip the Line.</div>
          <br />
          <div className="inline-block transition-transform duration-500 hover:-translate-y-1" style={{ transitionDelay: '0.1s' }}>Just </div>
          <span className="sketch-underline transition-transform duration-500 hover:-translate-y-1" style={{ transitionDelay: '0.2s' }}>Print.</span>
        </h1>

        {/* Subtext */}
        <p className="will-animate" style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 15,
          color: '#8A8680',
          lineHeight: 1.8,
          maxWidth: 380,
          margin: '24px auto 0',
          textAlign: 'center',
          transitionDelay: '0.3s',
        }}>
          Upload your document.<br />
          Pick a shop nearby.<br />
          Collect your prints.
        </p>

        {/* CTAs */}
        <div className="hero-cta-group flex gap-4 justify-center flex-wrap mt-12 will-animate" style={{ transitionDelay: '0.4s' }}>
          <style jsx>{`
            @media (max-width: 639px) {
              .hero-cta-group { flex-direction: column !important; align-items: stretch !important; padding: 0 12px; }
              .hero-cta-group button { width: 100% !important; justify-content: center !important; }
            }
          `}</style>
          <a
            href={CONFIG.PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 cursor-pointer transition-all duration-200"
            style={{
              background: '#1A1814',
              color: '#F0EDE6',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 700,
              padding: '12px 24px',
              borderRadius: 4,
              border: 'none',
              filter: 'url(#roughpaper)',
              textDecoration: 'none',
              display: 'inline-flex',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2D2A25'; e.currentTarget.style.transform = 'scale(1.01) translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 rgba(26,24,20,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1814'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <svg width="22" height="24" viewBox="0 0 505 584" fill="none">
              <path d="M4.93 6.81C1.77 10.07 0 15.14 0 21.84v540.32c0 6.7 1.77 11.77 4.93 15.03l.82.77L289.13 294.5v-5L5.75 6.04l-.82.77z" fill="#4285F4"/>
              <path d="M383.6 389.04L289.13 294.5v-5l94.47-94.54 2.13 1.23 111.96 63.6c31.99 18.16 31.99 47.9 0 66.08L385.73 387.8l-2.13 1.24z" fill="#FFBA00"/>
              <path d="M385.73 387.8L289.13 292 4.93 577.19c10.55 11.18 27.95 12.56 47.57 1.43L385.73 387.8" fill="#F84437"/>
              <path d="M385.73 196.2L52.5 5.38C32.88-5.75 15.48-4.37 4.93 6.81L289.13 292l96.6-95.8z" fill="#34A853"/>
            </svg>
            <div className="text-left">
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.8, lineHeight: 1, marginBottom: 2, fontFamily: "'Courier New', Courier, monospace" }}>GET IT ON</div>
              <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.1 }}>Google Play</div>
            </div>
          </a>
          <button
            onClick={() => scrollToSection('for-shops')}
            className="cursor-pointer transition-all duration-200"
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(26,24,20,0.3)',
              color: '#1A1814',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 14,
              fontWeight: 600,
              padding: '16px 32px',
              borderRadius: 4,
              filter: 'url(#roughpaper)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1A1814'; e.currentTarget.style.background = 'rgba(26,24,20,0.04)'; e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 rgba(26,24,20,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(26,24,20,0.3)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            Register Your Shop →
          </button>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A8680" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
          <path d="M12 5v14M19 12l-7 7-7-7"/>
        </svg>
        <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 11, color: '#8A8680', marginTop: 8 }}>scroll</span>
      </div>
    </section>
  );
}
