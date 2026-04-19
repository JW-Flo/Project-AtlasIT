import { CONNECTED_APP_IDS } from "./integrations.js";

export { CONNECTED_APP_IDS };

export function getMarketplaceResponse() {
  return {
    data: {
      items: CONNECTED_APP_IDS.map((id) => ({
        id,
        installed: true,
      })),
    },
  };
}
