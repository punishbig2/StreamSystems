import {TOBTable} from 'interfaces/tobTable';
import {OrderTypes} from 'interfaces/mdEntry';
import {OrderStatus, Order} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBColumnData} from 'components/TOB/data';
import {RowFunctions} from 'components/TOB/rowFunctions';

export type RowType = TOBRow & { handlers: TOBColumnData, depths: { [key: string]: TOBTable } } & RowFunctions;
export type Type = 'bid' | 'ofr';

const getDepthStatus = (values: Order[]): OrderStatus => {
  const filtered: Order[] = values.filter((order: Order) => order.price !== null && order.quantity !== null);
  if (filtered.length <= 1)
    return OrderStatus.None;
  return OrderStatus.HasDepth;
};

export const getChevronStatus = (depths: { [key: string]: TOBTable }, tenor: string, type: OrderTypes): OrderStatus => {
  const order: TOBTable | undefined = depths[tenor];
  if (!order)
    return OrderStatus.None;
  const isEntryMineAndValid = (order: Order): boolean => {
    if ((order.status & OrderStatus.Owned) === 0 || (order.status & OrderStatus.PreFilled) === 0)
      return false;
    return (order.status & OrderStatus.Cancelled) === 0;
  };
  const values: TOBRow[] = Object.values(order);
  const isMyOfr: ({ofr}: TOBRow) => boolean = ({ofr}: TOBRow) => isEntryMineAndValid(ofr);
  const ofrDepthStatus: OrderStatus = getDepthStatus(values.map(({ofr}: TOBRow) => ofr));
  const isMyBid: ({bid}: TOBRow) => boolean = ({bid}: TOBRow) => isEntryMineAndValid(bid);
  const bidDepthStatus: OrderStatus = getDepthStatus(values.map(({bid}: TOBRow) => bid));
  switch (type) {
    case OrderTypes.Invalid:
      break;
    case OrderTypes.Ofr:
      return (values.find(isMyOfr) ? OrderStatus.HaveOrders : OrderStatus.None) | ofrDepthStatus;
    case OrderTypes.Bid:
      return (values.find(isMyBid) ? OrderStatus.HaveOrders : OrderStatus.None) | bidDepthStatus;
    case OrderTypes.DarkPool:
      break;
  }
  return OrderStatus.None;
};
