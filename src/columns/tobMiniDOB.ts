import {EntryTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';

type Depths = { [key: string]: TOBTable };
export const getMiniDOBByType = (depths: Depths, tenor: string, type: EntryTypes): Order[] | undefined => {
  if (depths === undefined || depths[tenor] === undefined)
    return undefined;
  const items: TOBRow[] = Object.values(depths[tenor]);
  const offers: Order[] = items.map((item) => item.ofr);
  const bids: Order[] = items.map((item) => item.bid);
  switch (type) {
    case EntryTypes.Invalid:
      break;
    case EntryTypes.Ofr:
      return offers.filter((entry) => entry.price !== null);
    case EntryTypes.Bid:
      return bids.filter((entry) => entry.price !== null);
    case EntryTypes.DarkPool:
      break;
  }
  // Return the interesting items
  return undefined;
};
