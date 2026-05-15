import { sdk } from "@/lib/config";
import { getCompleteHeaders } from "@/lib/shopenup/cookies";

export type StoreCollectionListItem = {
  id: string;
  handle: string;
  title: string;
};

/** Published store collections (for home sections, nav, etc.). */
export async function listStoreCollections(limit = 24): Promise<StoreCollectionListItem[]> {
  try {
    const res = await sdk.client.fetch<{
      collections?: Array<{ id?: string; handle?: string; title?: string }>;
    }>("/store/collections", {
      query: { limit },
      next: { tags: ["collections"], revalidate: 300 },
      headers: await getCompleteHeaders(),
    });

    return (res.collections || [])
      .map((c) => ({
        id: String(c.id || "").trim(),
        handle: String(c.handle || "").trim() || String(c.id || "").trim(),
        title: String(c.title || c.handle || "Collection").trim() || "Collection",
      }))
      .filter((c) => c.id.length > 0);
  } catch {
    return [];
  }
}
