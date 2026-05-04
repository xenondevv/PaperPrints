'use client';

import { useEffect } from 'react';
import Loader from '../components/landing/Loader';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import WhySection from '../components/landing/WhySection';
import DownloadApp from '../components/landing/DownloadApp';
import ForShops from '../components/landing/ForShops';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/landing/Footer';
import SocialSidebar from '../components/landing/SocialSidebar';

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('animate-in');
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08 }
    );
    const els = document.querySelectorAll('.will-animate');
    els.forEach((el, i) => {
      el.style.transitionDelay = el.style.transitionDelay || `${i * 0.07}s`;
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: '#F0EDE6', color: '#1A1814', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* SVG Filters for hand-drawn effect */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <filter id="roughpaper" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" seed="2" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="roughline" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" seed="5" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <Loader />
      <SocialSidebar />
      <Navbar />
      <Hero />
      <HowItWorks />
      <WhySection />
      <DownloadApp />
      <ForShops />
      <FAQ />
      <Footer />
    </div>
  );
}
