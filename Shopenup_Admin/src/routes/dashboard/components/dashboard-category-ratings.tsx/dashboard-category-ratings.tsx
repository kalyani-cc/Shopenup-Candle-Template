"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Container, Heading, Text } from "@shopenup/ui"
import { useCategoryRatings } from "../../../../hooks/api/use-dashboard"

/** Light UI: pale → saturated (top of stack → bottom) */
const RATING_COLORS_LIGHT = {
  rating_5: "#EEF2FF",
  rating_4: "#C7D2FE",
  rating_3: "#A5B4FC",
  rating_2: "#818CF8",
  rating_1: "#6366F1",
} as const

/** Dark UI: deeper indigos so every segment reads on dark surfaces */
const RATING_COLORS_DARK = {
  rating_5: "#312E81",
  rating_4: "#3730A3",
  rating_3: "#4338CA",
  rating_2: "#4F46E5",
  rating_1: "#6366F1",
} as const

function useHtmlDarkClass() {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    const read = () => setIsDark(root.classList.contains("dark"))
    read()
    const obs = new MutationObserver(read)
    obs.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])
  return isDark
}

const ChartCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload

    if (data.review_count === 0) {
      return (
        <div className="max-w-xs rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-ui-border-base dark:bg-ui-bg-base">
          <Text className="mb-1 font-semibold text-gray-800 dark:text-ui-fg-base">
            {data.category}
          </Text>
          <Text className="text-sm italic text-gray-500 dark:text-ui-fg-muted">
            No reviews yet
          </Text>
        </div>
      )
    }

    return (
      <div className="max-h-96 max-w-sm overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-ui-border-base dark:bg-ui-bg-base">
        <Text className="mb-2 font-semibold text-gray-800 dark:text-ui-fg-base">
          {data.category}
        </Text>
        <Text className="mb-3 text-sm text-gray-600 dark:text-ui-fg-muted">
          Avg Rating:{" "}
          <span className="font-medium text-gray-900 dark:text-ui-fg-subtle">
            {data.average_rating.toFixed(1)} ⭐
          </span>{" "}
          ({data.review_count} reviews)
        </Text>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((r) => {
            const count = data[`rating_${r}`]
            const products = data[`rating_${r}_products`]

            if (!count) return null

            const borderColors: Record<number, string> = {
              5: "border-indigo-200 dark:border-indigo-400",
              4: "border-indigo-300 dark:border-indigo-400",
              3: "border-indigo-400 dark:border-indigo-500",
              2: "border-indigo-500 dark:border-indigo-400",
              1: "border-indigo-600 dark:border-indigo-300",
            }

            return (
              <div key={r} className={`border-l-4 pl-2 ${borderColors[r]}`}>
                <Text className="text-xs font-semibold text-gray-700 dark:text-ui-fg-subtle">
                  {r}⭐ ({count} products)
                </Text>
                {products?.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {products.map((product: string, idx: number) => (
                      <li
                        key={idx}
                        className="truncate text-xs text-gray-600 dark:text-ui-fg-muted"
                      >
                        • {product}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  return null
}

const shellClass =
  "flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 dark:border-ui-border-base dark:bg-ui-bg-subtle"

export const CategoryRatingsChart = () => {
  const { data, isLoading, isError, error } = useCategoryRatings()
  const isDark = useHtmlDarkClass()
  const ratingColors = isDark ? RATING_COLORS_DARK : RATING_COLORS_LIGHT

  if (isLoading) {
    return (
      <Container className={shellClass}>
        <Heading
          level="h2"
          className="mb-4 text-lg font-semibold text-gray-900 dark:text-ui-fg-base"
        >
          Category Ratings
        </Heading>
        <Text className="text-gray-500 dark:text-ui-fg-muted">Loading...</Text>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className={shellClass}>
        <Heading
          level="h2"
          className="mb-4 text-lg font-semibold text-gray-900 dark:text-ui-fg-base"
        >
          Category Ratings
        </Heading>
        <Text className="text-red-500 dark:text-red-400">
          Error:{" "}
          {error instanceof Error ? error.message : "Failed to load data"}
        </Text>
      </Container>
    )
  }

  if (!data?.data?.length) {
    return (
      <Container className={shellClass}>
        <Heading
          level="h2"
          className="mb-4 text-lg font-semibold text-gray-900 dark:text-ui-fg-base"
        >
          Category Ratings
        </Heading>
        <Text className="text-gray-500 dark:text-ui-fg-muted">
          No category rating data available
        </Text>
      </Container>
    )
  }

  const chartData = data.data
  const categoriesWithReviews = chartData.filter((cat) => cat.review_count > 0)
  const categoriesWithoutReviews = chartData.filter((cat) => cat.review_count === 0)

  // Calculate chart height based on number of categories, with reasonable min/max
  const chartHeight = Math.min(Math.max(400, chartData.length * 80), 600)

  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const categoryData = chartData.find((cat) => cat.category === payload.value)
    const hasNoReviews = categoryData?.review_count === 0
    const label = payload.value
    const maxLength = 25
    const displayLabel = label.length > maxLength ? label.substring(0, maxLength) + "..." : label
    const reviewIndicator = hasNoReviews ? " (No reviews)" : ""
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={10}
          textAnchor="end"
          className={
            hasNoReviews
              ? "fill-gray-400 dark:fill-ui-fg-muted"
              : "fill-gray-700 dark:fill-ui-fg-subtle"
          }
          fontSize={13}
          fontWeight={hasNoReviews ? "normal" : "500"}
          transform="rotate(-45)"
        >
          {displayLabel}{reviewIndicator}
        </text>
      </g>
    )
  }

  return (
    <div className="flex w-full flex-col rounded-xl border border-gray-200 bg-white p-6 dark:border-ui-border-base dark:bg-ui-bg-subtle">
      <Heading
        level="h2"
        className="mb-4 text-xl font-semibold text-gray-800 dark:text-ui-fg-base"
      >
        Category Ratings Distribution
      </Heading>

      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: "700px" }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              className="[&_.recharts-label]:fill-gray-600 dark:[&_.recharts-label]:fill-ui-fg-muted"
              data={chartData}
              margin={{ top: 30, right: 40, bottom: 80, left: 60 }}
            >
              <XAxis
                dataKey="category"
                tick={<CustomXAxisTick />}
                height={120}
                interval={0}
                stroke="currentColor"
                className="text-gray-300 dark:text-gray-600"
              />

              <YAxis
                stroke="currentColor"
                className="text-gray-300 dark:text-gray-600"
                label={{
                  value: "Number of Products",
                  angle: -90,
                  position: "insideLeft",
                  dx: -35,
                  className: "fill-gray-600 dark:fill-ui-fg-muted",
                  style: {
                    textAnchor: "middle",
                    fontSize: 14,
                    fontWeight: "500",
                  },
                }}
                tick={{
                  fontSize: 12,
                  className: "fill-gray-600 dark:fill-ui-fg-muted",
                }}
              />

              <Tooltip content={<ChartCustomTooltip />} />

              <Legend
                verticalAlign="top"
                height={50}
                iconType="square"
                iconSize={16}
                wrapperStyle={{ paddingBottom: "20px" }}
                formatter={(value) => (
                  <span className="text-base font-semibold text-gray-700 dark:text-ui-fg-subtle">
                    {value}
                  </span>
                )}
              />

              <Bar
                dataKey="rating_5"
                name="5 ⭐"
                stackId="ratings"
                fill={ratingColors.rating_5}
              />
              <Bar
                dataKey="rating_4"
                name="4 ⭐"
                stackId="ratings"
                fill={ratingColors.rating_4}
              />
              <Bar
                dataKey="rating_3"
                name="3 ⭐"
                stackId="ratings"
                fill={ratingColors.rating_3}
              />
              <Bar
                dataKey="rating_2"
                name="2 ⭐"
                stackId="ratings"
                fill={ratingColors.rating_2}
              />
              <Bar
                dataKey="rating_1"
                name="1 ⭐"
                stackId="ratings"
                fill={ratingColors.rating_1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Text className="text-center text-sm font-medium text-gray-600 dark:text-ui-fg-muted">
          Showing {chartData.length} categories
        </Text>

        {categoriesWithoutReviews.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-ui-border-base dark:bg-ui-bg-base">
            <Text className="mb-1 text-sm font-semibold text-gray-700 dark:text-ui-fg-subtle">
              Categories without reviews ({categoriesWithoutReviews.length}):
            </Text>
            <Text className="break-words text-sm text-gray-600 dark:text-ui-fg-muted">
              {categoriesWithoutReviews.map((cat) => cat.category).join(", ")}
            </Text>
          </div>
        )}

        {categoriesWithReviews.length > 0 && (
          <Text className="text-center text-sm text-gray-500 dark:text-ui-fg-muted">
            {categoriesWithReviews.length} categories with active reviews
          </Text>
        )}
      </div>
    </div>
  )
}
