"use client";

import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { formatCurrency } from "@/lib/currency";

export function AnimatedCurrency({
  value,
  currency,
}: {
  value: number;
  currency: string;
}) {
  const animated = useAnimatedCounter(value);
  return <>{formatCurrency(animated, currency)}</>;
}

export function AnimatedInteger({ value }: { value: number }) {
  const animated = useAnimatedCounter(value, 600);
  return <>{Math.round(animated)}</>;
}
