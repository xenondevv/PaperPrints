'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const CONTACT_EMAIL = 'paperprintsofficial@gmail.com';

const faqs = [
  {
    q: 'How quickly do you respond?',
    a: 'We aim to respond to all emails within 24 hours on business days. Vendor approval requests are reviewed within 1–2 business days.',
  },
  {
    q: 'How do I report a problem with my print order?',
    a: 'Email us at ' + CONTACT_EMAIL + ' with your order number and a description of the issue. For quality problems, include photos taken within 24 hours of collection.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Email us at ' + CONTACT_EMAIL + ' with the subject "Delete My Account" from your registered email address. We will process it within 5 business days.',
  },
  {
    q: 'I\'m a print shop owner. How do I get listed?',
    a: 'Visit paperprints.store/login and sign in with Google to begin the vendor onboarding process. Our team will review and approve your application within 1–2 business days.',
  },
];

export default function ContactPage() {
  const [openIdx, setOpenIdx] = useState(-1);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CONTACT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: '#F0EDE6', minHeight: '100vh', color: '#1A1814' }}>
      {/* Navbar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(240,237,230,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(26,24,20,0.08)',
        padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#fff' }}>
            <Image src="/main_logo.png" alt="PaperPrints" width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.2)' }} />
          </div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: '#1A1814', letterSpacing: '-0.02em' }}>PaperPrints</span>
        </Link>
        <Link href="/" style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: '#8A8680', textDecoration: 'none', letterSpacing: '0.04em' }}>
          ← Back to Home
        </Link>
      </header>

      {/* Hero */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '72px 24px 0' }}>
        <div style={{
          display: 'inline-block', border: '1.5px solid rgba(26,24,20,0.3)', borderRadius: 2,
          padding: '3px 10px', fontFamily: "'Courier New', monospace", fontSize: 10,
          letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A8680', marginBottom: 24,
        }}>
          Get in Touch
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#1A1814', marginBottom: 16 }}>
          Contact<br />Us.
        </h1>
        <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#8A8680', lineHeight: 1.8, maxWidth: 480 }}>
          We&apos;re a small team building something big. Whether you have a question, a bug to report, or just want to say hello — we&apos;d love to hear from you.
        </p>
        <div style={{ height: 1, background: 'rgba(26,24,20,0.12)', margin: '40px 0' }} />
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 100px' }}>

        {/* Contact Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 72 }}>

          {/* Email Card */}
          <div style={{
            border: '1px dashed rgba(26,24,20,0.25)', borderRadius: 12, padding: '32px 28px',
            background: 'rgba(26,24,20,0.015)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: '#1A1814',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0EDE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 600, color: '#1A1814', marginBottom: 6 }}>Email Us</p>
              <p style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: '#8A8680', lineHeight: 1.6 }}>
                For all support, feedback, and business enquiries.
              </p>
            </div>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              style={{
                fontFamily: "'Courier New', monospace", fontSize: 13,
                color: '#1A1814', fontWeight: 600,
                textDecoration: 'none', wordBreak: 'break-all',
              }}
            >
              {CONTACT_EMAIL}
            </a>
            <button
              onClick={handleCopy}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                background: copied ? '#22C55E' : 'transparent',
                border: `1px solid ${copied ? '#22C55E' : 'rgba(26,24,20,0.2)'}`,
                borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
                fontFamily: "'Courier New', monospace", fontSize: 11,
                color: copied ? '#fff' : '#8A8680',
                transition: 'all 0.2s ease',
              }}
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                  Copy email
                </>
              )}
            </button>
          </div>

          {/* Response Time Card */}
          <div style={{
            border: '1px dashed rgba(26,24,20,0.25)', borderRadius: 12, padding: '32px 28px',
            background: 'rgba(26,24,20,0.015)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: '#1A1814',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0EDE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 600, color: '#1A1814', marginBottom: 6 }}>Response Times</p>
              <p style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: '#8A8680', lineHeight: 1.6 }}>
                We&apos;re a small team but we reply fast.
              </p>
            </div>
            {[
              { label: 'General enquiries', time: '< 24 hours' },
              { label: 'Vendor approval', time: '1–2 business days' },
              { label: 'Refund requests', time: '2 business days' },
              { label: 'Account deletion', time: '5 business days' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(26,24,20,0.1)', paddingTop: 8 }}>
                <span style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: '#5A5650' }}>{item.label}</span>
                <span style={{ fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: 600, color: '#22C55E' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Common Topics */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#1A1814', marginBottom: 8 }}>
            Common Questions
          </h2>
          <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#8A8680', marginBottom: 36 }}>
            Before reaching out, see if your question is answered below.
          </p>

          {faqs.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} style={{ borderBottom: '1px dashed rgba(26,24,20,0.2)' }}>
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : i)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '22px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 600, color: '#1A1814', paddingRight: 16 }}>
                    {item.q}
                  </span>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 22, color: '#8A8680', lineHeight: 1, flexShrink: 0 }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <div style={{ maxHeight: isOpen ? '200px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                  <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#5A5650', lineHeight: 2, paddingBottom: 22 }}>
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Direct CTA */}
        <div style={{
          border: '1.5px solid rgba(26,24,20,0.15)', borderRadius: 12, padding: '36px 32px',
          background: '#1A1814', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#F0EDE6' }}>
            Still need help?
          </p>
          <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: 'rgba(240,237,230,0.6)', lineHeight: 1.8, maxWidth: 440 }}>
            Drop us an email and we&apos;ll get back to you as quickly as we can. No bots, no ticket queues — just a real person who cares.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 8,
              background: '#F0EDE6', color: '#1A1814', textDecoration: 'none',
              fontFamily: "'Courier New', monospace", fontSize: 13, fontWeight: 700,
              padding: '12px 24px', borderRadius: 6,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#22C55E'; e.currentTarget.style.color = '#0F0F0F'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F0EDE6'; e.currentTarget.style.color = '#1A1814'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Send us an email
          </a>
        </div>

        <div style={{ borderTop: '1px dashed rgba(26,24,20,0.15)', paddingTop: 40, marginTop: 60 }}>
          <p style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: '#8A8680', lineHeight: 1.8 }}>
            © 2026 PaperPrints. All rights reserved. &nbsp;|&nbsp;
            <Link href="/privacy-policy" style={{ color: '#8A8680' }}>Privacy Policy</Link>
            &nbsp;|&nbsp;
            <Link href="/terms" style={{ color: '#8A8680' }}>Terms & Conditions</Link>
            &nbsp;|&nbsp;
            <Link href="/refund-policy" style={{ color: '#8A8680' }}>Refund Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
