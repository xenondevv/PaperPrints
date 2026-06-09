import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Privacy Policy — PaperPrints',
  description: 'Learn how PaperPrints collects, uses, and protects your personal data when you use our document printing platform.',
};

const CONTACT_EMAIL = 'paperprintsofficial@gmail.com';
const EFFECTIVE_DATE = 'June 1, 2026';

const sections = [
  {
    title: '1. Information We Collect',
    content: [
      {
        sub: '1.1 Account Information',
        text: 'When you sign in with Google, we receive your name, email address, and profile picture from Google\'s OAuth service. We use this to create and manage your PaperPrints account.',
      },
      {
        sub: '1.2 Location Data',
        text: 'With your permission, we collect your approximate device location to show nearby print shops. Location data is used only to power the shop discovery feature and is not stored beyond your session.',
      },
      {
        sub: '1.3 Uploaded Files',
        text: 'Documents you upload (PDFs, images, Office files) are securely stored on AWS S3 to fulfil your print order. Files are accessible only to you and the print shop you selected. We do not read, analyse, or use your files for any other purpose.',
      },
      {
        sub: '1.4 Order & Payment Information',
        text: 'We collect order details (file selection, print options, copies) and transaction records processed through Cashfree Payments. We do not store raw card numbers or UPI credentials — these are handled entirely by Cashfree.',
      },
      {
        sub: '1.5 Usage Data',
        text: 'We collect anonymised app usage data (crash reports, page views) via Vercel Analytics to improve the product. This data cannot identify you individually.',
      },
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: `We use the information we collect to:
• Create and authenticate your account
• Match you with nearby verified print shops
• Process and fulfil your print orders
• Send order status notifications (push / email)
• Improve app reliability and performance
• Comply with legal obligations

We do not sell, rent, or share your personal data with third parties for marketing purposes.`,
  },
  {
    title: '3. Data Sharing',
    body: `We share your data only as necessary to provide the service:

• Print Shops: Your name, order details, and uploaded file are shared with the shop you place an order with, solely to fulfil the print job.
• Google (Firebase): Authentication is handled by Google Firebase. Their privacy policy applies to the sign-in flow.
• Cashfree Payments: Payment processing is handled by Cashfree. Their privacy policy governs payment data.
• AWS S3: Files are stored on Amazon Web Services' secure cloud storage.
• Vercel: Our web dashboard is hosted on Vercel, which may log anonymised request metadata.

We require all third parties to maintain appropriate security standards.`,
  },
  {
    title: '4. Data Retention',
    body: `• Uploaded files are deleted within 7 days of your order being completed or cancelled, or sooner upon your request.
• Account data is retained while your account is active and for up to 12 months after deletion, as required by Indian financial regulations.
• You may request immediate deletion of your account and associated data by emailing us at ${CONTACT_EMAIL}.`,
  },
  {
    title: '5. Your Rights',
    body: `You have the right to:
• Access the personal data we hold about you
• Correct inaccurate personal data
• Request deletion of your account and data
• Withdraw consent for location access at any time via your device settings
• Opt out of non-essential communications

To exercise any of these rights, contact us at ${CONTACT_EMAIL}.`,
  },
  {
    title: '6. Security',
    body: `We implement industry-standard security measures including:
• HTTPS encryption for all data in transit
• AWS S3 server-side encryption for stored files
• JWT-based authentication with short-lived tokens
• Regular security reviews

No method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.`,
  },
  {
    title: '7. Children\'s Privacy',
    body: `PaperPrints is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.`,
  },
  {
    title: '8. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Effective Date." Continued use of PaperPrints after changes constitutes your acceptance of the updated policy.`,
  },
  {
    title: '9. Contact Us',
    body: `If you have any questions or concerns about this Privacy Policy, please contact us:\n\nEmail: ${CONTACT_EMAIL}\nPaperPrints, India`,
  },
];

export default function PrivacyPolicyPage() {
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
          Privacy<br />Policy
        </h1>
        <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#8A8680', lineHeight: 1.8 }}>
          Effective Date: {EFFECTIVE_DATE}
        </p>
        <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#8A8680', lineHeight: 1.8, marginTop: 8, maxWidth: 560 }}>
          PaperPrints (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the PaperPrints mobile application and website. This policy explains how we collect, use, and protect your information.
        </p>
        <div style={{ height: 1, background: 'rgba(26,24,20,0.12)', margin: '40px 0' }} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 100px' }}>
        {sections.map((sec, i) => (
          <div key={i} style={{ marginBottom: 52 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#1A1814', marginBottom: 16 }}>
              {sec.title}
            </h2>
            {sec.body && (
              <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#5A5650', lineHeight: 2, whiteSpace: 'pre-line' }}>
                {sec.body}
              </p>
            )}
            {sec.content && sec.content.map((c, j) => (
              <div key={j} style={{ marginBottom: 20 }}>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 600, color: '#1A1814', marginBottom: 6 }}>{c.sub}</p>
                <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#5A5650', lineHeight: 2 }}>{c.text}</p>
              </div>
            ))}
          </div>
        ))}

        <div style={{ borderTop: '1px dashed rgba(26,24,20,0.15)', paddingTop: 40 }}>
          <p style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: '#8A8680', lineHeight: 1.8 }}>
            © 2026 PaperPrints. All rights reserved. &nbsp;|&nbsp;
            <Link href="/terms" style={{ color: '#8A8680' }}>Terms & Conditions</Link>
            &nbsp;|&nbsp;
            <Link href="/refund-policy" style={{ color: '#8A8680' }}>Refund Policy</Link>
            &nbsp;|&nbsp;
            <Link href="/contact" style={{ color: '#8A8680' }}>Contact Us</Link>
            &nbsp;|&nbsp;
            <Link href="/delete-account" style={{ color: '#8A8680' }}>Delete Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
