import {EntryTypes, MDEntry} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {W} from 'interfaces/w';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {$$} from 'utils/stringPaster';

const reshape = (w: W, bids: MDEntry[], offers: MDEntry[]): TOBTable => {
  const user = getAuthenticatedUser();
  const reducer = (table: TOBTable, row: TOBRow, index: number): TOBTable => {
    const key: string = $$('__DOB_KEY', index, w.Tenor, w.Symbol, w.Strategy);
    table[key] = row;
    return table;
  };
  const mapper = (key1: string, key2: string) => (other: MDEntry[]) => (entry: MDEntry, index: number): any => {
    return {
      id: $$('__DOB', w.Tenor, w.Symbol, w.Strategy),
      tenor: w.Tenor,
      [key1]: {
        tenor: w.Tenor,
        strategy: w.Strategy,
        symbol: w.Symbol,
        user: entry.MDUserId || entry.MDEntryOriginator || user.email,
        quantity: Number(entry.MDEntrySize),
        price: Number(entry.MDEntryPx),
        firm: entry.MDFirm,
        type: EntryTypes.Bid,
      },
      [key2]: {
        tenor: w.Tenor,
        strategy: w.Strategy,
        symbol: w.Symbol,
        user: other[index] ? (other[index].MDUserId || other[index].MDEntryOriginator || user.email) : user.email,
        quantity: other[index] ? Number(other[index].MDEntrySize) : null,
        price: other[index] ? Number(other[index].MDEntryPx) : null,
        firm: entry.MDFirm,
        type: EntryTypes.Offer,
      },
      mid: null,
      spread: null,
    };
  };
  if (bids.length > offers.length) {
    return bids
      .map(mapper('bid', 'offer')(offers))
      .reduce(reducer, {});
  } else {
    return offers
      .map(mapper('offer', 'bid')(bids))
      .reduce(reducer, {});
  }
};

export const transformer = (w: W) => (entry: MDEntry): TOBEntry => {
  const user = getAuthenticatedUser();
  return {
    tenor: w.Tenor,
    strategy: w.Strategy,
    symbol: w.Symbol,
    user: entry.MDEntryOriginator || user.email,
    quantity: entry.MDEntrySize ? entry.MDEntrySize : null,
    price: entry.MDEntryPx !== '0' ? entry.MDEntryPx : null,
    firm: entry.MDFirm,
    type: entry.MDEntryType,
    orderId: entry.OrderID,
    arrowDirection: entry.TickDirection,
  };
};

const reorder = (entries: MDEntry[]): [MDEntry, MDEntry] => {
  const e1: MDEntry = entries[0];
  const e2: MDEntry = entries[1];
  if (e1.MDEntryType === EntryTypes.Bid) {
    return [e1, e2];
  } else {
    return [e2, e1];
  }
};

export const toTOBRow = (w: W): TOBRow => {
  const [bid, offer]: [MDEntry, MDEntry] = reorder(w.Entries);
  const transform = transformer(w);
  return {
    id: '',
    tenor: w.Tenor,
    bid: transform(bid),
    offer: transform(offer),
    darkPool: '',
    mid: null,
    spread: null,
    modified: false,
  };
};

export const extractDepth = (w: W): TOBTable => {
  const entries: MDEntry[] = w.Entries;
  const bids: MDEntry[] = entries.filter((entry: MDEntry) => entry.MDEntryType === EntryTypes.Bid);
  const offers: MDEntry[] = entries.filter((entry: MDEntry) => entry.MDEntryType === EntryTypes.Offer);
  // Change the shape of this thing
  return reshape(w, bids, offers);
};

