import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'
import type { ChartData } from '../types'
import { EmptyState } from '../components/empty-state'

type SalesTrendChartProps = {
  chartData: ChartData[]
}

// Custom tooltip component to show sales and orders on hover
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-ui-border-base dark:bg-ui-bg-base">
        <p className="font-semibold text-gray-800 dark:text-ui-fg-base">
          {data.label}
        </p>
        <p className="text-sm text-gray-600 dark:text-ui-fg-muted">
          Sales:{" "}
          <span className="font-medium text-gray-900 dark:text-ui-fg-subtle">
            ₹{data.sales.toLocaleString()}
          </span>
        </p>
        <p className="text-sm text-gray-600 dark:text-ui-fg-muted">
          Orders:{" "}
          <span className="font-medium text-gray-900 dark:text-ui-fg-subtle">
            {data.orders.toLocaleString()}
          </span>
        </p>
      </div>
    )
  }
  return null
}

// Custom tick component to display labels (dates/time periods)
const CustomTick = ({ x, y, payload, viewBox }: any) => {
  const label = payload.value || ''
  
  // Check if mobile view (chart width < 600px)
  const isMobile = viewBox?.width && viewBox.width < 600
  
  if (isMobile) {
    // On mobile, truncate long labels
    const maxLength = 10
    const truncatedLabel = label.length > maxLength 
      ? label.substring(0, maxLength - 3) + '...' 
      : label
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={8}
          textAnchor="middle"
          className="fill-gray-500 dark:fill-ui-fg-muted"
          fontSize={9}
        >
          {truncatedLabel}
        </text>
      </g>
    )
  }
  
  // Desktop: show full label
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={8}
        textAnchor="middle"
        className="fill-gray-500 dark:fill-ui-fg-muted"
        fontSize={11}
      >
        {label}
      </text>
    </g>
  )
}

/**
 * Calculate nice maximum value for Y-axis scaling
 */
function getNiceMax(value: number, actualMax: number): number {
  if (value <= 0) return 1000
  
  // For values under 1000, use simple rounding
  if (actualMax < 1000) {
    return Math.ceil(value / 100) * 100
  }
  
  // For values 1000 and above, find nice number
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  let niceValue
  if (normalized <= 1.2) niceValue = 1.2
  else if (normalized <= 1.5) niceValue = 1.5
  else if (normalized <= 2) niceValue = 2
  else if (normalized <= 2.5) niceValue = 2.5
  else if (normalized <= 3) niceValue = 3
  else if (normalized <= 4) niceValue = 4
  else if (normalized <= 5) niceValue = 5
  else niceValue = 10
  
  const niceMax = niceValue * magnitude
  // Don't go more than 25% above the actual max
  const maxAllowed = actualMax * 1.25
  return Math.min(niceMax, maxAllowed)
}

export function SalesTrendChart({ chartData }: SalesTrendChartProps) {
  const processedData = useMemo(() => {
    if (!chartData || chartData.length === 0) return []

    // Sort by label to ensure proper order (if needed)
    return [...chartData].sort((a, b) => {
      // Try to sort by date if labels are dates, otherwise keep original order
      const dateA = new Date(a.label).getTime()
      const dateB = new Date(b.label).getTime()
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateA - dateB
      }
      return 0
    })
  }, [chartData])

  if (processedData.length === 0) {
    return (
      <div className="mt-6 w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-ui-border-base dark:bg-ui-bg-subtle lg:flex-1">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-ui-fg-base">
          Sales Trend
        </h2>
        <EmptyState message="No sales data available" />
      </div>
    )
  }

  // Calculate max sales for Y-axis scaling
  const maxSales = Math.max(...processedData.map((d) => d.sales))
  const paddedMax = maxSales * 1.2
  const yAxisMax = getNiceMax(paddedMax, maxSales)

  return (
    <div className="mt-6 w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-ui-border-base dark:bg-ui-bg-subtle lg:flex-1">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-ui-fg-base">
        Sales Trend
      </h2>
      <div className="w-full" style={{ minHeight: "300px", height: "400px" }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <LineChart
            className="text-gray-200 dark:text-gray-700"
            data={processedData}
            margin={{ top: 20, right: 10, bottom: 50, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
            <XAxis
              dataKey="label"
              tick={<CustomTick />}
              interval={0}
              height={50}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            <YAxis
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              tick={{
                fontSize: 12,
                className: "fill-gray-500 dark:fill-ui-fg-muted",
              }}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  const kValue = value / 1000
                  // Remove decimal if it's a whole number
                  return kValue % 1 === 0 ? `₹${kValue}K` : `₹${kValue.toFixed(1)}K`
                }
                return `₹${value}`
              }}
              domain={[0, yAxisMax]}
              width={60}
              allowDecimals={false}
              tickCount={5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#6366f1"
              strokeWidth={2}
              className="dark:[&_.recharts-line-curve]:stroke-[#818cf8]"
              dot={{
                r: 4,
                className: "fill-indigo-500 dark:fill-[#818cf8]",
              }}
              activeDot={{
                r: 6,
                className: "fill-indigo-500 dark:fill-[#818cf8]",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

