import { useMemo } from "react";
import { usePromotions } from "../../../../hooks/api/promotions";
import { useDashboardFilter } from "../../../../providers/dashboard-filter-provider";

interface TopPerformingPromoCodesTableProps {
  className?: string;
}

type PromoCodeStats = {
  code: string;
  orders: number;
  revenue: number;
  avgDiscount: number;
  totalDiscount: number;
  promotionId?: string;
};

const cardOuter =
  "overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-xl dark:border-ui-border-base dark:bg-ui-bg-subtle";

const cardHeader =
  "bg-gradient-to-r from-indigo-50 via-blue-50 to-violet-50 p-3 sm:p-4 dark:from-indigo-950/50 dark:via-slate-900/60 dark:to-violet-950/50";

export const TopPerformingPromoCodesTable = ({ className }: TopPerformingPromoCodesTableProps) => {
  const { filters } = useDashboardFilter();

  // Build query filters for promotions - use dashboard filter format (calls custom API)
  const promotionQueryFilters = useMemo(() => {
    if (!filters.dateRange?.from || !filters.dateRange?.to) {
      return undefined; // Don't use custom API if dateRange is missing
    }
    return {
      dateRange: {
        from: filters.dateRange.from,
        to: filters.dateRange.to,
      },
      selectedDateRange: filters.selectedDateRange,
      region: filters.region,
      state: filters.state,
      comparisonMode: filters.comparisonMode,
      limit: 999999,
      offset: 0,
    };
  }, [filters]);

  // Fetch promotions with dashboard filters applied (uses custom API endpoint)
  // The API returns topPerformingPromoCodes data directly
  const promotionsData = usePromotions(promotionQueryFilters);

  const { isLoading, error } = promotionsData;

  // Extract top performing promo codes from API response and sort by order count (highest first)
  const promoCodeStats = useMemo(() => {
    if (promotionsData && 'topPerformingPromoCodes' in promotionsData && promotionsData.topPerformingPromoCodes) {
      const stats = promotionsData.topPerformingPromoCodes as PromoCodeStats[];
      // Sort by orders count in descending order (highest first)
      return [...stats].sort((a, b) => b.orders - a.orders);
    }
    return [];
  }, [promotionsData]);

  if (isLoading) {
    return (
      <div
        className={`animate-pulse rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-lg dark:border-ui-border-base dark:bg-ui-bg-subtle dark:text-ui-fg-muted ${className ?? ""}`}
      >
        Loading top performing promo codes...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-xl border border-red-200 bg-white p-6 text-center text-red-600 shadow-lg dark:border-red-900/50 dark:bg-ui-bg-subtle dark:text-red-400 ${className ?? ""}`}
      >
        <div className="font-medium">Failed to load data.</div>
        {error && (
          <div className="mt-2 text-xs text-red-500/90 dark:text-red-400/80">
            Error: {error?.message || JSON.stringify(error)}
          </div>
        )}
      </div>
    );
  }

  if (promoCodeStats.length === 0) {
    return (
      <div className={`${cardOuter} ${className ?? ""}`}>
        <div className={cardHeader}>
          <h3 className="text-base font-semibold text-blue-800 dark:text-ui-fg-base sm:text-lg">
            Top Performing Promo Codes
          </h3>
        </div>
        <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-ui-fg-muted sm:px-4 sm:py-8 sm:text-base">
          No promo code data available
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardOuter} ${className ?? ""}`}>
      <div className={cardHeader}>
        <h3 className="text-base font-semibold text-blue-800 dark:text-ui-fg-base sm:text-lg">
          Top Performing Promo Codes
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-t border-gray-100 dark:border-ui-border-base">
          <thead className="bg-gray-50 dark:bg-ui-bg-base">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 dark:text-ui-fg-muted sm:px-4 sm:py-3 sm:text-sm">
                No
              </th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 dark:text-ui-fg-muted sm:px-4 sm:py-3 sm:text-sm">
                Promo Code
              </th>
              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 dark:text-ui-fg-muted sm:px-4 sm:py-3 sm:text-sm">
                Used In Orders
              </th>
            </tr>
          </thead>
          <tbody>
            {promoCodeStats.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-2 py-6 text-center text-sm text-gray-500 dark:text-ui-fg-muted sm:px-4 sm:py-8"
                >
                  No data available
                </td>
              </tr>
            ) : (
              promoCodeStats.map((stat, index) => (
                <tr
                  key={stat.code}
                  className="border-b border-gray-100 hover:bg-gray-50 dark:border-ui-border-base dark:hover:bg-ui-bg-base"
                >
                  <td className="px-2 py-2 text-xs text-gray-600 dark:text-ui-fg-muted sm:px-4 sm:py-3 sm:text-sm">
                    {index + 1}
                  </td>
                  <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-ui-fg-base sm:px-4 sm:py-3 sm:text-sm">
                    {stat.code || "-"}
                  </td>
                  <td className="px-2 py-2 text-center text-xs font-semibold text-gray-900 dark:text-ui-fg-subtle sm:px-4 sm:py-3 sm:text-sm">
                    {stat.orders.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

