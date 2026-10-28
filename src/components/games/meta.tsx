import type { CSSProperties } from 'react';
import { GameIcon } from '@/components/icons/GameIcons';
import { GAME_INFO, GAME_KEYS, rtpLabel, type GameKey } from '@/lib/games/registry';

type IconProps = { size?: number; className?: string; style?: CSSProperties; strokeWidth?: number };

export interface GameMeta {
  name: string;
  /** özel çizim ikon (lucide uyumlu imza: size, className) */
  icon: (p: IconProps) => JSX.Element;
  color: string;
  href: string;
  desc: string;
  /** varsayılan kasa payına göre etiket; canlı değer için edgeLabel(site.edges, key) */
  edge: string;
}

export const GAME_META = Object.fromEntries(
  GAME_KEYS.map((k) => {
    const i = GAME_INFO[k];
    const icon = ({ size = 24, className }: IconProps) => <GameIcon game={k} size={size} className={className} />;
    const meta: GameMeta = { name: i.name, icon, color: i.color, href: `/oyunlar/${k}`, desc: i.desc, edge: rtpLabel(i.edge) };
    return [k, meta];
  }),
) as Record<GameKey, GameMeta>;

/** Admin ayarındaki güncel kasa payına göre RTP etiketi */
export const edgeLabel = (edges: Record<string, number> | undefined, k: GameKey, blackjackPayout = 1.5) =>
  k === 'blackjack' ? `Blackjack ${blackjackPayout === 1.5 ? '3:2' : blackjackPayout === 1.2 ? '6:5' : `${blackjackPayout}x`}` : rtpLabel(edges?.[k] ?? GAME_INFO[k].edge);
