import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'PaperPrint — Vendor Dashboard',
  description: 'Manage your print shop orders, track status, and handle customer requests in real time.',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-950 text-surface-200 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
