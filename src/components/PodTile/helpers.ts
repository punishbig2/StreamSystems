import { NavigateDirection } from 'components/NumericInput/navigateDirection';
import { skipTabIndexAll } from 'utils/skipTab';
import { Order } from 'interfaces/order';
import { PodTable } from 'interfaces/podTable';
import { priceFormatter } from 'utils/priceFormatter';
import { OrderTypes } from 'interfaces/mdEntry';
import { PodRowStatus } from 'interfaces/podRow';

export const orderSorter = (type: OrderTypes) => {
  const sign: number = type === OrderTypes.Bid ? -1 : 1;
  return (o1: Order, o2: Order): number => {
    if (o1.price === null)
      return o2.price === null ? 0 : 1;
    if (o2.price === null)
      return -1;
    if (priceFormatter(o1.price) === priceFormatter(o2.price))
      return sign * (o2.timestamp - o1.timestamp);
    return sign * (o1.price - o2.price);
  };
};

export const convertToDepth = (orders: Order[], tenor: string | null): PodTable => {
  if (orders === undefined || tenor === null)
    return {};
  const bids: Order[] = orders.filter((order: Order) => order.type === OrderTypes.Bid);
  const ofrs: Order[] = orders.filter((order: Order) => order.type === OrderTypes.Ofr);
  // Sort them
  bids.sort(orderSorter(OrderTypes.Bid));
  ofrs.sort(orderSorter(OrderTypes.Ofr));
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
