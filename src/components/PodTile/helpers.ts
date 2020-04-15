import { NavigateDirection } from 'components/NumericInput/navigateDirection';
import { skipTabIndexAll } from 'utils/skipTab';
import { Order } from 'interfaces/order';
import { PodTable } from 'interfaces/podTable';
import { priceFormatter } from 'utils/priceFormatter';
import { OrderTypes } from 'interfaces/mdEntry';
import { PodRowStatus } from 'interfaces/podRow';

export const convertToDepth = (orders: Order[], tenor: string | null): PodTable => {
  if (orders === undefined || tenor === null)
    return {};
  const orderSorter = (sign: number) =>
    (o1: Order, o2: Order): number => {
      if (o1.price === null || o2.price === null)
        throw new Error('should not be sorting orders with null price');
      if (priceFormatter(o1.price) === priceFormatter(o2.price))
        return sign * (o1.timestamp - o2.timestamp);
      return sign * (o1.price - o2.price);
    };
  const bids: Order[] = orders.filter((order: Order) => order.type === OrderTypes.Bid);
  const ofrs: Order[] = orders.filter((order: Order) => order.type === OrderTypes.Ofr);
  // Sort them
  bids.sort(orderSorter(-1));
  ofrs.sort(orderSorter(1));
  const count: number = bids.length > ofrs.length ? bids.length : ofrs.length;
  const depth: PodTable = {};
  for (let i = 0; i < count; ++i) {
    depth[i] = {
      id: i.toString(),
      bid: bids[i],
      ofr: ofrs[i],
      spread: null,
      mid: null,
      darkPrice: null,
      tenor: tenor,
      status: PodRowStatus.Normal,
    };
  }
  return depth;
};

export const onNavigate = (input: HTMLInputElement, direction: NavigateDirection) => {
  switch (direction) {
    case NavigateDirection.Up:
      skipTabIndexAll(input, -5, 'last-row');
      break;
    case NavigateDirection.Left:
      skipTabIndexAll(input, -1);
      break;
    case NavigateDirection.Down:
      skipTabIndexAll(input, 5, 'first-row');
      break;
    case NavigateDirection.Right:
      skipTabIndexAll(input, 1);
      break;
  }
};
