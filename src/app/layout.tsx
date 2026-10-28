import type { Metadata, Viewport } from 'next';
import AnnouncementBar from '@/components/AnnouncementBar';
import AuthProvider from '@/components/AuthProvider';
import ChatWidget from '@/components/ChatWidget';
import Footer from '@/components/Footer';
import MaintenanceGate from '@/components/MaintenanceGate';
import Navbar from '@/components/Navbar';
import { AgeGate, BackToTop, CookieBanner, PageTracker, SessionReminder } from '@/components/SiteExtras';
import { getUser } from '@/lib/auth';
import { dbConfigured } from '@/lib/db';
import { getAnnouncements, getSettings } from '@/lib/settings';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'BloxyBet — Sanal kredilerle sosyal casino',
    template: '%s | BloxyBet',
  },
  description:
    'Mines, Crash, Slots ve Blackjack’i sanal kredilerle oyna. Doğrulanabilir adil sonuçlar, günlük bonus, rakeback ve VIP seviyeleri. Gerçek para yok. 18+',
  applicationName: 'BloxyBet',
  openGraph: { type: 'website', locale: 'tr_TR', siteName: 'BloxyBet' },
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
          <AgeGate />
          {user?.id && <SessionReminder />}
          <BackToTop />
          {settings.cookieBanner && <CookieBanner />}
        </AuthProvider>
      </body>
    </html>
  );
}
