import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';

type Depths = { [key: string]: TOBTable };
export const getMiniDOBByType = (depths: Depths, tenor: string, type: EntryTypes): TOBEntry[] | undefined => {
  if (depths === undefined || depths[tenor] === undefined)
    return undefined;
  const items: TOBRow[] = Object.values(depths[tenor]);
  const offers: TOBEntry[] = items.map((item) => item.offer);
  const bids: TOBEntry[] = items.map((item) => item.bid);
  switch (type) {
    case EntryTypes.Invalid:
      break;
    case EntryTypes.Offer:
      return offers.filter((entry) => entry.price !== null);
    case EntryTypes.Bid:
      return bids.filter((entry) => entry.price !== null);
    case EntryTypes.DarkPool:
      break;
  }
  // Return the interesting items
  return undefined;
};
