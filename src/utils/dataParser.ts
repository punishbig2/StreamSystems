import {MDEntry, OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import {W} from 'interfaces/w';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {$$} from 'utils/stringPaster';

type E = 'bid' | 'ofr';

export const mdEntryToTOBEntry = (w: W) => (
  entry: MDEntry,
  fallbackType: OrderTypes,
): Order => {
  const user: User = getAuthenticatedUser();
  if (entry) {
    return Order.fromWAndMDEntry(w, entry, user);
  } else {
    return new Order(
      w.Tenor,
      w.Symbol,
      w.Strategy,
      user.email,
      null,
      fallbackType,
    );
  }
};

const reshape = (w: W, bids: MDEntry[], offers: MDEntry[]): TOBTable => {
  const reducer = (table: TOBTable, row: TOBRow, index: number): TOBTable => {
    const key: string = $$('__DOB_KEY', index, w.Tenor, w.Symbol, w.Strategy);
    table[key] = row;
    return table;
  };
  const createMapper = (key1: E, key2: E) => (other: MDEntry[]) => (
    entry: MDEntry,
    index: number,
  ): TOBRow => {
    const transform = mdEntryToTOBEntry(w);
    if (key1 === 'ofr' && key2 === 'bid') {
      return {
        id: $$('__DOB', index, w.Tenor, w.Symbol, w.Strategy),
        tenor: w.Tenor,
        ofr: transform(entry, OrderTypes.Ofr),
        bid: transform(other[index], OrderTypes.Bid),
        mid: null,
        spread: null,
        darkPrice: null,
        status: TOBRowStatus.Normal,
      };
    } else if (key1 === 'bid' && key2 === 'ofr') {
      return {
        id: $$('__DOB', index, w.Tenor, w.Symbol, w.Strategy),
        tenor: w.Tenor,
        bid: transform(entry, OrderTypes.Bid),
        ofr: transform(other[index], OrderTypes.Ofr),
        mid: null,
        spread: null,
        darkPrice: null,
        status: TOBRowStatus.Normal,
      };
    } else {
      throw new Error('I cannot understand this combination');
    }
  };
  if (bids.length > offers.length) {
    const mapperSelector = createMapper('bid', 'ofr');
    return bids.map(mapperSelector(offers)).reduce(reducer, {});
  } else {
    const mapperSelector = createMapper('ofr', 'bid');
    return offers.map(mapperSelector(bids)).reduce(reducer, {});
  }
};

const reorder = (w: W): [MDEntry, MDEntry] => {
  const entries: MDEntry[] = w.Entries;
  const e1: MDEntry = entries[0];
  const e2: MDEntry = entries[1];
  // We need the user here
  if (e1 === undefined || e2 === undefined)
    return [
      {
        MDEntryType: OrderTypes.Bid,
        MDEntryPx: '0',
        MDEntrySize: '0',
        MDEntryOriginator: '',
      },
      {
        MDEntryType: OrderTypes.Ofr,
        MDEntryPx: '0',
        MDEntrySize: '0',
        MDEntryOriginator: '',
      },
    ];
  if (e1.MDEntryType === OrderTypes.Bid) {
    return [e1, e2];
  } else {
    return [e2, e1];
  }
};

export const toTOBRow = (w: W): TOBRow => {
  const [bid, ofr]: [MDEntry, MDEntry] = reorder(w);
  const transform = mdEntryToTOBEntry(w);
  return {
    id: '',
    tenor: w.Tenor,
    bid: transform(bid, OrderTypes.Bid),
    ofr: transform(ofr, OrderTypes.Ofr),
    mid: null,
    spread: null,
    darkPrice: null,
    status: TOBRowStatus.Normal,
  };
};

export const extractDepth = (w: W): TOBTable => {
  const entries: MDEntry[] = w.Entries;
  const bids: MDEntry[] = entries.filter(
    (entry: MDEntry) => entry.MDEntryType === OrderTypes.Bid,
  );
  const ofrs: MDEntry[] = entries.filter(
    (entry: MDEntry) => entry.MDEntryType === OrderTypes.Ofr,
  );
  // Sort bids
  bids.sort(
    (a: MDEntry, b: MDEntry) => {
      return Number(b.MDEntryPx) - Number(a.MDEntryPx);
    },
  );
  ofrs.sort(
    (a: MDEntry, b: MDEntry) => {
      return Number(a.MDEntryPx) - Number(b.MDEntryPx);
    },
  );
  // Change the shape of this thing
  return reshape(w, bids, ofrs);
};
