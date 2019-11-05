import {Message} from 'interfaces/md';
import {EntryTypes, MDEntry} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {$$} from 'utils/stringPaster';

const reshape = (message: Message, bids: MDEntry[], offers: MDEntry[]): TOBTable => {
  const reducer = (table: TOBTable, row: TOBRow, index: number): TOBTable => {
    table[index] = row;
    return table;
  };
  const mapper = (other: MDEntry[]) => (entry: MDEntry, index: number): TOBRow => {
    return {
      id: $$(message.Tenor, message.Symbol, message.Strategy),
      tenor: message.Tenor,
      bid: {
        tenor: message.Tenor,
        product: message.Strategy,
        symbol: message.Symbol,
        user: message.User,
        size: Number(entry.MDEntrySize),
        price: Number(entry.MDEntryPx),
        firm: entry.MDFirm,
        type: EntryTypes.Bid,
      },
      offer: {
        tenor: message.Tenor,
        product: message.Strategy,
        symbol: message.Symbol,
        user: message.User,
        size: other[index] ? Number(other[index].MDEntrySize) : null,
        price: other[index] ? Number(other[index].MDEntryPx) : null,
        firm: entry.MDFirm,
        type: EntryTypes.Ask,
      },
      mid: null,
      spread: null,
    };
  };
  if (bids.length > offers.length) {
    return bids
      .map(mapper(offers))
      .reduce(reducer, {});
  } else {
    return offers
      .map(mapper(bids))
      .reduce(reducer, {});
  }
};

const convertEntry = (message: Message) => (original: MDEntry): TOBEntry => {
  return {
    tenor: message.Tenor,
    product: message.Strategy,
    symbol: message.Symbol,
    user: message.User,
    size: original ? Number(original.MDEntrySize) : null,
    quantity: original ? Number(original.MDEntrySize) : undefined,
    price: original ? Number(original.MDEntryPx) : null,
    firm: original ? original.MDFirm : '',
    type: original ? original.MDEntryType : EntryTypes.Ask,
  };
};

export const toTOBRow = (message: any): TOBRow => {
  const entries: MDEntry[] = message.Entries;
  const bids: MDEntry[] = entries.filter((entry: MDEntry) => entry.MDEntryType === EntryTypes.Bid);
  const offers: MDEntry[] = entries.filter((entry: MDEntry) => entry.MDEntryType === EntryTypes.Ask);
  // Sort all
  bids.sort((a: MDEntry, b: MDEntry) => Number(b.MDEntryPx) - Number(a.MDEntryPx));
  offers.sort((a: MDEntry, b: MDEntry) => Number(a.MDEntryPx) - Number(b.MDEntryPx));
  return {
    id: $$(message.Tenor, message.Symbol, message.Strategy),
    tenor: message.Tenor,
    dob: reshape(message, bids, offers),
    bid: {...convertEntry(message)(bids[0]), table: bids.map(convertEntry(message))},
    offer: {...convertEntry(message)(offers[0]), table: offers.map(convertEntry(message))},
    mid: null,
    spread: null,
  };
};
