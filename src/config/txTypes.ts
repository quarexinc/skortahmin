// Kredi işlem türleri (cüzdan, işlem geçmişi ve yönetim panelinde ortak)
import { ArrowDownToLine, ArrowUpFromLine, CalendarCheck, Coins, Crown, Droplets, Gift, Minus, Plus, ShieldCheck, TicketPercent, Trophy, Undo2, Zap, type LucideIcon } from 'lucide-react';

export const TX_TYPES: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  bet: { label: 'Bahis', icon: Minus, color: 'text-slate-400' },
  win: { label: 'Kazanç', icon: Trophy, color: 'text-accent-soft' },
  refund: { label: 'İade', icon: Undo2, color: 'text-sky-300' },
  signup_bonus: { label: 'Hoş geldin kredisi', icon: Gift, color: 'text-pink-300' },
  daily_bonus: { label: 'Günlük bonus', icon: CalendarCheck, color: 'text-amber-300' },
  faucet: { label: 'Ücretsiz kredi', icon: Droplets, color: 'text-sky-300' },
  rakeback: { label: 'Rakeback', icon: Zap, color: 'text-violet-300' },
  level_reward: { label: 'VIP seviye ödülü', icon: Crown, color: 'text-amber-300' },
  promo: { label: 'Promosyon kodu', icon: TicketPercent, color: 'text-pink-300' },
  vault_in: { label: 'Kasaya aktarım', icon: ArrowDownToLine, color: 'text-slate-300' },
  vault_out: { label: 'Kasadan aktarım', icon: ArrowUpFromLine, color: 'text-slate-300' },
  admin_credit: { label: 'Yönetici kredisi', icon: Plus, color: 'text-accent-soft' },
  admin_debit: { label: 'Yönetici düzeltmesi', icon: ShieldCheck, color: 'text-red-300' },
};

export const txType = (t: string) => TX_TYPES[t] ?? { label: t, icon: Coins, color: 'text-slate-400' };
