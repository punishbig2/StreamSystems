import { Order } from 'types/order';

export const isValidUpdate = (bid: Order, ofr: Order): boolean => {
  if (bid.price === null || ofr.price === null) return true;
  return bid.price < ofr.price;
};
