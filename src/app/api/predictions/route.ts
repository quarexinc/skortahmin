// Tek maç için kullanıcı tahmini + topluluk dağılımı
import { getUser, HttpError, requireUser } from '@/lib/auth';
import { q, q1 } from '@/lib/db';
import { body, int, route } from '@/lib/http';
import { getFixture } from '@/lib/matchData';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  const fixtureId = int(new URL(req.url).searchParams.get('fixture'), 'Maç');
  const u = await getUser();
  const mine = u
    ? await q1('SELECT home_goals, away_goals, status, points, actual_home, actual_away FROM predictions WHERE user_id = $1 AND fixture_id = $2', [u.id, fixtureId])
    : null;
  const dist = await q1<{ total: number; home: number; draw: number; away: number }>(
    `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE home_goals > away_goals)::int AS home,
       COUNT(*) FILTER (WHERE home_goals = away_goals)::int AS draw,
       COUNT(*) FILTER (WHERE home_goals < away_goals)::int AS away
     FROM predictions WHERE fixture_id = $1`,
    [fixtureId],
  );
  const top = await q(
    `SELECT home_goals, away_goals, COUNT(*)::int AS n FROM predictions WHERE fixture_id = $1
     GROUP BY home_goals, away_goals ORDER BY n DESC LIMIT 3`,
    [fixtureId],
  );
  return { mine, community: { ...dist, top } };
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  const fixtureId = int(b.fixtureId, 'Maç', { min: 1 });
  const home = int(b.home, 'Ev sahibi gol', { min: 0, max: 15 });
  const away = int(b.away, 'Deplasman gol', { min: 0, max: 15 });
  const f = await getFixture(fixtureId);
  if (!f) throw new HttpError(404, 'Maç bulunamadı.');
  const kickoff = new Date(f.fixture.date).getTime();
  const st = f.fixture.status?.short ?? 'NS';
  if (!['NS', 'TBD'].includes(st) || kickoff <= Date.now())
    throw new HttpError(400, 'Bu maç başladı; tahminler kilitlendi.');
  await q(
    `INSERT INTO predictions (user_id, fixture_id, home_goals, away_goals, fixture_date, home_name, away_name, league_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id, fixture_id) DO UPDATE SET home_goals = $3, away_goals = $4, fixture_date = $5, updated_at = NOW()`,
    [u.id, fixtureId, home, away, f.fixture.date, f.teams.home.name, f.teams.away.name, f.league?.name ?? null],
  );
  return { ok: true };
});

export const DELETE = route(async (req) => {
  const u = await requireUser();
  const fixtureId = int(new URL(req.url).searchParams.get('fixture'), 'Maç');
  const r = await q1<{ fixture_date: Date; status: string }>('SELECT fixture_date, status FROM predictions WHERE user_id = $1 AND fixture_id = $2', [u.id, fixtureId]);
  if (!r) return { ok: true };
  if (r.status !== 'pending' || new Date(r.fixture_date).getTime() <= Date.now()) throw new HttpError(400, 'Başlamış maçın tahmini silinemez.');
  await q('DELETE FROM predictions WHERE user_id = $1 AND fixture_id = $2', [u.id, fixtureId]);
  return { ok: true };
});
