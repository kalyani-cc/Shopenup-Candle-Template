import { CheckoutTemplateClient } from "@/components/pages/checkout-template-client";
import { getCheckoutPageMarkup } from "@/lib/lumin-page-markup";
import { renderTransformedLuminMarkup } from "@/lib/render-lumin-template";

export default async function CheckoutPage() {
  return (
    <>
      {renderTransformedLuminMarkup(await getCheckoutPageMarkup(), { disableTemplateMainJs: true })}
      <CheckoutTemplateClient />
    </>
  );
}
