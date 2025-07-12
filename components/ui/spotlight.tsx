'use client';

import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface SpotlightProps extends HTMLAttributes<HTMLDivElement> {
  gradientFirst?: string;
  gradientSecond?: string;
  gradientThird?: string;
}

export function Spotlight({
  className,
  gradientFirst = 'radial-gradient(circle at 30% 30%, rgba(255,0,128,0.2), transparent 80%)',
  gradientSecond = 'radial-gradient(circle at 70% 70%, rgba(128,0,255,0.2), transparent 80%)',
  gradientThird = 'radial-gradient(circle at 50% 50%, rgba(0,128,255,0.1), transparent 80%)',
  ...props
}: SpotlightProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-0 transition duration-300',
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-[image:var(--gradientFirst)]" style={{ backgroundImage: gradientFirst }} />
      <div className="absolute inset-0 bg-[image:var(--gradientSecond)]" style={{ backgroundImage: gradientSecond }} />
      <div className="absolute inset-0 bg-[image:var(--gradientThird)]" style={{ backgroundImage: gradientThird }} />
    </div>
  );
}
