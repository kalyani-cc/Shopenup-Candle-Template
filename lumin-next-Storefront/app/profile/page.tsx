import { ProfileAccountDetailMount } from "@/components/pages/profile-account-detail-client";
import { ProfileAddressesMount } from "@/components/pages/profile-addresses-client";
import { ProfileOrdersMount } from "@/components/pages/profile-orders-client";
import { ProfileLogoutMount } from "@/components/pages/profile-logout-client";
import { getProfilePageMarkup } from "@/lib/lumin-page-markup";
import { renderTransformedLuminMarkup } from "@/lib/render-lumin-template";

export default async function ProfilePage() {
  return (
    <>
      {renderTransformedLuminMarkup(await getProfilePageMarkup())}
      <ProfileOrdersMount />
      <ProfileAddressesMount />
      <ProfileAccountDetailMount />
      <ProfileLogoutMount />
    </>
  );
}
