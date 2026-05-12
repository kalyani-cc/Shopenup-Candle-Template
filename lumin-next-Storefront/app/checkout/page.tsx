import { CheckoutTemplateClient } from "@/components/pages/checkout-template-client";
import {
  finalizeLuminTemplateMarkup,
  loadLuminTemplate,
  renderTransformedLuminMarkup,
  transformLuminTemplateMarkup
} from "@/lib/render-lumin-template";

export default async function CheckoutPage() {
  const html = await loadLuminTemplate("checkout.html");
  let pageMarkup = transformLuminTemplateMarkup(html);
  pageMarkup = await finalizeLuminTemplateMarkup(pageMarkup);
  return (
    <>
      {renderTransformedLuminMarkup(pageMarkup, { disableTemplateMainJs: true })}
      <CheckoutTemplateClient />
    </>
  );
}
