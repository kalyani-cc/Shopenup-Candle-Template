import { OrderConfirmTemplateClient } from "@/components/pages/order-confirm-template-client";
import {
  finalizeLuminTemplateMarkup,
  loadLuminTemplate,
  renderTransformedLuminMarkup,
  transformLuminTemplateMarkup
} from "@/lib/render-lumin-template";

type OrderConfirmPageProps = {
  searchParams?: {
    order_id?: string;
  };
};

export default async function OrderConfirmPage({ searchParams }: OrderConfirmPageProps) {
  const html = await loadLuminTemplate("thank-you.html");
  const orderId = searchParams?.order_id || "";
  let pageMarkup = transformLuminTemplateMarkup(html);
  pageMarkup = await finalizeLuminTemplateMarkup(pageMarkup);
  return (
    <>
      {renderTransformedLuminMarkup(pageMarkup)}
      <OrderConfirmTemplateClient orderId={orderId} />
    </>
  );
}
