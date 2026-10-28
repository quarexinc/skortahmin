import type { Metadata, Viewport } from 'next';
import AnnouncementBar from '@/components/AnnouncementBar';
import AuthProvider from '@/components/AuthProvider';
import ChatWidget from '@/components/ChatWidget';
import Footer from '@/components/Footer';
import MaintenanceGate from '@/components/MaintenanceGate';
import Navbar from '@/components/Navbar';
import { AgeGate, BackToTop, CookieBanner, PageTracker, SessionReminder } from '@/components/SiteExtras';
import { dbConfigured } from '@/lib/db';
import { getAnnouncements, getSettings } from '@/lib/settings';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'BloxyBet — Sanal kredilerle sosyal casino',
    template: '%s | BloxyBet',
  },
  description:
    'Crash, Mines, Slots, Blackjack, Plinko, Rulet ve 8 oyunu daha sanal kredilerle oyna. Doğrulanabilir adil sonuçlar, günlük bonus, rakeback ve VIP seviyeleri. Gerçek para yok. 18+',
  applicationName: 'BloxyBet',
  openGraph: { type: 'website', locale: 'tr_TR', siteName: 'BloxyBet' },
};

export const viewport: Viewport = {
  themeColor: '#05080f',
};

// Kök düzen artık çerez okumaz: sayfalar statik/ISR olarak CDN'den gelir, oturum istemcide /api/auth/me ile yüklenir.
export const revalidate = 60;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, announcements] = await Promise.all([getSettings(), getAnnouncements()]);
  const enabled = dbConfigured();
  const site = { edges: settings.edges, disabledGames: settings.disabledGames, blackjackPayout: settings.blackjackPayout };

  return (
    <html lang="tr" className="dark">
      <body className="flex min-h-screen flex-col bg-ink-950 font-sans text-slate-100">
        <AuthProvider enabled={enabled} site={site}>
          <Navbar />
          <AnnouncementBar items={announcements} />
          <MaintenanceGate active={settings.maintenance} message={settings.maintenanceMessage}>
            <div className="flex-1">{children}</div>
          </MaintenanceGate>
          <Footer />
          <ChatWidget enabled={enabled && settings.liveChatEnabled} supportHours={settings.supportHours} />
          <PageTracker />
          <AgeGate />
          <SessionReminder />
          <BackToTop />
          {settings.cookieBanner && <CookieBanner />}
        </AuthProvider>
      </body>
    </html>
  );
}
