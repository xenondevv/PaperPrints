'use client';
import Image from 'next/image';
import { CONFIG } from './config';



export default function DownloadApp() {
  return (
    <section id="download" className="relative overflow-hidden" style={{ background: '#1C1A16', padding: '100px 24px' }}>
      {/* 1. Faint PRINT watermark */}
      <div className="absolute pointer-events-none select-none" style={{
        fontFamily: "Georgia, serif",
        fontSize: 300,
        fontWeight: 900,
        color: 'rgba(255,255,255,0.02)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        whiteSpace: 'nowrap'
      }}>
        PRINT.
      </div>

      {/* 2. Grid of tiny dots */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="download-grid" style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: '1fr', gap: 48, maxWidth: 1024, margin: '0 auto', alignItems: 'center' }}>
        <style jsx>{`
          @media (min-width: 768px) {
            .download-grid { grid-template-columns: 1fr 1fr !important; gap: 80px !important; }
          }
          @media (max-width: 767px) {
            .download-text-wrapper { text-align: center !important; }
            .download-text-wrapper button { margin: 0 auto !important; }
            .download-phone-wrapper { order: -1; }
          }
        `}</style>
        {/* Left */}
        <div className="will-animate download-text-wrapper">
          <p style={{ fontFamily: "'Courier New', Courier, monospace", color: '#22C55E', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
            {'// GET THE APP'}
          </p>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 'clamp(36px,5vw,52px)', fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF', marginBottom: 24 }}>
            Your print shop,<br />in your pocket.
          </h2>
          <p style={{ fontFamily: "'Courier New', Courier, monospace", color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.8, marginBottom: 40 }}>
            Free Android app.<br />Lightweight and built for speed.
          </p>

          <a href={CONFIG.PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 cursor-pointer transition-all duration-200"
            style={{
              background: '#22C55E',
              color: '#0F0F0F',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 700,
              padding: '14px 28px',
              borderRadius: 4,
              border: 'none',
              filter: 'url(#roughpaper)',
              textDecoration: 'none',
              display: 'inline-flex',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'url(#roughpaper) brightness(1.1)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'url(#roughpaper)'; e.currentTarget.style.transform = 'none'; }}
          >
            <svg width="24" height="26" viewBox="0 0 505 584" fill="none">
              <path d="M4.93 6.81C1.77 10.07 0 15.14 0 21.84v540.32c0 6.7 1.77 11.77 4.93 15.03l.82.77L289.13 294.5v-5L5.75 6.04l-.82.77z" fill="#4285F4"/>
              <path d="M383.6 389.04L289.13 294.5v-5l94.47-94.54 2.13 1.23 111.96 63.6c31.99 18.16 31.99 47.9 0 66.08L385.73 387.8l-2.13 1.24z" fill="#FFBA00"/>
              <path d="M385.73 387.8L289.13 292 4.93 577.19c10.55 11.18 27.95 12.56 47.57 1.43L385.73 387.8" fill="#F84437"/>
              <path d="M385.73 196.2L52.5 5.38C32.88-5.75 15.48-4.37 4.93 6.81L289.13 292l96.6-95.8z" fill="#34A853"/>
            </svg>
            <div className="text-left">
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7, lineHeight: 1, marginBottom: 2, fontFamily: "'Courier New', Courier, monospace" }}>GET IT ON</div>
              <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.1 }}>Google Play</div>
            </div>
          </a>
        </div>

        {/* Right – Phone */}
        <div className="will-animate download-phone-wrapper" style={{ transitionDelay: '150ms' }}>
          <div className="relative mx-auto" style={{
            width: 220,
            height: 440,
            borderRadius: 28,
            overflow: 'hidden',
            border: '5px solid #2D2A25',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <Image
              src="/app_screenshot.png"
              alt="PaperPrints App"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
        <style jsx>{`
          @media (min-width: 768px) {
            .download-phone-wrapper > div:first-child { width: 260px !important; height: 520px !important; border-radius: 32px !important; }
          }
        `}</style>
      </div>
    </section>
  );
}
