import { Order, OrderStatus } from "types/order";
import { PodRow } from "types/podRow";

const getPrice = (order: Order): number | null => {
  if ((order.status & OrderStatus.Active) === OrderStatus.Active)
    return order.price;
  return null;
};

const getMid = (row: PodRow): number | null => {
  // If it's already set return this one
  if (row.mid !== null) return row.mid;
  const bid: number | null = getPrice(row.bid);
  const ofr: number | null = getPrice(row.ofr);
  if (bid !== null && ofr !== null) {
    return (bid + ofr) / 2.0;
  }
  return null;
};

const getSpread = (row: PodRow): number | null => {
  // If it's already set return this one
  if (row.spread !== null) return row.spread;
  const bid: number | null = getPrice(row.bid);
  const ofr: number | null = getPrice(row.ofr);
  if (bid !== null && ofr !== null) {
    return ofr - bid;
  }
  return null;
};

export const RunRowProxy = {
  get: (target: PodRow, name: keyof PodRow): any => {
    switch (name) {
      case "mid":
        return getMid(target);
      case "spread":
        return getSpread(target);
      default:
        return target[name];
    }
  },
};
