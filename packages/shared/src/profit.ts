/** Default kirana margin: profit = this % of daily Vakro (sales). */
export const DEFAULT_PROFIT_MARGIN_PERCENT = 10;

/** Gross profit from daily Vakro at the configured margin. */
export function profitFromVakroPaise(
  vakroPaise: number,
  marginPercent = DEFAULT_PROFIT_MARGIN_PERCENT,
): number {
  return Math.round((vakroPaise * marginPercent) / 100);
}

/** Net profit after kharcho (expenses). */
export function netProfitPaise(grossProfitPaise: number, kharchoPaise: number): number {
  return grossProfitPaise - kharchoPaise;
}

export function profitFromVakroAfterKharcho(
  vakroPaise: number,
  kharchoPaise: number,
  marginPercent = DEFAULT_PROFIT_MARGIN_PERCENT,
): number {
  return netProfitPaise(profitFromVakroPaise(vakroPaise, marginPercent), kharchoPaise);
}
