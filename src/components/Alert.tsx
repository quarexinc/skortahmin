import { AlertTriangle, Info, OctagonX } from 'lucide-react';
import type { ReactNode } from 'react';

interface AlertProps {
  variant?: 'warn' | 'error' | 'info';
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}

const STYLES: Record<string, string> = {
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  error: 'border-red-500/30 bg-red-500/10 text-red-100',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
};

const ICONS = { warn: AlertTriangle, error: OctagonX, info: Info };

export default function Alert({ variant = 'warn', title, children, action }: AlertProps) {
  return (
    <div className={`animate-fade-in rounded-2xl border p-4 text-sm ${STYLES[variant]}`}>
      <div className="flex items-start gap-3">
        {(() => {
          const I = ICONS[variant];
          return <I size={18} className="mt-0.5 shrink-0" aria-hidden />;
        })()}
        <div className="min-w-0 flex-1">
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className={title ? 'mt-1 opacity-90' : ''}>{children}</div>}
          {action}
        </div>
      </div>
    </div>
  );
}
