import type { Metadata, Viewport } from 'next';
import AnnouncementBar from '@/components/AnnouncementBar';
import AuthProvider from '@/components/AuthProvider';
import ChatWidget from '@/components/ChatWidget';
import Footer from '@/components/Footer';
import MaintenanceGate from '@/components/MaintenanceGate';
import Navbar from '@/components/Navbar';
import { BackToTop, CookieBanner, PageTracker } from '@/components/SiteExtras';
import { getUser } from '@/lib/auth';
import { dbConfigured } from '@/lib/db';
import { getAnnouncements, getSettings } from '@/lib/settings';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Skor Çıkartıcı — Futbol Maç Tahmin ve Analiz',
    template: '%s | Skor Çıkartıcı',
  },
  description:
    'API-Football gerçek verileriyle futbol maç analizi ve Poisson tabanlı skor tahmini. Form, H2H, 1X2, KG ve Alt/Üst olasılıkları, tahmin yarışması ve kupon oluşturucu.',
  applicationName: 'Skor Çıkartıcı',
  openGraph: { type: 'website', locale: 'tr_TR', siteName: 'Skor Çıkartıcı' },
};

export const viewport: Viewport = {
  themeColor: '#05080f',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, settings, announcements] = await Promise.all([getUser(), getSettings(), getAnnouncements()]);
  const enabled = dbConfigured();

  return (
    <html lang="tr" className="dark">
      <body className="flex min-h-screen flex-col bg-ink-950 font-sans text-slate-100">
        <AuthProvider initialUser={user} enabled={enabled}>
          <Navbar />
          <AnnouncementBar items={announcements} />
          <MaintenanceGate
            active={settings.maintenance && !user?.isAdmin}
            message={settings.maintenanceMessage}
          >
            <div className="flex-1">{children}</div>
          </MaintenanceGate>
          <Footer />
          <ChatWidget enabled={enabled && settings.liveChatEnabled} supportHours={settings.supportHours} />
          <PageTracker />
          <BackToTop />
          {settings.cookieBanner && <CookieBanner />}
        </AuthProvider>
      </body>
    </html>
  );
}
