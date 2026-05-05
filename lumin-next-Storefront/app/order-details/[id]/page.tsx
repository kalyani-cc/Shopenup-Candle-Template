import Link from "next/link";
import { OrderDetailsClient } from "@/components/pages/order-details-client";

type PageProps = {
  params: { id: string };
};

/** Avoid Lumin `breadcrumb-wrapper__list` — demo CSS often prints `attr(href)` after links (broken URLs). */
export default function OrderDetailsPage({ params }: PageProps) {
  const { id } = params;
  return (
    <div className="lumin-order-details-page section-padding-2">
      <div className="container-fluid custom-container">
        <header className="lumin-order-details-header text-center mb-4 pb-3 border-bottom">
          <h1 className="h2 mb-3">Order details</h1>
          <nav aria-label="Breadcrumb">
            <ol className="lumin-order-breadcrumb breadcrumb justify-content-center mb-0 flex-wrap">
              <li className="breadcrumb-item">
                <Link href="/">Home</Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/profile">My account</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Order
              </li>
            </ol>
          </nav>
        </header>
        <OrderDetailsClient orderId={id} />
      </div>
    </div>
  );
}
