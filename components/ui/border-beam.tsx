'use client';

import { cn } from '@/lib/utils';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  reverse?: boolean;
}

export function BorderBeam({
  className,
  size = 400,
  duration = 6,
  reverse = false,
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute -inset-[1px] z-10 animate-spin-slow rounded-xl',
        reverse ? 'animate-spin-reverse' : 'animate-spin-slow',
        className
      )}
      style={{
        background: `conic-gradient(from 90deg at 50% 50%, transparent, currentColor, transparent)`,
        maskImage: `radial-gradient(circle, black ${size}px, transparent ${size}px)`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}
