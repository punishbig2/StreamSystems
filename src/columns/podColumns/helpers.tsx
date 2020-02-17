import {Order, OrderStatus} from 'interfaces/order';
import {PodTable} from 'interfaces/podTable';
import {InvalidPrice, TOBRow} from 'interfaces/tobRow';
import {API} from 'API';
import {OrderTypes} from 'interfaces/mdEntry';

const findMyOrder = (topOrder: Order, depths: { [key: string]: PodTable }): Order | undefined => {
  if ((topOrder.status & OrderStatus.Owned) !== 0)
    return topOrder;
  const tables: PodTable[] = Object.values(depths);
  const rows: TOBRow[][] = tables.map((table: PodTable) => Object.values(table));
  const found: Order | undefined = rows
    .reduce((all: TOBRow[], one: TOBRow[]) => {
      return [...all, ...one];
    }, [])
    .reduce((orders: Order[], row: TOBRow) => {
      const {bid, ofr} = row;
      if (topOrder.type === OrderTypes.Bid && bid)
        return [...orders, bid];
      else if (topOrder.type === OrderTypes.Ofr && ofr)
        return [...orders, ofr];
      return orders;
    }, [])
    .find((order: Order) => {
      if (order.tenor !== topOrder.tenor)
        return false;
      return ((order.status & OrderStatus.Owned) !== 0);
    });
  if (found !== undefined)
    return found;
  // No order was found
  return undefined;
};

export const createOrder = (order: Order, depths: { [key: string]: PodTable }, minimumSize: number, personality: string) => {
  if (order.price === InvalidPrice) {
    // This is empty for now
  } else if (order.price !== null) {
    if ((order.status & OrderStatus.Owned) !== 0) {
      API.cancelOrder(order);
    } else if ((order.status & OrderStatus.HasMyOrder) !== 0) {
      // Find my own order and cancel it
      const myOrder: Order | undefined = findMyOrder(order, depths);
      if (myOrder) {
        API.cancelOrder(myOrder);
      }
    }
    API.createOrder(
      order,
      personality,
      minimumSize,
    );
  } else {
    console.log('ignore this action');
  }
};

export const cancelOrder = (order: Order, depths: { [key: string]: PodTable }) => {
  const myOrder: Order | undefined = findMyOrder(order, depths);
  if (myOrder) {
    API.cancelOrder(myOrder);
  }
};
