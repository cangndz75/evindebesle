export function toKurus(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function fromKurus(kurus: number): number {
  if (!Number.isFinite(kurus)) return 0;
  return kurus / 100;
}

export function sumKurus(values: number[]): number {
  return values.reduce((acc, value) => acc + toKurus(value), 0);
}

export function formatAmount(value: number): number {
  return fromKurus(toKurus(value));
}
