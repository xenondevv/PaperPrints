'use client';
import Image from 'next/image';
import { triggerApkDownload } from './config';



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

          <button onClick={triggerApkDownload}
            className="flex items-center gap-3 cursor-pointer transition-all duration-200"
            style={{
              background: '#22C55E',
              color: '#0F0F0F',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 700,
              padding: '16px 32px',
              borderRadius: 4,
              border: 'none',
              filter: 'url(#roughpaper)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'url(#roughpaper) brightness(1.1)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'url(#roughpaper)'; e.currentTarget.style.transform = 'none'; }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 2.227l-1.39 2.407a7.987 7.987 0 00-8.266 0L6.477 2.227a.393.393 0 00-.676.394l1.372 2.378A8.012 8.012 0 004 11.5h16a8.012 8.012 0 00-3.173-6.501l1.372-2.378a.393.393 0 00-.676-.394zM8.5 9a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2zM4 12.5h16v.5A8 8 0 014 13v-.5z" /></svg>
            <div className="text-left">
              <div style={{ fontSize: 15 }}>Download for Android</div>
              <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 11, opacity: 0.7, marginTop: 2 }}>Free · Direct APK</div>
            </div>
          </button>
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
