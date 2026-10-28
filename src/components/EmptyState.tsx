import { CircleSlash, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  children?: ReactNode;
}

export default function EmptyState({ icon: Ico = CircleSlash, title, children }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center gap-2 p-10 text-center">
      <Ico size={30} strokeWidth={1.5} className="text-slate-500" aria-hidden />
      <p className="font-semibold text-slate-300">{title}</p>
      {children && <p className="max-w-md text-sm text-slate-500">{children}</p>}
    </div>
  );
}
