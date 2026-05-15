import { ContactFormClient } from "@/components/pages/contact-form-client";
import { getContactPageMarkup } from "@/lib/lumin-page-markup";
import { renderTransformedLuminMarkup } from "@/lib/render-lumin-template";

export default async function ContactPage() {
  return (
    <div className="lumin-contact-page">
      {renderTransformedLuminMarkup(await getContactPageMarkup())}
      <ContactFormClient />
    </div>
  );
}
