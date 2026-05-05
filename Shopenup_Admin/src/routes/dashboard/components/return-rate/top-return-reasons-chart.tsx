import { useMemo } from "react";
import { Text } from "@shopenup/ui";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useReturns } from "../../../../hooks/api/returns";
import { useDashboardFilter } from "../../../../providers/dashboard-filter-provider";

interface TopReturnReasonsChartProps {
  className?: string;
}

type ChartDataItem = {
  name: string;
  fullName: string;
  value: number;
};

const cardShell =
  "rounded-lg border border-gray-300 bg-white p-5 transition-colors hover:border-purple-600 focus-within:border-purple-600 dark:border-ui-border-base dark:bg-ui-bg-subtle dark:hover:border-violet-500 dark:focus-within:border-violet-500";

const ReturnReasonsTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as ChartDataItem | undefined;
  const title = row?.fullName ?? String(label ?? "");
  const value = payload[0]?.value as number;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md dark:border-ui-border-base dark:bg-ui-bg-base">
      <p className="mb-1 font-semibold text-gray-800 dark:text-ui-fg-base">{title}</p>
      <p className="text-sm text-gray-600 dark:text-ui-fg-muted">
        Count:{" "}
        <span className="font-medium text-gray-900 dark:text-ui-fg-subtle">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
      </p>
    </div>
  );
};

export const TopReturnReasonsChart = ({ className }: TopReturnReasonsChartProps) => {
  const { filters } = useDashboardFilter();

  // Build query filters for returns - use dashboard filter format (calls custom API)
  const returnQueryFilters = useMemo(() => {
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

  // Fetch returns with dashboard filters applied (uses custom API endpoint)
  // The API already filters returns to only include those from shipped orders
  const allReturns = useReturns(returnQueryFilters);

  const { isLoading, error } = allReturns;
  const returns = (allReturns as any)?.returns || [];

  // Process return reasons data dynamically from fetched database data
  const chartData = useMemo((): ChartDataItem[] => {
    if (!returns || returns.length === 0) {
      return [];
    }

    // Returns are already filtered by the API to only include returns from shipped orders
    const filteredReturns = returns;

    // Count occurrences of each return reason - dynamically from database
    // Handle different item formats: items, return_items, line_items (matching backend API)
    const reasonCounts: Record<string, number> = {};
    
    filteredReturns.forEach((returnItem: any) => {
      // Try different field names for return items (matching backend API logic)
      const items = returnItem.items || returnItem.return_items || returnItem.line_items || [];
      
      if (Array.isArray(items) && items.length > 0) {
        items.forEach((item: any) => {
          // Try different reason field formats (matching backend API logic)
          const reason = item.reason?.label || 
                        (typeof item.reason === 'string' ? item.reason : null) ||
                        item.return_reason ||
                        (item.reason_id ? `Reason ID: ${item.reason_id}` : null) ||
                        'No reason provided';
          
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        });
      } else if (returnItem.reason) {
        // Some returns might have reason at top level
        const reason = typeof returnItem.reason === 'string' 
          ? returnItem.reason 
          : (returnItem.reason?.label || 'No reason provided');
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      }
    });

    // Convert to array and sort by count (descending)
    const sortedReasons = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 reasons

    // Transform to recharts format - all data from database
    return sortedReasons.map(([label, count]) => ({
      name: label.length > 20 ? label.substring(0, 17) + '...' : label,
      fullName: label,
      value: count,
    }));
  }, [returns]);

  if (isLoading) {
    return (
      <div
        className={`${cardShell} flex items-center justify-center ${className ?? ""}`}
      >
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400" />
          <p className="text-sm text-gray-500 dark:text-ui-fg-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${cardShell} flex items-center justify-center ${className ?? ""}`}
      >
        <div className="text-center">
          <p className="text-sm text-red-600 dark:text-red-400">Error loading data</p>
        </div>
      </div>
    );
  }

  const total = chartData.reduce((sum: number, item: ChartDataItem) => sum + item.value, 0);

  if (total === 0 || chartData.length === 0) {
    return (
      <div className={`${cardShell} flex flex-col ${className ?? ""}`}>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-blue-900 dark:text-ui-fg-base">
            Top Return Reasons
          </h3>
        </div>
        <div className="flex h-64 items-center justify-center">
          <Text size="small" className="text-ui-fg-muted">
            No return data available
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardShell} flex flex-col ${className ?? ""}`}>
      <div className="flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-blue-900 dark:text-ui-fg-base">
            Top Return Reasons
          </h3>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              className="[&_.recharts-label]:fill-gray-600 dark:[&_.recharts-label]:fill-ui-fg-muted"
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom:
                  chartData.length > 5 ||
                  chartData.some((item) => item.name.length > 12)
                    ? 35
                    : 20,
              }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="0"
                vertical={false}
                stroke="transparent"
              />
              <XAxis
                dataKey="name"
                angle={
                  chartData.length > 5 ||
                  chartData.some((item) => item.name.length > 12)
                    ? -35
                    : 0
                }
                textAnchor={
                  chartData.length > 5 ||
                  chartData.some((item) => item.name.length > 12)
                    ? "end"
                    : "middle"
                }
                height={
                  chartData.length > 5 ||
                  chartData.some((item) => item.name.length > 12)
                    ? 45
                    : 25
                }
                interval={0}
                tick={{
                  fontSize: 12,
                  className: "fill-gray-500 dark:fill-ui-fg-muted",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 12,
                  className: "fill-gray-500 dark:fill-ui-fg-muted",
                }}
                axisLine={false}
                tickLine={false}
                width={50}
                domain={[0, "auto"]}
                allowDecimals={false}
              />
              <Tooltip
                content={<ReturnReasonsTooltip />}
                cursor={{ fill: "rgba(99, 102, 241, 0.12)" }}
              />
              <Bar
                dataKey="value"
                fill="#4242f5"
                radius={0}
                maxBarSize={80}
                className="dark:[&_path]:!fill-[#818cf8] dark:[&_rect]:!fill-[#818cf8]"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

