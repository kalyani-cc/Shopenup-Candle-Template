import { renderLuminTemplate } from "@/lib/render-lumin-template";

export default async function HomePage() {
  return renderLuminTemplate("index.html");
}
