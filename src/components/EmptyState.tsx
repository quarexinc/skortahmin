import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  children?: ReactNode;
}

export default function EmptyState({ icon = '⚽', title, children }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center gap-2 p-10 text-center">
      <span className="text-3xl opacity-60" aria-hidden>
        {icon}
      </span>
      <p className="font-semibold text-slate-300">{title}</p>
      {children && <p className="max-w-md text-sm text-slate-500">{children}</p>}
    </div>
  );
}
