import { OrderTypes } from "types/mdEntry";
import { Order } from "types/order";
import { PodRow } from "types/podRow";
import { PodTable } from "types/podTable";

type Depth = { [key: string]: PodTable };
export const getMiniDOBByType = (
  depth: Depth,
  tenor: string,
  type: OrderTypes
): Order[] | undefined => {
  if (depth === undefined || depth[tenor] === undefined) return undefined;
  const items: PodRow[] = Object.values(depth[tenor]);
  const offers: Order[] = items.map((item) => item.ofr);
  const bids: Order[] = items.map((item) => item.bid);
  switch (type) {
    case OrderTypes.Invalid:
      break;
    case OrderTypes.Ofr:
      return offers.filter((entry) => entry.price !== null);
    case OrderTypes.Bid:
      return bids.filter((entry) => entry.price !== null);
    case OrderTypes.DarkPool:
      break;
  }
  // Return the interesting items
  return undefined;
};
