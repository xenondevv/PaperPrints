'use client';
import { useState } from 'react';

const items = [
  { q: 'Is PaperPrints free to use?', a: 'Completely free for customers. Print shops pay zero commission during our early access period.' },
  { q: 'Which cities is PaperPrints available in?', a: 'We will be available around your college soon.' },
  { q: 'Are my uploaded files safe?', a: 'Your files are encrypted, used only to process your order, and permanently deleted afterwards.' },
  { q: 'Can I use PaperPrints on iPhone?', a: 'We are not currently available on iPhone but will be soon.' },
  { q: 'How long does shop approval take?', a: 'Our team reviews all applications within 1–2 business days. You will be notified by email.' },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(-1);

  return (
    <section id="faq" className="relative paper-texture" style={{ padding: '100px 24px' }}>
      {/* Torn paper edge top (flipped from ForShops) */}
      <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ position: 'absolute', top: -1, left: 0, width: '100%', height: 40, zIndex: 10 }}>
        <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,0 L0,0 Z" fill="#FFFFFE" />
      </svg>

      <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 11, paddingTop: 32 }}>
        <div className="text-center" style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 44, fontWeight: 700, color: '#1A1814' }}>
            Questions.
          </h2>
        </div>

        <div>
          {items.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} className="will-animate" style={{ 
                borderBottom: '1px dashed rgba(26,24,20,0.2)', 
                transitionDelay: `${i * 50}ms` 
              }}>
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : i)}
                  className="flex justify-between items-center w-full bg-transparent border-none cursor-pointer text-left p-0"
                  style={{ padding: '24px 0' }}
                  onMouseEnter={(e) => { e.currentTarget.querySelector('.faq-q').style.color = '#22C55E'; }}
                  onMouseLeave={(e) => { e.currentTarget.querySelector('.faq-q').style.color = '#1A1814'; }}
                >
                  <span className="faq-q transition-colors duration-200" style={{ 
                    fontFamily: "Georgia, serif", 
                    fontSize: 16, 
                    fontWeight: 600, 
                    color: '#1A1814',
                    paddingRight: 16
                  }}>
                    {item.q}
                  </span>
                  <span style={{ 
                    fontFamily: "'Courier New', Courier, monospace", 
                    fontSize: 24, 
                    color: '#8A8680',
                    lineHeight: 1
                  }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <div style={{ maxHeight: isOpen ? '200px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                  <p style={{ 
                    fontFamily: "'Courier New', Courier, monospace", 
                    fontSize: 13, 
                    color: '#8A8680', 
                    lineHeight: 1.8, 
                    paddingBottom: 24 
                  }}>
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
