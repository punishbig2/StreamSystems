import { RunWindowStore } from "mobx/stores/runWindowStore";
import { OrderTypes } from "types/mdEntry";
import { Order, OrderStatus } from "types/order";
import { PodRow, PodRowStatus } from "types/podRow";

const isInvertedMarket = (
  smaller: number | null,
  value: number | null,
  status: OrderStatus
): boolean => {
  if ((status & OrderStatus.Cancelled) !== 0) return false;
  return smaller !== null && value !== null && smaller < value;
};

export const onPriceChange = (store: RunWindowStore, type: OrderTypes) => (
  rowID: string,
  value: number | null
): boolean => {
  const row: PodRow | undefined = store.rows[rowID];
  if (row === undefined)
    throw new Error("a price change event just occurred for an invalid row");
  if (type !== OrderTypes.Bid && type !== OrderTypes.Ofr)
    throw new Error("this only makes sense for real orders");
  const opposingOrder: Order = type === OrderTypes.Bid ? row.ofr : row.bid;
  switch (type) {
    case OrderTypes.Ofr:
      if (isInvertedMarket(value, opposingOrder.price, opposingOrder.status)) {
        store.setRowStatus(rowID, PodRowStatus.InvertedMarketsError);
        return false;
      } else {
        store.setOfrPrice(rowID, value);
        return true;
      }
    case OrderTypes.Bid:
      if (isInvertedMarket(opposingOrder.price, value, opposingOrder.status)) {
        store.setRowStatus(rowID, PodRowStatus.InvertedMarketsError);
        return false;
      } else {
        store.setBidPrice(rowID, value);
        return true;
      }
  }
  return false;
};
