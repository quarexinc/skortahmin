export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-ink-700/50 ${className}`} />;
}
