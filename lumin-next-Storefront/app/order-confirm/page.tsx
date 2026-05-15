import { OrderConfirmTemplateClient } from "@/components/pages/order-confirm-template-client";
import { getOrderThankYouMarkup } from "@/lib/lumin-page-markup";
import { renderTransformedLuminMarkup } from "@/lib/render-lumin-template";

type OrderConfirmPageProps = {
  searchParams?: {
    order_id?: string;
  };
};

export default async function OrderConfirmPage({ searchParams }: OrderConfirmPageProps) {
  const orderId = searchParams?.order_id || "";
  return (
    <>
      {renderTransformedLuminMarkup(await getOrderThankYouMarkup())}
      <OrderConfirmTemplateClient orderId={orderId} />
    </>
  );
}
