// Tahmin yarışması puanlaması: bitmiş maçların tahminlerini puanlar.
// Tam skor = 3 puan, doğru sonuç (1/X/2) = 1 puan. Normal süre (90 dk) skoru esas alınır.
import 'server-only';
import { getFixture } from '@/lib/matchData';
import { notify, q } from '@/lib/db';

const FINISHED = new Set(['FT', 'AET', 'PEN']);
const VOID = new Set(['CANC', 'ABD', 'AWD', 'WO']);

let lastRun = 0;

export function pointsFor(ph: number, pa: number, ah: number, aa: number): number {
  if (ph === ah && pa === aa) return 3;
  return Math.sign(ph - pa) === Math.sign(ah - aa) ? 1 : 0;
}

/** Bekleyen tahminleri olan bitmiş maçları puanlar. API kotasını korumak için çağrı başına sınırlıdır. */
export async function scorePending(opts: { force?: boolean; limit?: number } = {}): Promise<number> {
  if (!opts.force && Date.now() - lastRun < 5 * 60_000) return 0;
  lastRun = Date.now();
  const rows = await q<{ fixture_id: number }>(
    `SELECT fixture_id FROM predictions
     WHERE status = 'pending' AND fixture_date < NOW() - INTERVAL '115 minutes'
     GROUP BY fixture_id ORDER BY MIN(fixture_date) LIMIT $1`,
    [opts.limit ?? 6],
  );
  let scored = 0;
  for (const { fixture_id } of rows) {
    try {
      const f = await getFixture(fixture_id);
      if (!f) continue;
      const st = f.fixture.status?.short ?? '';
      if (VOID.has(st)) {
        await q(`UPDATE predictions SET status = 'void', points = 0, updated_at = NOW() WHERE fixture_id = $1 AND status = 'pending'`, [fixture_id]);
        continue;
      }
      if (!FINISHED.has(st)) continue;
      const ft = f.score?.fulltime;
      const ah = ft?.home ?? f.goals.home;
      const aa = ft?.away ?? f.goals.away;
      if (ah == null || aa == null) continue;
      const preds = await q<{ id: number; user_id: number; home_goals: number; away_goals: number; home_name: string; away_name: string }>(
        `SELECT id, user_id, home_goals, away_goals, home_name, away_name FROM predictions WHERE fixture_id = $1 AND status = 'pending'`,
        [fixture_id],
      );
      for (const p of preds) {
        const pts = pointsFor(p.home_goals, p.away_goals, ah, aa);
        await q(
          `UPDATE predictions SET status = 'scored', actual_home = $2, actual_away = $3, points = $4, updated_at = NOW() WHERE id = $1`,
          [p.id, ah, aa, pts],
        );
        await notify(
          p.user_id,
          pts === 3 ? 'Tam skor! +3 puan' : pts === 1 ? 'Sonucu bildin! +1 puan' : 'Tahminin sonuçlandı',
          `${p.home_name} ${ah}–${aa} ${p.away_name} · Tahminin: ${p.home_goals}–${p.away_goals}`,
          '/hesap/tahminler',
        );
        scored++;
      }
    } catch (e) {
      console.error('[scoring] maç puanlanamadı', fixture_id, e);
    }
  }
  return scored;
}
