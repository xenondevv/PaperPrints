import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Refund Policy — PaperPrints',
  description: 'Understand PaperPrints\' refund and cancellation policy for print orders.',
};

const CONTACT_EMAIL = 'paperprintsofficial@gmail.com';
const EFFECTIVE_DATE = 'June 1, 2026';

export default function RefundPolicyPage() {
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
          Legal
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#1A1814', marginBottom: 16 }}>
          Refund<br />Policy
        </h1>
        <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#8A8680', lineHeight: 1.8 }}>
          Effective Date: {EFFECTIVE_DATE}
        </p>
        <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#8A8680', lineHeight: 1.8, marginTop: 8, maxWidth: 560 }}>
          We want your experience with PaperPrints to be smooth and fair. Here&apos;s how we handle order cancellations and refunds.
        </p>
        <div style={{ height: 1, background: 'rgba(26,24,20,0.12)', margin: '40px 0' }} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 100px' }}>

        {/* Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 60 }}>
          {[
            { icon: '✓', label: 'Full Refund', desc: 'If vendor rejects your order' },
            { icon: '✓', label: 'Full Refund', desc: 'If order is not fulfilled' },
            { icon: '✗', label: 'No Refund', desc: 'Once order is collected' },
            { icon: '~', label: 'Case by Case', desc: 'Quality issues — contact us' },
          ].map((h, i) => (
            <div key={i} style={{
              border: '1px dashed rgba(26,24,20,0.2)', borderRadius: 8, padding: '20px 16px',
              background: 'rgba(26,24,20,0.02)',
            }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: h.icon === '✓' ? '#22C55E' : h.icon === '✗' ? '#B91C1C' : '#D97706', marginBottom: 8 }}>
                {h.icon}
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 600, color: '#1A1814', marginBottom: 4 }}>{h.label}</div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: '#8A8680', lineHeight: 1.6 }}>{h.desc}</div>
            </div>
          ))}
        </div>

        {[
          {
            title: '1. Order Cancellation — Before Acceptance',
            body: `You may cancel your order for a full refund at any time before the print shop accepts it. In the app, go to your order and tap "Cancel Order."\n\nOnce a vendor accepts your order, cancellation is subject to the vendor's discretion.`,
          },
          {
            title: '2. Order Rejected by Vendor',
            body: `If a vendor rejects your order for any reason, you will receive a full refund to your original payment method within 5–7 business days. No action is required from your side.`,
          },
          {
            title: '3. Order Not Fulfilled',
            body: `If a vendor accepts your order but fails to fulfil it (e.g., shop closes unexpectedly, technical failure), you are eligible for a full refund. Contact us at ${CONTACT_EMAIL} with your order number, and we will process the refund within 5–7 business days.`,
          },
          {
            title: '4. Quality Issues',
            body: `If you receive prints that are significantly different from what was ordered (e.g., wrong pages, severe print defects), please contact us within 24 hours of collecting your order at ${CONTACT_EMAIL} with:\n\n• Your order number\n• A description of the issue\n• Photos of the defective prints\n\nWe will review the case and, where appropriate, issue a full or partial refund or arrange a reprint. Decisions are made at our discretion in good faith.`,
          },
          {
            title: '5. No Refund Situations',
            body: `Refunds will not be issued in the following circumstances:\n\n• The order has been collected and there are no defects\n• The issue is caused by errors in the file you uploaded (e.g., incorrect content, low resolution)\n• You entered incorrect print specifications (pages, copies, colour mode) and the vendor printed correctly to those specifications\n• You changed your mind after the order was printed\n• The cancellation request was made after the vendor marked the order as READY for pickup`,
          },
          {
            title: '6. Refund Processing',
            body: `Approved refunds are credited to your original payment method:\n\n• UPI / Bank transfer: 3–5 business days\n• Credit / Debit card: 5–7 business days\n\nRefunds are processed through Cashfree Payments. Processing times are subject to your bank's clearing schedule, which is outside our control.`,
          },
          {
            title: '7. How to Request a Refund',
            body: `To request a refund, email us at ${CONTACT_EMAIL} with the subject line "Refund Request — [Order Number]." Include your order number, the reason for the request, and any supporting evidence.\n\nWe aim to respond to all refund requests within 2 business days.`,
          },
          {
            title: '8. Changes to This Policy',
            body: `We may update this Refund Policy from time to time. The most current version will always be available at paperprints.store/refund-policy. Continued use of PaperPrints constitutes acceptance of the updated policy.`,
          },
        ].map((sec, i) => (
          <div key={i} style={{ marginBottom: 52 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#1A1814', marginBottom: 16 }}>
              {sec.title}
            </h2>
            <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#5A5650', lineHeight: 2, whiteSpace: 'pre-line' }}>
              {sec.body}
            </p>
          </div>
        ))}

        <div style={{ borderTop: '1px dashed rgba(26,24,20,0.15)', paddingTop: 40 }}>
          <p style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: '#8A8680', lineHeight: 1.8 }}>
            © 2026 PaperPrints. All rights reserved. &nbsp;|&nbsp;
            <Link href="/privacy-policy" style={{ color: '#8A8680' }}>Privacy Policy</Link>
            &nbsp;|&nbsp;
            <Link href="/terms" style={{ color: '#8A8680' }}>Terms & Conditions</Link>
            &nbsp;|&nbsp;
            <Link href="/contact" style={{ color: '#8A8680' }}>Contact Us</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
