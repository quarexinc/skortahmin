// ---------------------------------------------------------------------------
// Poisson tabanlı tahmin motoru.
//
// Girdiler yalnızca API'den gelen GERÇEK istatistiklerdir:
//  1) Sezon:  λ_home = (AFH × DAA) / μ_home   ·   λ_away = (AFA × DAH) / μ_away
//     AFH: ev sahibinin evdeki maç başı attığı gol
//     DAA: deplasmanın deplasmanda yediği gol
//     AFA: deplasmanın deplasmanda attığı gol
//     DAH: ev sahibinin evde yediği gol
//     μ_home / μ_away: lig ev sahibi / deplasman maç başı gol ortalaması
//  2) Form (son 10 maç): λ_home = (evFor + deplAgainst) / 2  (simetrik saldırı/savunma)
//  3) H2H (son 10 maç):  aynı simetrik formül
//
// Harmanlama: sezon %55 · form %25 · H2H %20 — kullanılabilir parçalar arasında
// normalize edilir (H2H yoksa H2H ağırlığı 0'a çekilir).
//
// Skor matrisi: P(i,j) = Poisson(i; λ_home) × Poisson(j; λ_away), i,j = 0..6
// (λ > 4 ise 0..8'e genişler). Matris toplamı 1'e normalize edilir (kesme payı
// için); 1X2, KG, Alt/Üst ve tam skor olasılıkları bu matristen türetilir.
// ---------------------------------------------------------------------------

export interface LambdaPair {
  home: number | null;
  away: number | null;
}

export interface PredictionInputs {
  season: {
    afh: number | null;
    daa: number | null;
    afa: number | null;
    dah: number | null;
    muHome: number | null;
    muAway: number | null;
    /** ev sahibinin EVDE oynadığı maç sayısı (0/boş = blok veri değil, "oyun yok") */
    playedHome: number | null;
    /** deplasmanın DEPLASMANDA oynadığı maç sayısı */
    playedAway: number | null;
  } | null;
  form: {
    homeFor: number | null;
    homeAgainst: number | null;
    awayFor: number | null;
    awayAgainst: number | null;
  } | null;
  h2h: {
    homeFor: number | null;
    homeAgainst: number | null;
    awayFor: number | null;
    awayAgainst: number | null;
    matches: number;
  } | null;
}

export interface ScoreProb {
  home: number;
  away: number;
  /** 0..1 arası olasılık */
  prob: number;
}

export interface ModelResult {
  ok: boolean;
  /** ok=false ise nedeni (Türkçe) */
  reason: string | null;
  lambdaHome: number | null;
  lambdaAway: number | null;
  /** normalize edilmiş ağırlıklar (toplam 1) */
  weights: { season: number; form: number; h2h: number } | null;
  partLambdas: { season: LambdaPair | null; form: LambdaPair | null; h2h: LambdaPair | null };
  matrixMax: number | null;
  bestScore: ScoreProb | null;
  topScores: ScoreProb[];
  oneXTwo: { home: number; draw: number; away: number } | null;
  btts: { yes: number; no: number } | null;
  totals: {
    over15: number;
    under15: number;
    over25: number;
    under25: number;
    over35: number;
    under35: number;
  } | null;
  /** şeffaflık: modelin kullandığı girdilerin kendisi */
  inputs: {
    season: PredictionInputs['season'];
    form: PredictionInputs['form'];
    h2h: PredictionInputs['h2h'];
  };
}

/** Sabit ağırlıklar (proje gereksinimi) */
export const BASE_WEIGHTS = { season: 0.55, form: 0.25, h2h: 0.2 } as const;
const MAX_LAMBDA = 10;

const FACT: number[] = [1];
for (let i = 1; i <= 15; i++) FACT.push(FACT[i - 1] * i);

export function poissonPmf(k: number, lambda: number): number {
  if (!Number.isFinite(lambda) || lambda < 0) return 0;
  if (lambda === 0) return k === 0 ? 1 : 0;
  const f = k < FACT.length ? FACT[k] : FACT[FACT.length - 1] * 10 ** (k - FACT.length + 1);
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / f;
}

const isNum = (v: number | null | undefined): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isPos = (v: number | null | undefined): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0;

export function computePrediction(input: PredictionInputs): ModelResult {
  const result: ModelResult = {
    ok: false,
    reason: null,
    lambdaHome: null,
    lambdaAway: null,
    weights: null,
    partLambdas: { season: null, form: null, h2h: null },
    matrixMax: null,
    bestScore: null,
    topScores: [],
    oneXTwo: null,
    btts: null,
    totals: null,
    inputs: {
      season: input.season ?? null,
      form: input.form ?? null,
      h2h: input.h2h ?? null,
    },
  };

  // 1) Sezon λ — iki takımın ilgili bloklarının GERÇEKTEN maç oynamış olması
  //    gerekir (0 maç = veri yok; "0 gol ortalaması" gibi yanlış yorumlanmaz)
  const s = input.season;
  if (
    s &&
    isPos(s.playedHome) &&
    isPos(s.playedAway) &&
    isNum(s.afh) &&
    isNum(s.daa) &&
    isNum(s.afa) &&
    isNum(s.dah) &&
    isPos(s.muHome) &&
    isPos(s.muAway)
  ) {
    result.partLambdas.season = {
      home: (s.afh * s.daa) / s.muHome,
      away: (s.afa * s.dah) / s.muAway,
    };
  }

  // 2) Form λ
  const f = input.form;
  if (f && isNum(f.homeFor) && isNum(f.homeAgainst) && isNum(f.awayFor) && isNum(f.awayAgainst)) {
    result.partLambdas.form = {
      home: (f.homeFor + f.awayAgainst) / 2,
      away: (f.awayFor + f.homeAgainst) / 2,
    };
  }

  // 3) H2H λ
  const h = input.h2h;
  if (h && h.matches > 0 && isNum(h.homeFor) && isNum(h.homeAgainst) && isNum(h.awayFor) && isNum(h.awayAgainst)) {
    result.partLambdas.h2h = {
      home: (h.homeFor + h.awayAgainst) / 2,
      away: (h.awayFor + h.homeAgainst) / 2,
    };
  }

  // 4) Ağırlıklı harmanlama (mevcut parçalar arasında normalize)
  const entries: { key: 'season' | 'form' | 'h2h'; base: number; home: number; away: number }[] = [];
  const pushPart = (key: 'season' | 'form' | 'h2h', base: number, l: LambdaPair | null): void => {
    if (l && l.home != null && l.away != null) entries.push({ key, base, home: l.home, away: l.away });
  };
  pushPart('season', BASE_WEIGHTS.season, result.partLambdas.season);
  pushPart('form', BASE_WEIGHTS.form, result.partLambdas.form);
  pushPart('h2h', BASE_WEIGHTS.h2h, result.partLambdas.h2h);

  if (entries.length === 0) {
    result.reason =
      'Tahmin için yeterli gerçek veri bulunamadı (sezon istatistiği, son maç formu ve H2H verilerinin hiçbiri kullanılamadı).';
    return result;
  }

  const weightSum = entries.reduce((acc, e) => acc + e.base, 0);
  const weights = { season: 0, form: 0, h2h: 0 };
  let lh = 0;
  let la = 0;
  for (const e of entries) {
    const w = e.base / weightSum;
    weights[e.key] = w;
    lh += w * e.home;
    la += w * e.away;
  }
  lh = Math.min(MAX_LAMBDA, Math.max(0, lh));
  la = Math.min(MAX_LAMBDA, Math.max(0, la));

  result.weights = weights;
  result.lambdaHome = lh;
  result.lambdaAway = la;
  result.matrixMax = Math.max(lh, la) > 4 ? 8 : 6;

  // 5) Skor olasılık matrisi + normalize
  const n = result.matrixMax;
  const ph: number[] = [];
  const pa: number[] = [];
  for (let i = 0; i <= n; i++) {
    ph.push(poissonPmf(i, lh));
    pa.push(poissonPmf(i, la));
  }
  let sum = 0;
  const matrix: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const row: number[] = [];
    for (let j = 0; j <= n; j++) {
      const p = ph[i] * pa[j];
      row.push(p);
      sum += p;
    }
    matrix.push(row);
  }
  if (!(sum > 0)) {
    result.reason = 'Olasılık matrisi hesaplanamadı (bozuk girdi).';
    return result;
  }
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) matrix[i][j] /= sum;

  // 6) Türetilen oranlar
  let home = 0;
  let draw = 0;
  let away = 0;
  let bttsYes = 0;
  let over15 = 0;
  let over25 = 0;
  let over35 = 0;
  const scores: ScoreProb[] = [];
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) {
      const p = matrix[i][j];
      if (i > j) home += p;
      else if (i === j) draw += p;
      else away += p;
      if (i >= 1 && j >= 1) bttsYes += p;
      const total = i + j;
      if (total >= 2) over15 += p;
      if (total >= 3) over25 += p;
      if (total >= 4) over35 += p;
      scores.push({ home: i, away: j, prob: p });
    }
  }

  scores.sort((a, b) => b.prob - a.prob);
  result.topScores = scores.slice(0, 5);
  result.bestScore = result.topScores[0] ?? null;
  result.oneXTwo = { home, draw, away };
  result.btts = { yes: bttsYes, no: 1 - bttsYes };
  result.totals = {
    over15,
    under15: 1 - over15,
    over25,
    under25: 1 - over25,
    over35,
    under35: 1 - over35,
  };
  result.ok = true;
  return result;
}
