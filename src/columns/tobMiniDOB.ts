import {OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';

type Depths = { [key: string]: TOBTable };
export const getMiniDOBByType = (
  depths: Depths,
  tenor: string,
  type: OrderTypes,
): Order[] | undefined => {
  if (depths === undefined || depths[tenor] === undefined) return undefined;
  const items: TOBRow[] = Object.values(depths[tenor]);
  const offers: Order[] = items.map(item => item.ofr);
  const bids: Order[] = items.map(item => item.bid);
  switch (type) {
    case OrderTypes.Invalid:
      break;
    case OrderTypes.Ofr:
      return offers.filter(entry => entry.price !== null);
    case OrderTypes.Bid:
      return bids.filter(entry => entry.price !== null);
    case OrderTypes.DarkPool:
      break;
  }
  // Return the interesting items
  return undefined;
};
