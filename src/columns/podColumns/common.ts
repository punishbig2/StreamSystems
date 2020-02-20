import {PodTable} from 'interfaces/podTable';
import {OrderTypes} from 'interfaces/mdEntry';
import {OrderStatus, Order} from 'interfaces/order';
import {PodRow} from 'interfaces/podRow';
import {TOBColumnData} from 'components/PodTile/data';
import {AggregatedSize} from 'components/PodTile/reducer';

export type RowProps = PodRow & {
  handlers: TOBColumnData;
  depths: { [key: string]: PodTable };
  personality: string;
  aggregatedSize: { [key: string]: AggregatedSize };
  isBroker: boolean;
  defaultSize: number;
  minimumSize: number;
  darkPrice: number | null;
  symbol: string;
  strategy: string;
};

const getDepthStatus = (values: Order[]): OrderStatus => {
  const filtered: Order[] = values.filter((order: Order) => order.price !== null && order.size !== null);
  if (filtered.length <= 1)
    return OrderStatus.None;
  return OrderStatus.HasDepth;
};

export const getChevronStatus = (depths: { [key: string]: PodTable }, tenor: string, type: OrderTypes): OrderStatus => {
  const order: PodTable | undefined = depths[tenor];
  if (!order)
    return OrderStatus.None;
  const isEntryMineAndValid = (order: Order): boolean => {
    if ((order.status & OrderStatus.Owned) === 0 || (order.status & OrderStatus.PreFilled) === 0)
      return false;
    return (order.status & OrderStatus.Cancelled) === 0;
  };
  const values: PodRow[] = Object.values(order);
  const isMyOfr: ({ofr}: PodRow) => boolean = ({ofr}: PodRow) => isEntryMineAndValid(ofr);
  const ofrDepthStatus: OrderStatus = getDepthStatus(values.map(({ofr}: PodRow) => ofr));
  const isMyBid: ({bid}: PodRow) => boolean = ({bid}: PodRow) => isEntryMineAndValid(bid);
  const bidDepthStatus: OrderStatus = getDepthStatus(values.map(({bid}: PodRow) => bid));
  switch (type) {
    case OrderTypes.Invalid:
      break;
    case OrderTypes.Ofr:
      return ((values.find(isMyOfr) ? OrderStatus.HasMyOrder : OrderStatus.None) | ofrDepthStatus);
    case OrderTypes.Bid:
      return ((values.find(isMyBid) ? OrderStatus.HasMyOrder : OrderStatus.None) | bidDepthStatus);
    case OrderTypes.DarkPool:
      break;
  }
  return OrderStatus.None;
};

export const getBankMatchesPersonalityStatus = (order: Order, personality: string) => {
  return order.firm === personality ? OrderStatus.SameBank : OrderStatus.None;
};

