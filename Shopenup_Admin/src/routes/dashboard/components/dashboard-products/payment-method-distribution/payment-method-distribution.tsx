"use client"

import React, { useState, useEffect } from "react"
import { usePaymentMethodDistribution } from "../../../../../hooks/api/use-dashboard"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { CreditCard } from "@shopenup/icons"
import type { PieLabelRenderProps } from "recharts"

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload?.length) return null
  const row = payload[0]
  const pl = row?.payload as { name?: string; value?: number; count?: number }
  const name = pl?.name ?? String(row?.name ?? "")
  const percentage =
    typeof row?.value === "number" ? row.value : (pl?.value ?? 0)
  const count = pl?.count ?? 0
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-ui-border-base dark:bg-ui-bg-base">
      <p className="font-semibold text-gray-800 dark:text-ui-fg-base">{name}</p>
      <p className="mt-1 text-sm text-gray-600 dark:text-ui-fg-muted">
        {count.toLocaleString("en-IN")} orders ({percentage}%)
      </p>
    </div>
  )
}
const COLORS = [
  "#6366F1",
  "#3B82F6",
  "#2563EB",
  "#1D4ED8",
  "#1E40AF",
  "#1E3A8A",
]
/* ----------------------------------------------
   CUSTOM LABEL WITH ARROW POINTER (FIXED TYPES)
------------------------------------------------ */
const DonutLabel = (props: PieLabelRenderProps) => {
  // FIXED: converting unknown → number
  const {
    name = "",
    cx = 0,
    cy = 0,
    midAngle = 0,
    outerRadius = 0,
    percent = 0
  } = props as unknown as {
    name: string
    cx: number
    cy: number
    midAngle: number
    outerRadius: number
    percent: number
  }

  const screenWidth =
    typeof window !== "undefined" ? window.innerWidth : 1200

  const RADIAN = Math.PI / 180

  // Adjust label positioning based on screen size
  const labelOffset = screenWidth < 640 ? 20 : screenWidth < 768 ? 25 : 35
  const lineOffset = screenWidth < 640 ? 5 : screenWidth < 768 ? 6 : 8
  const textOffset = screenWidth < 640 ? 5 : screenWidth < 768 ? 8 : 10

  const sx = cx + (outerRadius + lineOffset) * Math.cos(-midAngle * RADIAN)
  const sy = cy + (outerRadius + lineOffset) * Math.sin(-midAngle * RADIAN)

  const ex = cx + (outerRadius + labelOffset) * Math.cos(-midAngle * RADIAN)
  const ey = cy + (outerRadius + labelOffset) * Math.sin(-midAngle * RADIAN)

  const tx = ex + (ex > cx ? textOffset : -textOffset)
  const ty = ey

  // Responsive font sizes
  const fontSize = screenWidth < 400 ? 8 : screenWidth < 640 ? 9 : screenWidth < 768 ? 11 : 14

  // Adjust line and circle sizes for mobile
  const lineWidth = screenWidth < 640 ? 1 : 1.5
  const circleRadius = screenWidth < 640 ? 2 : 2.5

  return (
    <g>
      <line
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
        strokeWidth={lineWidth}
        className="stroke-gray-400 dark:stroke-gray-300"
      />
      <circle
        cx={ex}
        cy={ey}
        r={circleRadius}
        className="fill-gray-600 dark:fill-gray-300"
      />
      <text
        x={tx}
        y={ty}
        textAnchor={ex > cx ? "start" : "end"}
        dominantBaseline="middle"
        fontSize={fontSize}
        className="fill-gray-900 dark:fill-ui-fg-subtle"
      >
        {name} ({(percent * 100).toFixed(0)}%)
      </text>
    </g>
  )
}
/* ---------------------------------------------------
   COMPONENT
---------------------------------------------------- */
const PaymentMethodDistribution: React.FC = () => {
  const { data, isLoading, isError, error } = usePaymentMethodDistribution()
  const [screenWidth, setScreenWidth] = useState<number>(1200)

  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth)
    }

    updateScreenWidth()
    window.addEventListener("resize", updateScreenWidth)
    return () => window.removeEventListener("resize", updateScreenWidth)
  }, [])

  const isMobile = screenWidth < 640
  const isTablet = screenWidth >= 640 && screenWidth < 1024

  if (isLoading) {
    return (
      <div className="flex h-[320px] animate-pulse items-center justify-center rounded-xl border border-gray-200 bg-white p-4 text-center text-gray-700 shadow md:h-[340px] md:p-6 lg:h-[420px] dark:border-ui-border-base dark:bg-ui-bg-subtle dark:text-ui-fg-muted">
        <p className="text-sm md:text-base">
          Loading payment method distribution...
        </p>
      </div>
    )
  }
  if (isError) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-red-200 bg-white p-4 text-center text-red-600 shadow md:h-[340px] md:p-6 lg:h-[420px] dark:border-red-900/50 dark:bg-ui-bg-subtle dark:text-red-400">
        <p className="text-sm md:text-base">
          Failed to load data. {error?.message && <span>{error.message}</span>}
        </p>
      </div>
    )
  }
  const totalOrders = data?.total_orders || 0
  const methods = data?.payment_methods || []
  const chartData = methods.map((m, index) => ({
    name: m.method.toUpperCase(),
    value: m.percentage,
    count: m.count,
    color: COLORS[index % COLORS.length],
  }))

  // Responsive chart dimensions
  const chartHeight = isMobile ? 320 : isTablet ? 340 : 360
  const innerRadius = isMobile ? "45%" : "50%"
  const outerRadius = isMobile ? "70%" : "65%"
  const centerTextSize = isMobile ? "11" : isTablet ? "13" : "14"
  const centerNumberSize = isMobile ? "14" : isTablet ? "15" : "16"

  return (
    <div className="flex w-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow md:p-6 dark:border-ui-border-base dark:bg-ui-bg-subtle lg:flex-1">
      <div className="mb-3 flex flex-col md:mb-4">
        <div className="mb-1 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400 md:h-5 md:w-5" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-ui-fg-base md:text-lg">
            Payment Method Distribution
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-ui-fg-subtle md:text-sm">
          Share of orders by payment provider
        </p>
      </div>

      <div className="flex min-h-[320px] w-full items-center justify-center overflow-visible md:min-h-[340px] lg:min-h-[360px]">
        {totalOrders === 0 || chartData.length === 0 ? (
          <div className="flex h-[320px] w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 md:h-[340px] lg:h-[360px] dark:border-ui-border-base dark:bg-ui-bg-base">
            <div className="px-4 text-center">
              <p className="text-xs font-medium text-gray-700 dark:text-ui-fg-subtle md:text-sm">
                No data available
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-ui-fg-muted">
                No orders found for this period.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-visible">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={isMobile ? 1 : 2}
                strokeWidth={isMobile ? 1.5 : 2}
                labelLine={false}
                label={DonutLabel}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {/* Center text */}
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={centerTextSize}
                fontWeight="600"
                className="fill-gray-800 dark:fill-ui-fg-subtle"
              >
                Total Payments
              </text>
              <text
                x="50%"
                y="55%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={centerNumberSize}
                fontWeight="700"
                className="fill-gray-900 dark:fill-ui-fg-base"
              >
                {totalOrders.toLocaleString("en-IN")}
              </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
export default PaymentMethodDistribution
