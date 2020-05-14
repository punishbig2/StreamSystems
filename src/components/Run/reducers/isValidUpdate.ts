import { Order } from "interfaces/order";

export const isValidUpdate = (bid: Order, ofr: Order) => {
  if (bid.price === null || ofr.price === null) return true;
  return bid.price < ofr.price;
};
