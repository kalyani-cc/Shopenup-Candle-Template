import { ContactFormClient } from "@/components/pages/contact-form-client";
import { renderLuminTemplate } from "@/lib/render-lumin-template";

export default async function ContactPage() {
  const lumin = await renderLuminTemplate("contact-us.html");
  return (
    <>
      {lumin}
      <ContactFormClient />
    </>
  );
}
