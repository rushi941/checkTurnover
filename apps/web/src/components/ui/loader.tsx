import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

export function PageLoader({ label = 'Loading…', fullScreen = false, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300',
        fullScreen ? 'min-h-screen' : 'min-h-[12rem] py-12',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function InlineLoader({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin text-primary', className)} aria-hidden />;
}
