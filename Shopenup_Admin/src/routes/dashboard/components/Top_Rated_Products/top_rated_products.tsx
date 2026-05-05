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
import { Heading, Text } from "@shopenup/ui"
import { useTopRatedProducts } from "../../../../hooks/api/use-dashboard"
import { useQueries } from "@tanstack/react-query"
import { sdk } from "../../../../lib/client/client"

const COLORS = ["#6366F1", "#6366F1", "#6366F1", "#6366F1", "#6366F1"]

const cardShell =
  "flex min-h-[400px] flex-col rounded-lg border border-gray-200 bg-white p-6 dark:border-ui-border-base dark:bg-ui-bg-subtle"

const ChartCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, average_rating, review_count } = payload[0].payload
    return (
      <div className="rounded-md border border-gray-200 bg-white p-3 shadow-md dark:border-ui-border-base dark:bg-ui-bg-base">
        <Text className="font-semibold text-gray-900 dark:text-ui-fg-base">
          {name}
        </Text>
        <Text className="text-sm text-gray-600 dark:text-ui-fg-muted">
          Average Rating:{" "}
          <span className="font-medium text-gray-900 dark:text-ui-fg-subtle">
            {average_rating.toFixed(1)} ⭐
          </span>
        </Text>
        <Text className="text-sm text-gray-500 dark:text-ui-fg-muted">
          Reviews: {review_count}
        </Text>
      </div>
    )
  }
  return null
}

export const TopRatedProductsChart = () => {
  const { data, isLoading, isError, error } = useTopRatedProducts()

  // Fetch product names for each product_id
  const productQueries = useQueries({
    queries:
      data?.data?.map((product) => ({
        queryKey: ["product", product.product_id],
        queryFn: async () => {
          try {
            const productData = await sdk.admin.product.retrieve(product.product_id, {
              fields: "id,title",
            })
            return { productId: product.product_id, name: productData.product.title }
          } catch {
            return { productId: product.product_id, name: product.product_id }
          }
        },
        enabled: !!data?.data && data.data.length > 0,
        staleTime: 5 * 60 * 1000,
      })) || [],
  })

  // Create map of product_id -> name
  const productNameMap = new Map<string, string>()
  productQueries.forEach((query) => {
    if (query.data) {
      productNameMap.set(query.data.productId, query.data.name)
    }
  })

  const isLoadingProducts = productQueries.some((q) => q.isLoading)

  if (isLoading || isLoadingProducts) {
    return (
      <div className={`${cardShell} items-center justify-center`}>
        <Heading
          level="h2"
          className="mb-4 text-xl font-semibold text-gray-800 dark:text-ui-fg-base"
        >
          Top Rated Products
        </Heading>
        <Text className="text-gray-500 dark:text-ui-fg-muted">Loading...</Text>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={`${cardShell} items-center justify-center`}>
        <Heading
          level="h2"
          className="mb-4 text-xl font-semibold text-gray-800 dark:text-ui-fg-base"
        >
          Top Rated Products
        </Heading>
        <Text className="text-red-500 dark:text-red-400">
          Error:{" "}
          {error instanceof Error ? error.message : "Failed to load data"}
        </Text>
      </div>
    )
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className={`${cardShell} items-center justify-center`}>
        <Heading
          level="h2"
          className="mb-4 text-xl font-semibold text-gray-800 dark:text-ui-fg-base"
        >
          Top Rated Products
        </Heading>
        <Text className="text-gray-500 dark:text-ui-fg-muted">No data available</Text>
      </div>
    )
  }

  const chartData = data.data.map((p, index) => ({
    ...p,
    name: productNameMap.get(p.product_id) || p.product_id,
    fill: COLORS[index % COLORS.length],
  }))

  if (chartData.length === 0) {
    return (
      <div className={`${cardShell} items-center justify-center`}>
        <Heading
          level="h2"
          className="mb-4 text-xl font-semibold text-gray-800 dark:text-ui-fg-base"
        >
          Top Rated Products
        </Heading>
        <Text className="text-gray-500 dark:text-ui-fg-muted">
          No review data available
        </Text>
      </div>
    )
  }

  // Custom X-axis tick for multi-line product names
  const CustomTick = ({ x, y, payload }: any) => {
    if (!payload?.value) return null
    const words = payload.value.split(" ")
    const mid = Math.ceil(words.length / 2)
    const line1 = words.slice(0, mid).join(" ")
    const line2 = words.slice(mid).join(" ")

    return (
      <g transform={`translate(${x},${y + 10})`}>
        <text
          textAnchor="middle"
          className="fill-gray-500 dark:fill-ui-fg-muted"
          fontSize={11}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <tspan x="0" dy="0">
            {line1}
          </tspan>
          {line2 && (
            <tspan x="0" dy="12">
              {line2}
            </tspan>
          )}
        </text>
      </g>
    )
  }

  return (
    <div className={`${cardShell} justify-between`}>
      <Heading
        level="h2"
        className="mb-4 text-lg font-semibold text-gray-800 dark:text-ui-fg-base"
      >
        Top Rated Products
      </Heading>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          className="text-gray-200 dark:text-gray-700 [&_.recharts-label]:fill-gray-600 dark:[&_.recharts-label]:fill-ui-fg-muted"
          data={chartData}
          margin={{ top: 20, right: 10, bottom: 60, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
          <XAxis
            dataKey="name"
            tick={<CustomTick />}
            interval={0}
            height={60}
            stroke="currentColor"
            className="text-gray-300 dark:text-gray-600"
          />
          <YAxis
            domain={[0, 5]}
            tickCount={6}
            stroke="currentColor"
            className="text-gray-300 dark:text-gray-600"
            tick={{
              fontSize: 12,
              className: "fill-gray-600 dark:fill-ui-fg-muted",
            }}
          />
          <Tooltip content={<ChartCustomTooltip />} />
          <Bar
            dataKey="average_rating"
            radius={[6, 6, 0, 0]}
            className="dark:[&_path]:!fill-[#818cf8] dark:[&_rect]:!fill-[#818cf8]"
          >
            {chartData.map((entry, i) => (
              <Cell key={`bar-${i}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <Text className="mt-4 text-center text-sm text-gray-500 dark:text-ui-fg-muted">
        Showing top {chartData.length} rated products
      </Text>
    </div>
  )
}
