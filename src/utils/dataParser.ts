import {OrderTypes, MDEntry} from 'interfaces/mdEntry';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import {ArrowDirection, W} from 'interfaces/w';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {$$} from 'utils/stringPaster';

type E = 'bid' | 'ofr';

const getNumber = (value: string | null | undefined): number | null => {
  if (!value)
    return null;
  const numeric: number = Number(value);
  if (numeric === 0)
    return null;
  return numeric;
};

const normalizeTickDirection = (source: string): ArrowDirection => {
  switch (source) {
    case '0':
      return ArrowDirection.Up;
    case '2':
      return ArrowDirection.Down;
    default:
      return ArrowDirection.None;
  }
};

export const mdEntryToTOBEntry = (w: W) => (entry: MDEntry, fallbackType: OrderTypes): Order => {
  const user: User = getAuthenticatedUser();
  if (entry) {
    const ownership: OrderStatus = user.email === entry.MDEntryOriginator ? OrderStatus.Owned : OrderStatus.NotOwned;
    const price: number | null = getNumber(entry.MDEntryPx);
    const quantity: number | null = getNumber(entry.MDEntrySize);
    return {
      tenor: w.Tenor,
      strategy: w.Strategy,
      symbol: w.Symbol,
      status: OrderStatus.Active | OrderStatus.PreFilled | ownership,
      user: entry.MDEntryOriginator,
      quantity: quantity,
      price: price,
      firm: entry.MDFirm,
      type: entry.MDEntryType,
      orderId: entry.OrderID,
      arrowDirection: normalizeTickDirection(entry.TickDirection),
    };
  } else {
    return {
      tenor: w.Tenor,
      strategy: w.Strategy,
      symbol: w.Symbol,
      user: user.email,
      quantity: null,
      price: null,
      type: fallbackType,
      arrowDirection: ArrowDirection.None,
      status: OrderStatus.Active | OrderStatus.Owned,
    };
  }
};

const reshape = (w: W, bids: MDEntry[], offers: MDEntry[]): TOBTable => {
  const reducer = (table: TOBTable, row: TOBRow, index: number): TOBTable => {
    const key: string = $$('__DOB_KEY', index, w.Tenor, w.Symbol, w.Strategy);
    table[key] = row;
    return table;
  };
  const createMapper = (key1: E, key2: E) => (other: MDEntry[]) => (entry: MDEntry, index: number): TOBRow => {
    const transform = mdEntryToTOBEntry(w);
    if (key1 === 'ofr' && key2 === 'bid') {
      return {
        id: $$('__DOB', w.Tenor, w.Symbol, w.Strategy),
        tenor: w.Tenor,
        ofr: transform(entry, OrderTypes.Ofr),
        bid: transform(other[index], OrderTypes.Bid),
        mid: null,
        spread: null,
        status: TOBRowStatus.Normal,
      };
    } else if (key1 === 'bid' && key2 === 'ofr') {
      return {
        id: $$('__DOB', w.Tenor, w.Symbol, w.Strategy),
        tenor: w.Tenor,
        bid: transform(entry, OrderTypes.Bid),
        ofr: transform(other[index], OrderTypes.Ofr),
        mid: null,
        spread: null,
        status: TOBRowStatus.Normal,
      };
    } else {
      throw new Error('I cannot understand this combination');
    }
  };
  if (bids.length > offers.length) {
    const mapperSelector = createMapper('bid', 'ofr');
    return bids
      .map(mapperSelector(offers))
      .reduce(reducer, {});
  } else {
    const mapperSelector = createMapper('ofr', 'bid');
    return offers
      .map(mapperSelector(bids))
      .reduce(reducer, {});
  }
};

const reorder = (entries: MDEntry[]): [MDEntry, MDEntry] => {
  const e1: MDEntry = entries[0];
  const e2: MDEntry = entries[1];
  if (e1 === undefined || e2 === undefined)
    return [{} as MDEntry, {} as MDEntry];
  if (e1.MDEntryType === OrderTypes.Bid) {
    return [e1, e2];
  } else {
    return [e2, e1];
  }
};

export const toTOBRow = (w: W): TOBRow => {
  const [bid, ofr]: [MDEntry, MDEntry] = reorder(w.Entries);
  const transform = mdEntryToTOBEntry(w);
  return {
    id: '',
    tenor: w.Tenor,
    bid: transform(bid, OrderTypes.Bid),
    ofr: transform(ofr, OrderTypes.Ofr),
    mid: null,
    spread: null,
    status: TOBRowStatus.Normal,
  };
};

export const extractDepth = (w: W): TOBTable => {
  const entries: MDEntry[] = w.Entries;
  const bids: MDEntry[] = entries.filter((entry: MDEntry) => entry.MDEntryType === OrderTypes.Bid);
  const ofrs: MDEntry[] = entries.filter((entry: MDEntry) => entry.MDEntryType === OrderTypes.Ofr);
  // Sort bids
  bids.sort((a: MDEntry, b: MDEntry) => Number(b.MDEntryPx) - Number(a.MDEntryPx));
  ofrs.sort((a: MDEntry, b: MDEntry) => Number(a.MDEntryPx) - Number(b.MDEntryPx));
  // Change the shape of this thing
  return reshape(w, bids, ofrs);
};

