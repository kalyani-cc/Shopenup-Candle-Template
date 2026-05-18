import {
  createSalesChannelsWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@shopenup/shopenup/core-flows";
import { ExecArgs, ISalesChannelModuleService } from "@shopenup/framework/types";
import { ContainerRegistrationKeys, Modules } from "@shopenup/framework/utils";

/**
 * Fixes add-to-cart inventory errors like:
 * "Sales channel <id> is not associated with any stock location for variant <id>"
 *
 * Links every sales channel used by publishable API keys (and the default channel)
 * to all stock locations.
 *
 * Run:
 *   npm run link:sales-channel-stock-locations
 * or:
 *   npx shopenup exec ./src/scripts/link-sales-channel-stock-locations.ts
 */
export default async function linkSalesChannelStockLocations({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService: ISalesChannelModuleService = container.resolve(
    Modules.SALES_CHANNEL,
  );

  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [{ name: "Default Sales Channel" }],
      },
    });
    defaultSalesChannel = result;
  }

  const salesChannelIds = new Set<string>([defaultSalesChannel[0].id]);

  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "sales_channels_link.sales_channel_id"],
    filters: { type: "publishable" },
  });

  for (const key of apiKeys ?? []) {
    const links =
      (key as { sales_channels_link?: { sales_channel_id?: string }[] }).sales_channels_link ??
      [];
    for (const link of links) {
      if (link.sales_channel_id) {
        salesChannelIds.add(link.sales_channel_id);
      }
    }
  }

  const allChannels = await salesChannelModuleService.listSalesChannels({}, { take: 100 });
  for (const ch of allChannels) {
    if (ch.id) {
      salesChannelIds.add(ch.id);
    }
  }

  logger.info(`Sales channels to link: ${[...salesChannelIds].join(", ")}`);

  let { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  });

  if (!stockLocations?.length) {
    logger.warn("No stock locations found. Creating a default stock location.");
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Default Warehouse",
            address: {
              city: "Unknown",
              country_code: "IN",
              address_1: "",
            },
          },
        ],
      },
    });
    stockLocations = result;
  }

  for (const location of stockLocations) {
    for (const salesChannelId of salesChannelIds) {
      try {
        logger.info(
          `Linking sales channel ${salesChannelId} → stock location ${location.id} (${location.name || "Unnamed"})`,
        );
        await linkSalesChannelsToStockLocationWorkflow(container).run({
          input: {
            id: location.id,
            add: [salesChannelId],
          },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (!/already|exists|duplicate/i.test(msg)) {
          logger.warn(`Skip ${salesChannelId} @ ${location.id}: ${msg}`);
        }
      }
    }
  }

  logger.info("Finished linking sales channels to stock locations.");
}
