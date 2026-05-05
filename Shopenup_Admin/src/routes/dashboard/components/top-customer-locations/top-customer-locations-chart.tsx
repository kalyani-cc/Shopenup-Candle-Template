"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { useTopCustomerLocations } from "../../../../hooks/api/use-dashboard"
import { Heading, Text } from "@shopenup/ui"

const COLORS = [
  "#6366f1",
  "#6366f1",
  "#6366f1",
  "#6366f1",
  "#6366f1",
  "#6366f1",
  "#6366f1",
  "#6366f1",
  "#6366f1",
  "#6366f1",
]

const ChartCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-md border border-gray-200 bg-white p-3 shadow-md dark:border-ui-border-base dark:bg-ui-bg-base">
        <Text className="mb-1 font-semibold text-gray-800 dark:text-ui-fg-base">
          {label}
        </Text>
        <Text className="text-sm text-gray-600 dark:text-ui-fg-muted">
          Orders:{" "}
          <span className="font-medium text-gray-900 dark:text-ui-fg-subtle">
            {data.orderCount.toLocaleString()}
          </span>
        </Text>
        {data.countryCode && (
          <Text className="text-sm text-gray-500 dark:text-ui-fg-muted">
            Country: {data.countryCode.toUpperCase()}
          </Text>
        )}
      </div>
    )
  }
  return null
}

export const TopCustomerLocationsChart = () => {
  const { data, isLoading, isError, error } = useTopCustomerLocations()

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 dark:border-ui-border-base dark:bg-ui-bg-subtle">
        <Heading
          level="h2"
          className="mb-4 text-xl font-semibold text-gray-800 dark:text-ui-fg-base"
        >
          Top 10 Customer Locations
        </Heading>
        <Text className="text-gray-500 dark:text-ui-fg-muted">Loading...</Text>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 dark:border-ui-border-base dark:bg-ui-bg-subtle">
        <Heading
          level="h2"
          className="mb-4 text-xl font-semibold text-gray-800 dark:text-ui-fg-base"
        >
          Top 10 Customer Locations
        </Heading>
        <Text className="text-red-500 dark:text-red-400">
          Error:{" "}
          {error instanceof Error ? error.message : "Failed to load data"}
        </Text>
      </div>
    )
  }

  if (!data || !data.data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 dark:border-ui-border-base dark:bg-ui-bg-subtle">
        <Heading
          level="h2"
          className="mb-4 text-xl font-semibold text-gray-800 dark:text-ui-fg-base"
        >
          Top 10 Customer Locations
        </Heading>
        <Text className="text-gray-500 dark:text-ui-fg-muted">No data available</Text>
      </div>
    )
  }

  const { topLocations } = data.data

  if (!topLocations || topLocations.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 dark:border-ui-border-base dark:bg-ui-bg-subtle">
        <Heading
          level="h2"
          className="mb-4 text-xl font-semibold text-gray-800 dark:text-ui-fg-base"
        >
          Top 10 Customer Locations
        </Heading>
        <Text className="text-gray-500 dark:text-ui-fg-muted">
          No location data available
        </Text>
      </div>
    )
  }

  const chartData = topLocations.map((location, index) => ({
    state: location.state,
    orderCount: location.orderCount,
    countryCode: location.countryCode,
    color: COLORS[index % COLORS.length],
  }))

  return (
    <div className="flex min-h-[400px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 dark:border-ui-border-base dark:bg-ui-bg-subtle">
      <Heading
        level="h2"
        className="mb-4 text-xl font-semibold text-gray-800 dark:text-ui-fg-base"
      >
        Top 10 Customer Locations
      </Heading>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          className="text-gray-200 dark:text-gray-700 [&_.recharts-label]:fill-gray-600 dark:[&_.recharts-label]:fill-ui-fg-muted"
          data={chartData}
          margin={{
            top: 20,
            right: 20,
            left: 10,
            bottom: 50,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
          <XAxis
            dataKey="state"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            stroke="currentColor"
            className="text-gray-300 dark:text-gray-600"
            tick={{
              fontSize: 12,
              className: "fill-gray-600 dark:fill-ui-fg-muted",
            }}
          />
          <YAxis
            allowDecimals={false}
            stroke="currentColor"
            className="text-gray-300 dark:text-gray-600"
            tick={{
              fontSize: 12,
              className: "fill-gray-600 dark:fill-ui-fg-muted",
            }}
          />
          <Tooltip content={<ChartCustomTooltip />} />
          <Bar
            dataKey="orderCount"
            radius={[8, 8, 0, 0]}
            className="dark:[&_path]:!fill-[#818cf8] dark:[&_rect]:!fill-[#818cf8]"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
