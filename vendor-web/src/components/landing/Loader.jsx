'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Loader() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('pp_loaded')) return;
    setVisible(true);
    const t1 = setTimeout(() => setFading(true), 2400);
    const t2 = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('pp_loaded', '1');
    }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center paper-texture"
      style={{
        transform: fading ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.6s cubic-bezier(0.76, 0, 0.24, 1)',
      }}
    >
      {/* Logo image */}
      <div style={{
        width: 100,
        height: 100,
        borderRadius: '50%',
        overflow: 'hidden',
        mixBlendMode: 'multiply',
        opacity: 0,
        animation: 'loaderLogoIn 1s ease-out 0.3s forwards',
      }}>
        <Image
          src="/main_logo.png"
          alt="PaperPrints"
          width={160}
          height={160}
          priority
          style={{
            width: 100,
            height: 100,
            objectFit: 'cover',
          }}
        />
      </div>

      {/* SVG drawing animation for brand name */}
      <svg width="360" height="50" viewBox="0 0 360 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginTop: 16 }}>
        <text
          x="180"
          y="36"
          textAnchor="middle"
          fontSize="36"
          fontWeight="900"
          fontFamily="Georgia, serif"
          letterSpacing="0.08em"
          stroke="#1A1814"
          strokeWidth="1.5"
          strokeDasharray="600"
          strokeDashoffset="600"
          fill="transparent"
          style={{
            animation: 'drawStroke 1.8s ease-out 0.5s forwards, fadeFill 0.4s ease-out 2.3s forwards',
          }}
        >
          PAPER PRINTS
        </text>
      </svg>
    </div>
  );
}
