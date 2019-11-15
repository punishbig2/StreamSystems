import {Message} from 'interfaces/md';
import {EntryTypes, MDEntry} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {$$} from 'utils/stringPaster';

const reshape = (message: Message, bids: MDEntry[], offers: MDEntry[]): TOBTable => {
  const user = getAuthenticatedUser();
  const reducer = (table: TOBTable, row: TOBRow, index: number): TOBTable => {
    table[index] = row;
    return table;
  };
  const mapper = (key1: string, key2: string) => (other: MDEntry[]) => (entry: MDEntry, index: number): any => {
    return {
      id: $$('__DOB', message.Tenor, message.Symbol, message.Strategy),
      tenor: message.Tenor,
      [key1]: {
        tenor: message.Tenor,
        strategy: message.Strategy,
        symbol: message.Symbol,
        user: entry.MDUserId || entry.MDEntryOriginator || user.email,
        quantity: Number(entry.MDEntrySize),
        price: Number(entry.MDEntryPx),
        firm: entry.MDFirm,
        type: EntryTypes.Bid,
      },
      [key2]: {
        tenor: message.Tenor,
        strategy: message.Strategy,
        symbol: message.Symbol,
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

const convertEntry = (message: Message) => (original: MDEntry): TOBEntry => {
  const user = getAuthenticatedUser();
  return {
    tenor: message.Tenor,
    strategy: message.Strategy,
    symbol: message.Symbol,
    user: original.MDEntryOriginator || user.email,
    quantity: original.MDEntrySize ? Number(original.MDEntrySize) : null,
    price: original.MDEntryPx !== '0' ? Number(original.MDEntryPx) : null,
    firm: original.MDFirm,
    type: original.MDEntryType,
    orderId: original.OrderID,
  };
};

export const toTOBRow = (message: Message): TOBRow => {
  const entries: MDEntry[] = message.Entries;
  const bids: MDEntry[] = entries.filter((entry: MDEntry) => entry.MDEntryType === EntryTypes.Bid);
  const offers: MDEntry[] = entries.filter((entry: MDEntry) => entry.MDEntryType === EntryTypes.Offer);
  // Sort all
  offers.sort((a: MDEntry, b: MDEntry) => Number(a.MDEntryPx) - Number(b.MDEntryPx));
  bids.sort((a: MDEntry, b: MDEntry) => Number(b.MDEntryPx) - Number(a.MDEntryPx));
  const dob: TOBTable = reshape(message, bids, offers);
  // Convert from input format to our local representation
  const converter: (original: MDEntry) => TOBEntry = convertEntry(message);
  return {
    id: $$(message.Tenor, message.Symbol, message.Strategy),
    tenor: message.Tenor,
    dob: dob,
    offer: {...converter(offers[0]), table: offers.map(converter)},
    bid: {...converter(bids[0]), table: bids.map(converter)},
    mid: null,
    spread: null,
  };
};
