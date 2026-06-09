import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Delete Account — PaperPrints',
  description: 'Learn how to request deletion of your PaperPrints account and understand what data is removed when your account is deleted.',
};

const CONTACT_EMAIL = 'paperprintsofficial@gmail.com';
const EFFECTIVE_DATE = 'June 1, 2026';

const sections = [
  {
    title: '1. How to Request Account Deletion',
    body: `You can request deletion of your PaperPrints account and associated data by sending an email to ${CONTACT_EMAIL} from the email address linked to your account.

In your email, please include:
• Your full name as registered on PaperPrints
• The email address associated with your account
• A brief statement requesting account deletion

Alternatively, you can request account deletion directly from the PaperPrints mobile app by navigating to Profile → Settings → Delete Account.

We will verify your identity and process your request within 7 business days.`,
  },
  {
    title: '2. What Data Is Deleted',
    body: `Upon account deletion, the following data will be permanently removed:

• Account Information — Your name, email address, profile picture, and authentication credentials
• Uploaded Files — All documents (PDFs, images, Office files) stored on our servers via AWS S3
• Order History — All past order records, print configurations, and transaction metadata
• App Preferences — Any saved settings, notification preferences, and location data
• Push Notification Tokens — FCM tokens used for sending notifications to your device

All data is purged from our primary systems within 30 days of your deletion request being verified.`,
  },
  {
    title: '3. What Data May Be Retained',
    body: `Certain records may be retained after account deletion as required by law:

• Financial Records — Transaction and payment records may be retained for up to 12 months to comply with Indian financial regulations (GST, Income Tax Act).
• Legal Obligations — Data necessary for compliance with legal proceedings, government requests, or dispute resolution may be retained as required.
• Anonymised Analytics — Aggregated, non-identifiable usage data collected via Vercel Analytics is retained for product improvement. This data cannot be traced back to you.

Retained data is stored securely and is not used for any purpose other than legal compliance.`,
  },
  {
    title: '4. Impact of Account Deletion',
    body: `Please note the following consequences of deleting your account:

• You will permanently lose access to your PaperPrints account
• All pending or in-progress print orders will be cancelled
• You will not be able to recover uploaded documents or order history
• Any active payment transactions will be completed before deletion is processed
• You may create a new account at any time, but previous data cannot be restored`,
  },
  {
    title: '5. Third-Party Data',
    body: `PaperPrints uses the following third-party services that may independently retain some data:

• Google Firebase — Authentication data is managed by Google. You may also want to revoke PaperPrints' access from your Google Account security settings (myaccount.google.com → Security → Third-party apps).
• Cashfree Payments — Payment transaction records are governed by Cashfree's data retention policy.
• AWS S3 — Files are deleted from our S3 storage within 7 days of account deletion.

We recommend reviewing the privacy policies of these services for their specific data retention practices.`,
  },
  {
    title: '6. Contact Us',
    body: `If you have questions about account deletion or data handling, please reach out:

Email: ${CONTACT_EMAIL}
PaperPrints, India

We aim to respond to all enquiries within 48 hours.`,
  },
];

export default function DeleteAccountPage() {
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
          Account
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#1A1814', marginBottom: 16 }}>
          Delete<br />Account
        </h1>
        <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#8A8680', lineHeight: 1.8 }}>
          Effective Date: {EFFECTIVE_DATE}
        </p>
        <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#8A8680', lineHeight: 1.8, marginTop: 8, maxWidth: 560 }}>
          You have the right to request deletion of your PaperPrints account and all associated personal data at any time. This page explains the process and what happens to your data.
        </p>
        <div style={{ height: 1, background: 'rgba(26,24,20,0.12)', margin: '40px 0' }} />
      </div>

      {/* Deletion Request Card */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{
          background: 'rgba(26,24,20,0.04)',
          border: '1px solid rgba(26,24,20,0.1)',
          borderRadius: 8,
          padding: '32px 28px',
          marginBottom: 48,
        }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 600, color: '#1A1814', marginBottom: 16 }}>
            Quick Deletion Request
          </p>
          <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#5A5650', lineHeight: 2, marginBottom: 20 }}>
            Users can request deletion of their Paper Prints account by emailing{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#1A1814', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              {CONTACT_EMAIL}
            </a>.
          </p>
          <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#5A5650', lineHeight: 2, marginBottom: 20 }}>
            Upon verification, we will delete the user&apos;s account information, uploaded documents, and associated personal data within 30 days.
          </p>
          <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#8A8680', lineHeight: 2, fontStyle: 'italic' }}>
            Certain records may be retained where required by law.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 100px' }}>
        {sections.map((sec, i) => (
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
            <Link href="/terms" style={{ color: '#8A8680' }}>Terms &amp; Conditions</Link>
            &nbsp;|&nbsp;
            <Link href="/refund-policy" style={{ color: '#8A8680' }}>Refund Policy</Link>
            &nbsp;|&nbsp;
            <Link href="/contact" style={{ color: '#8A8680' }}>Contact Us</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
