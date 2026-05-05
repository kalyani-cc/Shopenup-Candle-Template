/** Collect human-readable promotion codes from order line / shipping adjustments (store API). */

type AdjustmentLike = { code?: string | null };

type LineLike = { adjustments?: AdjustmentLike[] | null };

type ShippingMethodLike = { adjustments?: AdjustmentLike[] | null };

export type OrderWithPromotionAdjustments = {
  items?: LineLike[] | null;
  shipping_methods?: ShippingMethodLike[] | null;
};

export function collectPromoCodesFromOrder(order: OrderWithPromotionAdjustments): string[] {
  const codes = new Set<string>();
  for (const item of order.items ?? []) {
    for (const adj of item?.adjustments ?? []) {
      const c = typeof adj?.code === "string" ? adj.code.trim() : "";
      if (c) codes.add(c);
    }
  }
  for (const sm of order.shipping_methods ?? []) {
    for (const adj of sm?.adjustments ?? []) {
      const c = typeof adj?.code === "string" ? adj.code.trim() : "";
      if (c) codes.add(c);
    }
  }
  return [...codes];
}
