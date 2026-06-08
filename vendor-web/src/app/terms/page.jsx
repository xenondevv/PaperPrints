import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Terms & Conditions — PaperPrints',
  description: 'Read the Terms and Conditions governing your use of the PaperPrints document printing platform.',
};

const CONTACT_EMAIL = 'paperprintsofficial@gmail.com';
const EFFECTIVE_DATE = 'June 1, 2026';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, installing, or using the PaperPrints application or website ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use the Service.\n\nThese Terms constitute a legally binding agreement between you and PaperPrints ("we", "us", or "our"). We may update these Terms from time to time, and continued use of the Service constitutes acceptance of the revised Terms.`,
  },
  {
    title: '2. Eligibility',
    body: `You must be at least 13 years old to use PaperPrints. By using the Service, you represent that you are at least 13 years of age. Users under 18 must have permission from a parent or legal guardian.\n\nFor vendor accounts, you must be at least 18 years old and legally authorised to operate a printing business in your jurisdiction.`,
  },
  {
    title: '3. Account Registration',
    body: `To use PaperPrints, you must sign in with a valid Google account. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.\n\nYou agree to:\n• Provide accurate and complete information\n• Notify us immediately of any unauthorised account use\n• Not share your credentials with third parties\n• Not create multiple accounts for abusive purposes`,
  },
  {
    title: '4. User Responsibilities — Customers',
    body: `As a customer using PaperPrints to place print orders, you agree to:\n\n• Only upload files you own or have the legal right to print\n• Not upload content that is illegal, obscene, defamatory, or infringes on third-party intellectual property rights\n• Pay the full order amount as quoted at checkout\n• Collect your printed documents within the time specified by the vendor\n• Not attempt to abuse the platform (e.g., placing fraudulent orders, chargebacks without basis)`,
  },
  {
    title: '5. Vendor Responsibilities',
    body: `Vendors (print shop owners) using the PaperPrints platform agree to:\n\n• Maintain a valid, operating print business\n• Provide accurate shop details, pricing, and operating hours\n• Fulfil accepted orders promptly and to the quality described\n• Not discriminate against customers on prohibited grounds\n• Comply with all applicable local laws and regulations\n• Not share customer files or personal information with unauthorised parties\n\nVendor accounts require verification by the PaperPrints team. We reserve the right to suspend or terminate vendor accounts that violate these Terms.`,
  },
  {
    title: '6. Prohibited Uses',
    body: `You may not use PaperPrints to:\n\n• Violate any applicable laws or regulations\n• Upload, transmit, or print content that is illegal, obscene, defamatory, or infringes intellectual property rights\n• Reverse engineer, decompile, or attempt to extract the source code of the application\n• Use automated scripts or bots to interact with the Service\n• Attempt to gain unauthorised access to our systems or other users' accounts\n• Interfere with or disrupt the Service or servers\n• Engage in any fraudulent activity`,
  },
  {
    title: '7. Orders and Payments',
    body: `Order prices are set by individual print shops and displayed clearly before checkout. By placing an order, you agree to pay the stated price.\n\nPayments are processed by Cashfree Payments, a licensed payment aggregator. PaperPrints does not store payment card details.\n\nOnce an order is placed and accepted by a vendor, it may not be cancelled without the vendor's approval. Please refer to our Refund Policy for details on refunds.`,
  },
  {
    title: '8. File Uploads and Intellectual Property',
    body: `You retain ownership of all files you upload to PaperPrints. By uploading a file, you grant us a limited, non-exclusive licence to store and transmit that file solely for the purpose of fulfilling your print order.\n\nYou warrant that you have the right to print all uploaded content. PaperPrints is not responsible for intellectual property infringement resulting from customer-uploaded content.\n\nFiles are automatically deleted within 7 days of order completion or cancellation.`,
  },
  {
    title: '9. Disclaimers',
    body: `PaperPrints is a marketplace platform that connects customers with independent print shops. We are not responsible for the quality of printing services provided by vendors.\n\nThe Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses.`,
  },
  {
    title: '10. Limitation of Liability',
    body: `To the fullest extent permitted by applicable law, PaperPrints shall not be liable for:\n\n• Any indirect, incidental, special, or consequential damages\n• Loss of data or business interruption\n• The acts or omissions of third-party vendors\n• Damages arising from unauthorised access to your account\n\nOur total liability to you for any claim arising from the use of the Service shall not exceed the amount you paid for the specific order giving rise to the claim.`,
  },
  {
    title: '11. Termination',
    body: `We reserve the right to suspend or terminate your account at any time, with or without notice, for conduct that violates these Terms or is harmful to other users, us, or third parties.\n\nYou may delete your account at any time by contacting us at ${CONTACT_EMAIL}.`,
  },
  {
    title: '12. Governing Law',
    body: `These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts located in India.`,
  },
  {
    title: '13. Contact Us',
    body: `For any questions regarding these Terms, please contact us:\n\nEmail: ${CONTACT_EMAIL}\nPaperPrints, India`,
  },
];

export default function TermsPage() {
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
          Terms &amp;<br />Conditions
        </h1>
        <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#8A8680', lineHeight: 1.8 }}>
          Effective Date: {EFFECTIVE_DATE}
        </p>
        <p style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: '#8A8680', lineHeight: 1.8, marginTop: 8, maxWidth: 560 }}>
          Please read these Terms carefully before using PaperPrints. They govern your relationship with us and your use of our services.
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
            <Link href="/refund-policy" style={{ color: '#8A8680' }}>Refund Policy</Link>
            &nbsp;|&nbsp;
            <Link href="/contact" style={{ color: '#8A8680' }}>Contact Us</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
