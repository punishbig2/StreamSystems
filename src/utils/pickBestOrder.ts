import { OrderTypes } from 'types/mdEntry';
import { Order } from 'types/order';

export const pickBestOrder = (current: Order | null, other: Order): Order | null => {
  if (current === null) return other;
  if (current.type !== other.type) {
    throw new Error('attempted to compare orders with different sides');
  }

  if (current.price === null) return other;
  if (other.price === null) return current;

  switch (current.type) {
    case OrderTypes.Ofr:
      return other.price < current.price ? other : current;
    case OrderTypes.Bid:
      return other.price > current.price ? other : current;
    case OrderTypes.Invalid:
    case OrderTypes.DarkPool:
      throw new Error('cannot determine which is best');
  }
};
