"use client"

import React from "react"
import { useBestSellingProductsByRevenue, useBestSellingProducts } from "../../../../../hooks/api/use-dashboard"

const tableSectionHeader =
  "bg-gradient-to-r from-indigo-50 via-blue-50 to-violet-50 p-4 dark:from-indigo-950/50 dark:via-slate-900/60 dark:to-violet-950/50"

const BestSellingProducts: React.FC = () => {
  const { 
    data: revenueData, 
    isLoading: isLoadingRevenue, 
    isError: isErrorRevenue, 
    error: errorRevenue 
  } = useBestSellingProductsByRevenue()

  const { 
    data: salesData, 
    isLoading: isLoadingSales, 
    isError: isErrorSales, 
    error: errorSales 
  } = useBestSellingProducts()

  const isLoading = isLoadingRevenue || isLoadingSales
  const isError = isErrorRevenue || isErrorSales

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-lg dark:border-ui-border-base dark:bg-ui-bg-subtle dark:text-ui-fg-muted">
        Loading best-selling products...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6 text-center text-red-600 shadow-lg dark:border-red-900/50 dark:bg-ui-bg-subtle dark:text-red-400">
        <div className="font-medium">Failed to load data.</div>
        {(errorRevenue || errorSales) && (
          <div className="mt-2 text-xs text-red-500/90 dark:text-red-400/80">
            Error:{" "}
            {(errorRevenue || errorSales)?.message ||
              JSON.stringify(errorRevenue || errorSales)}
          </div>
        )}
      </div>
    )
  }

  const formatCurrency = (amount: number, currencyCode: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Map backend response to component format for revenue
  const topProductsByRevenue = revenueData?.products?.map((product, index) => ({
    productId: `revenue-product-${index}`,
    productName: product.name,
    revenue: product.revenue,
  })) || []

  // Map backend response to component format for sales
  const topProductsBySales = salesData?.products?.map((product, index) => ({
    productId: `sales-product-${index}`,
    productName: product.name,
    soldNumber: product.sold_number,
  })) || []

  const hasRevenueData = revenueData && revenueData.products && revenueData.products.length > 0
  const hasSalesData = salesData && salesData.products && salesData.products.length > 0

  if (!hasRevenueData && !hasSalesData) {
    return (
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600 dark:border-ui-border-base dark:bg-ui-bg-base dark:text-ui-fg-muted">
        No top best-selling product data found.
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="mb-4 text-2xl font-bold text-blue-800 dark:text-ui-fg-base">
          Top Best-Selling Products
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Revenue */}
        {hasRevenueData && (
          <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-xl dark:border-ui-border-base dark:bg-ui-bg-subtle">
            <div className={tableSectionHeader}>
              <h3 className="text-lg font-semibold text-blue-800 dark:text-ui-fg-base">
                Top Products by Revenue
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-t border-gray-100 dark:border-ui-border-base">
                <thead className="bg-gray-50 dark:bg-ui-bg-base">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-ui-fg-muted">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-ui-fg-muted">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-ui-fg-muted">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topProductsByRevenue.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-ui-fg-muted">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    topProductsByRevenue.map((product, index) => (
                      <tr key={product.productId} className="border-b border-gray-100 hover:bg-gray-50 dark:border-ui-border-base dark:hover:bg-ui-bg-base">
                        <td className="px-4 py-3 text-gray-600 dark:text-ui-fg-muted">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-ui-fg-base">{product.productName}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-ui-fg-subtle">
                          {formatCurrency(product.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Products by Units Sold */}
        {hasSalesData && (
          <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-xl dark:border-ui-border-base dark:bg-ui-bg-subtle">
            <div className={tableSectionHeader}>
              <h3 className="text-lg font-semibold text-blue-800 dark:text-ui-fg-base">
                Top Products by Units Sold
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-t border-gray-100 dark:border-ui-border-base">
                <thead className="bg-gray-50 dark:bg-ui-bg-base">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-ui-fg-muted">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-ui-fg-muted">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-ui-fg-muted">
                      Units Sold
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topProductsBySales.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-ui-fg-muted">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    topProductsBySales.map((product, index) => (
                      <tr key={product.productId} className="border-b border-gray-100 hover:bg-gray-50 dark:border-ui-border-base dark:hover:bg-ui-bg-base">
                        <td className="px-4 py-3 text-gray-600 dark:text-ui-fg-muted">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-ui-fg-base">{product.productName}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-ui-fg-subtle">
                          {product.soldNumber.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BestSellingProducts
