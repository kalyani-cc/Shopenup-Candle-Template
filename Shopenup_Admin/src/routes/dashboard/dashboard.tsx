import { DashboardFilterBar } from "../../components/dashboard/dashboard-filter-bar";
// import { NewVsReturningCustomersChart } from "./components/new-vs-returning/new-vs-returning-customers-chart";
import { RepeatPurchaseRateCard } from "./components/repeat-purchase-rate/repeat-purchase-rate-card";
import { TopCustomerLocationsChart } from "./components/top-customer-locations/top-customer-locations-chart";
import { CustomerLifetimeValueTile } from "./components/customer-lifetime-value/customer-lifetime-value";
import { ReturnRateKPI } from "../../routes/dashboard/components/return-rate/return-rate-kpi"
import { CancellationsByReasonChart } from "../../routes/dashboard/components/return-rate/cancellations-by-reason-chart"
import { DiscountUsageImpactKPI } from "../../routes/dashboard/components/discount-usage-impact/discount-usage-impact-kpi"
import DashboardProducts from "./components/dashboard-products/dashboard-products";
import InventoryMovement from "./components/dashboard-products/inventory-movement/inventory-movement";
import PaymentMethodDistribution from "./components/dashboard-products/payment-method-distribution/payment-method-distribution";
import { TopRatedProductsChart } from "./components/Top_Rated_Products/top_rated_products"
import { CategoryRatingsChart } from "./components/dashboard-category-ratings.tsx/dashboard-category-ratings.tsx"
import { useDashboardFilter } from "../../providers/dashboard-filter-provider";
import { PaymentSuccessRateCard } from "./components/dashboard-products/payment-success-rate/payment-success-rate";
import { TotalRefundsKPI, TotalRefundedKPI, AverageRefundTimeKPI } from "./components/dashboard-products/refund-volume/refund-volume";
import { useState } from "react";
import { ChevronUpMini, ChevronDownMini } from "@shopenup/icons";
import { Button } from "@shopenup/ui";



import {
  OrderKPIsSection,
  NewCustomersKPI,
  OrderStatusChartSection,
  CategoryRevenueChartSection,
  SalesTrendChartSection,
} from './components/Order'

export const Dashboard = () => {
  const { activeTab } = useDashboardFilter()
  const [showFilters, setShowFilters] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 p-3 dark:bg-ui-bg-base sm:p-4 md:p-6">

      {/* Dashboard Filters - Sticky */}
      <div className="sticky top-0 z-[100] mb-4 bg-gray-50 pb-2 dark:bg-ui-bg-base sm:mb-6 sm:pb-4">
        {/* Mobile Toggle Button - Only visible on mobile */}
        <div className="sm:hidden mb-2 flex justify-end">
          <Button
            variant="transparent"
            size="small"
            onClick={() => setShowFilters(!showFilters)}
            className="text-ui-fg-muted hover:text-ui-fg-base flex items-center gap-1"
          >
            {showFilters ? (
              <>
                <ChevronUpMini className="h-4 w-4" />
                <span className="text-xs">Hide Filters</span>
              </>
            ) : (
              <>
                <ChevronDownMini className="h-4 w-4" />
                <span className="text-xs">Show Filters</span>
              </>
            )}
          </Button>
        </div>
        
        {/* Filter Bar - Only hide filter form on mobile when showFilters is false, tabs always visible */}
        <DashboardFilterBar hideFilters={!showFilters} />
      </div>

      {/* KPIs Tab Content */}
      {activeTab === "kpis" && (
        <>
          <div className="mb-4 sm:mb-6">
            <OrderKPIsSection />
          </div>
          {/* Customer Metrics KPIs - 4 in one row */}
          <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <NewCustomersKPI />
            <RepeatPurchaseRateCard />
            <CustomerLifetimeValueTile />
            <ReturnRateKPI />
          </div>
          {/* Payment & Refund KPIs - 4 in one row */}
          <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <DiscountUsageImpactKPI />
            <PaymentSuccessRateCard showOnlyKPI={true} />
            <TotalRefundsKPI />
            <TotalRefundedKPI />
          </div>
          {/* Additional Refund KPIs - 4 in one row */}
          <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <AverageRefundTimeKPI />
          </div>
        </>
      )}

      {/* Charts Tab Content */}
      {activeTab === "charts" && (
        <>
          {/* Sales Trend Chart Section */}
          <div className="mb-4 sm:mb-6">
            <SalesTrendChartSection />
          </div>

          

          {/* Charts Row */}
          <div className="mb-4 sm:mb-6 flex flex-col lg:flex-row gap-4 sm:gap-6">
            <OrderStatusChartSection />
            <PaymentMethodDistribution />
          </div>

          {/* Payment Method Distribution - Full Width */}
          <div className="mb-4 sm:mb-6 w-full">
          <CategoryRevenueChartSection />
          </div>

          {/* Inventory Movement by Location / City - Full Width */}
          <div className="mb-4 sm:mb-6 w-full">
            <InventoryMovement />
          </div>

          {/* Top 10 Customer Locations - Full Width */}
          <div className="mb-4 sm:mb-6 w-full">
            <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm dark:border-ui-border-base dark:bg-ui-bg-subtle sm:p-4">
              <TopCustomerLocationsChart />
            </div>
          </div>

          {/* Return Rate Section */}
          <div className="mb-4 sm:mb-6">
            {/* Cancellations By Reason Chart - Full Width */}
            <CancellationsByReasonChart />
          </div>
          {/* Top Rated Products - Full Width */}
          <div className="mb-4 sm:mb-6 w-full">
            <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-ui-border-base dark:bg-ui-bg-subtle sm:p-6">
              <TopRatedProductsChart />
            </div>
          </div>

          {/* Category Ratings Distribution - Full Width */}
          <div className="mb-4 sm:mb-6 w-full">
            <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-ui-border-base dark:bg-ui-bg-subtle sm:p-6">
              <CategoryRatingsChart />
            </div>
          </div>
        </>
      )}

      {/* Statistics Tab Content */}
      {activeTab === "statistics" && (
        <>
          <div className="mb-4 sm:mb-6">
            <DashboardProducts />
          </div>
        </>
      )}

    </div>
  );
}
