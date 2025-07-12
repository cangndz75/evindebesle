import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description: string;
  variant?: 'purple' | 'blue' | 'amber' | 'rose';
  glowEffect?: boolean;
  size?: 'md' | 'lg';
}

export function CardHoverEffect({
  icon,
  title,
  description,
  variant = 'purple',
  glowEffect = false,
  size = 'md',
}: Props) {
  const variants = {
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-400',
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border border-white/10 p-6 backdrop-blur-md transition hover:scale-[1.02]',
        glowEffect && 'hover:shadow-xl hover:shadow-current/10',
        `bg-gradient-to-br ${variants[variant]}`,
        size === 'lg' ? 'p-8' : 'p-6'
      )}
    >
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
