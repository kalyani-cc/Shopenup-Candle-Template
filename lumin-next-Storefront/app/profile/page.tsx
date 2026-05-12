import { ProfileAccountDetailMount } from "@/components/pages/profile-account-detail-client";
import { ProfileAddressesMount } from "@/components/pages/profile-addresses-client";
import { ProfileOrdersMount } from "@/components/pages/profile-orders-client";
import { ProfileLogoutMount } from "../../components/pages/profile-logout-client";
import {
  finalizeLuminTemplateMarkup,
  loadLuminTemplate,
  renderTransformedLuminMarkup,
  transformLuminTemplateMarkup
} from "../../lib/render-lumin-template";

/** Replace static account-detail form with a React mount point (hydrated client-side). */
function injectProfileAccountDetailRoot(markup: string): string {
  return markup.replace(
    /<div class="my-account-detail">\s*<form action="#">[\s\S]*?<\/form>\s*<\/div>/,
    '<div class="my-account-detail"><div id="lumin-profile-account-detail-root"></div></div>'
  );
}

/** Replace static orders table with a React mount point. */
function injectProfileOrdersRoot(markup: string): string {
  return markup.replace(
    /<div class="my-account-orders">\s*<div class="my-account-table table-responsive">[\s\S]*?<\/div>\s*<\/div>\s*<!-- My Account Orders End -->/,
    '<div class="my-account-orders"><div id="lumin-profile-orders-root"></div></div>\n                            <!-- My Account Orders End -->'
  );
}

/** Replace static addresses block with a React mount point. */
function injectProfileAddressesRoot(markup: string): string {
  return markup.replace(
    /<div class="my-account-address">[\s\S]*?<\/div>\s*<!-- My Account Address End -->/i,
    '<div class="my-account-address"><div id="lumin-profile-addresses-root"></div></div>\n                            <!-- My Account Address End -->'
  );
}

/** Replace static logout link with a React mount point. */
function injectProfileLogoutRoot(markup: string): string {
  return markup.replace(
    /<li>\s*<a class="account-btn" href="[^"]*">\s*Logout\s*<\/a>\s*<\/li>/i,
    '<li><div id="lumin-profile-logout-root"></div></li>'
  );
}

/** Remove Dashboard/Download tabs and make Orders the first active tab. */
function removeDashboardAndDownloadTabs(markup: string): string {
  return markup
    .replace(
      /<li>\s*<button class="account-btn active" data-bs-toggle="tab" data-bs-target="#dashboard" type="button">\s*Dashboard\s*<\/button>\s*<\/li>/i,
      ""
    )
    .replace(
      /<li>\s*<button class="account-btn" data-bs-toggle="tab" data-bs-target="#download" type="button">\s*Download\s*<\/button>\s*<\/li>/i,
      ""
    )
    .replace(/<div class="tab-pane fade show active" id="dashboard">[\s\S]*?<\/div>\s*<div class="tab-pane fade" id="orders">/i, '<div class="tab-pane fade show active" id="orders">')
    .replace(/<div class="tab-pane fade" id="download">[\s\S]*?<\/div>\s*<div class="tab-pane fade" id="address">/i, '<div class="tab-pane fade" id="address">')
    .replace(
      /<button class="account-btn"\s+data-bs-toggle="tab"\s+data-bs-target="#orders"\s+type="button">/i,
      '<button class="account-btn active" data-bs-toggle="tab" data-bs-target="#orders" type="button">'
    );
}

export default async function ProfilePage() {
  const html = await loadLuminTemplate("my-account.html");
  let pageMarkup = transformLuminTemplateMarkup(html);
  pageMarkup = removeDashboardAndDownloadTabs(pageMarkup);
  pageMarkup = injectProfileLogoutRoot(pageMarkup);
  pageMarkup = injectProfileOrdersRoot(pageMarkup);
  pageMarkup = injectProfileAddressesRoot(pageMarkup);
  pageMarkup = injectProfileAccountDetailRoot(pageMarkup);
  pageMarkup = await finalizeLuminTemplateMarkup(pageMarkup);
  return (
    <>
      {renderTransformedLuminMarkup(pageMarkup)}
      <ProfileOrdersMount />
      <ProfileAddressesMount />
      <ProfileAccountDetailMount />
      <ProfileLogoutMount />
    </>
  );
}
