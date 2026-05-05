import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useMemo, useState, useEffect } from 'react'
import type { DashboardSummaryType, StatusData } from '../types'
import { EmptyState } from '../components/empty-state'

type OrderStatusChartProps = {
  summary: DashboardSummaryType
}

// Custom tooltip component to show count on hover
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-ui-border-base dark:bg-ui-bg-base">
        <p className="font-semibold text-gray-800 dark:text-ui-fg-base">
          {data.name}
        </p>
        <p className="text-sm text-gray-600 dark:text-ui-fg-muted">
          Count:{" "}
          <span className="font-medium text-gray-900 dark:text-ui-fg-subtle">
            {data.count.toLocaleString()}
          </span>
        </p>
        <p className="text-sm text-gray-600 dark:text-ui-fg-muted">
          Percentage:{" "}
          <span className="font-medium text-gray-900 dark:text-ui-fg-subtle">
            {data.percentage}%
          </span>
        </p>
      </div>
    )
  }
  return null
}

/**
 * Extract numeric value from summary (handles both normal and comparison mode)
 */
function getSummaryValue(summary: DashboardSummaryType, key: keyof typeof summary): number {
  const value = summary[key]
  if (typeof value === 'object' && value !== null && 'current' in value) {
    return (value as { current: number }).current
  }
  return value as number
}

export function OrderStatusChart({ summary }: OrderStatusChartProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Custom label component that uses isMobile state
  const renderCustomLabel = useMemo(() => {
    return (props: any) => {
      const { cx, x, y, name, count, percentage } = props
      if (!name) return null

      // On mobile, show name and percentage inside/on the segment
      if (isMobile) {
        return (
          <text
            x={x}
            y={y}
            className="fill-white stroke-gray-800 dark:stroke-gray-300"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fontWeight={600}
            strokeWidth={0.5}
          >
            {`${name} ${percentage}%`}
          </text>
        )
      }

      // Desktop: show full labels outside the chart
      const textAnchor = x > cx ? 'start' : 'end'
      const adjustedX = x > cx ? x + 5 : x - 5

      return (
        <text
          x={adjustedX}
          y={y}
          className="fill-gray-700 dark:fill-ui-fg-subtle"
          textAnchor={textAnchor}
          dominantBaseline="central"
          fontSize={12}
          fontWeight={500}
        >
          {`${name} ${count.toLocaleString()} (${percentage}%)`}
        </text>
      )
    }
  }, [isMobile])

  const chartData = useMemo<StatusData[]>(() => {
    const pending = getSummaryValue(summary, 'total_pending')
    const shipping = getSummaryValue(summary, 'total_shipping')
    const delivered = getSummaryValue(summary, 'total_delivered')
    const canceled = getSummaryValue(summary, 'total_canceled')
    const returned = getSummaryValue(summary, 'total_returned')

    const total = pending + shipping + delivered + canceled + returned

    if (total === 0) {
      return []
    }

    const data: StatusData[] = [
      {
        name: 'Completed',
        value: delivered,
        count: delivered,
        percentage: Math.round((delivered / total) * 100),
        color: '#6366f1', // indigo-500
      },
      {
        name: 'In Transit',
        value: pending,
        count: pending,
        percentage: Math.round((pending / total) * 100),
        color: '#8b5cf6', // violet-500
      },
      {
        name: 'Shipped',
        value: shipping,
        count: shipping,
        percentage: Math.round((shipping / total) * 100),
        color: '#a78bfa', // violet-400
      },
      {
        name: 'Cancelled',
        value: canceled,
        count: canceled,
        percentage: Math.round((canceled / total) * 100),
        color: '#1e40af', // blue-800
      },
      {
        name: 'Returned',
        value: returned,
        count: returned,
        percentage: Math.round((returned / total) * 100),
        color: '#3b82f6', // blue-500
      },
    ]

    // Filter out zero values and sort by value descending
    return data
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [summary])

  if (chartData.length === 0) {
    return (
      <div className="flex w-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow dark:border-ui-border-base dark:bg-ui-bg-subtle lg:flex-1">
        <div className="mb-4 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-ui-fg-base">
            Order Status Distribution
          </h2>
          <div className="h-5"></div>
        </div>
        <div className="flex min-h-[360px] w-full flex-1 items-center justify-center">
          <EmptyState message="No order data available" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow dark:border-ui-border-base dark:bg-ui-bg-subtle lg:flex-1">
      <div className="mb-4 flex flex-col">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-ui-fg-base">
          Order Status Distribution
        </h2>
        <div className="h-5"></div>
      </div>
      <div className="flex min-h-[360px] w-full flex-1 items-center justify-center">
        <ResponsiveContainer width="100%" height={360}>
          <PieChart
            margin={
              isMobile
                ? { top: 20, right: 20, bottom: 20, left: 20 }
                : { top: 20, right: 120, bottom: 20, left: 120 }
            }
          >
            <Pie
              data={chartData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius="30%"
              outerRadius="70%"
              label={renderCustomLabel}
              labelLine={() => {
                // Hide label lines on mobile (when labels are inside segments)
                if (isMobile) {
                  return <line stroke="none" strokeWidth={0} />
                }
                return (
                  <line
                    className="stroke-gray-500 dark:stroke-gray-300"
                    strokeWidth={1}
                  />
                )
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

