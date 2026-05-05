import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'
import type { CategoryData } from '../types'
import { EmptyState } from '../components/empty-state'

type CategoryRevenueChartProps = {
  categories: CategoryData[]
}

// Custom tooltip component to show revenue on hover
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-ui-border-base dark:bg-ui-bg-base">
        <p className="font-semibold text-gray-800 dark:text-ui-fg-base">{data.name}</p>
        <p className="text-sm text-gray-600 dark:text-ui-fg-muted">
          Revenue:{" "}
          <span className="font-medium text-gray-900 dark:text-ui-fg-subtle">
            ₹{data.revenue.toLocaleString()}
          </span>
        </p>
        <p className="text-sm text-gray-600 dark:text-ui-fg-muted">
          Quantity:{" "}
          <span className="font-medium text-gray-900 dark:text-ui-fg-subtle">
            {data.quantity.toLocaleString()}
          </span>
        </p>
      </div>
    )
  }
  return null
}

// Custom tick component to display category names in 2 lines
const CustomTick = ({ x, y, payload, viewBox }: any) => {
  const name = payload.value || ''
  const words = name.split(' ')
  const midPoint = Math.ceil(words.length / 2)
  const line1 = words.slice(0, midPoint).join(' ')
  const line2 = words.slice(midPoint).join(' ')
  
  // Check if mobile view (chart width < 600px)
  const isMobile = viewBox?.width && viewBox.width < 600
  
  if (isMobile) {
    // On mobile, show truncated single line with ellipsis
    const maxLength = 12
    const truncatedName = name.length > maxLength 
      ? name.substring(0, maxLength - 3) + '...' 
      : name
    
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
          {truncatedName}
        </text>
      </g>
    )
  }
  
  // Desktop: show 2 lines
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
        {line1}
      </text>
      {line2 && (
        <text
          x={0}
          y={0}
          dy={22}
          textAnchor="middle"
          className="fill-gray-500 dark:fill-ui-fg-muted"
          fontSize={11}
        >
          {line2}
        </text>
      )}
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

export function CategoryRevenueChart({ categories }: CategoryRevenueChartProps) {
  const chartData = useMemo(() => {
    if (!categories || categories.length === 0) return []

    // Sort by revenue descending and limit to top categories
    return categories
      .filter((cat) => cat.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .map((cat) => ({
        name: cat.name,
        revenue: cat.revenue,
        quantity: cat.quantity,
      }))
  }, [categories])

  if (chartData.length === 0) {
    return (
      <div className="mt-6 w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-ui-border-base dark:bg-ui-bg-subtle lg:flex-1">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-ui-fg-base">
          Top Selling Categories
        </h2>
        <EmptyState message="No category data available" />
      </div>
    )
  }

  // Calculate max revenue for Y-axis scaling
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue))
  const paddedMax = maxRevenue * 1.2
  const yAxisMax = getNiceMax(paddedMax, maxRevenue)

  return (
    <div className="mt-6 w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-ui-border-base dark:bg-ui-bg-subtle lg:flex-1">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-ui-fg-base">
        Top Selling Categories
      </h2>
      <div className="w-full" style={{ minHeight: "300px", height: "400px" }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <BarChart
            className="text-gray-200 dark:text-gray-700"
            data={chartData}
            margin={{ top: 20, right: 10, bottom: 50, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
            <XAxis
              dataKey="name"
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
            <Bar
              dataKey="revenue"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              className="dark:[&_path]:!fill-[#818cf8] dark:[&_rect]:!fill-[#818cf8]"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

