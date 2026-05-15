import type { Metadata } from "next";
import { LuminTemplateScripts } from "@/components/lumin-template-scripts";
import { AboutPageContent } from "@/components/pages/about-page";

export const metadata: Metadata = {
  title: "About us — Lumin",
  description: "Learn how Lumin crafts small-batch candles for your home.",
};

export default function AboutPage() {
  return (
    <div className="lumin-about-page">
      <AboutPageContent />
      <LuminTemplateScripts />
    </div>
  );
}
