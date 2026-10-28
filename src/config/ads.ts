// Reklam yerleşim alanları (client + server ortak)
export const AD_PLACEMENTS = [
  { id: 'home_hero', label: 'Ana sayfa · hero altı', hint: 'Geniş banner, önerilen 1200×150' },
  { id: 'home_middle', label: 'Ana sayfa · orta', hint: 'Geniş banner, önerilen 1200×200' },
  { id: 'matches_top', label: 'Oyun lobisi · üst', hint: 'Geniş banner, önerilen 970×120' },
  { id: 'matches_inline', label: 'Cüzdan · alt', hint: 'Önerilen 970×120' },
  { id: 'match_top', label: 'VIP sayfası · üst', hint: 'Önerilen 970×120' },
  { id: 'match_bottom', label: 'Adil oyun sayfası · alt', hint: 'Önerilen 970×200' },
  { id: 'blog_inline', label: 'Blog · yazı içi', hint: 'Önerilen 728×120' },
  { id: 'leaderboard_side', label: 'Liderlik · üst', hint: 'Önerilen 970×120' },
  { id: 'footer_top', label: 'Tüm sayfalar · alt bilgi üstü', hint: 'Geniş banner, önerilen 1200×120' },
] as const;

export type AdPlacement = (typeof AD_PLACEMENTS)[number]['id'];
export const AD_PLACEMENT_IDS: string[] = AD_PLACEMENTS.map((p) => p.id);
