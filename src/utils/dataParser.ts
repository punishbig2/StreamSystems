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
      id: $$('__DOB', message.Tenor, message.Symbol, message.Strategy),
      tenor: message.Tenor,
      bid: {
        tenor: message.Tenor,
        product: message.Strategy,
        symbol: message.Symbol,
        user: entry.MDUserId || entry.MDEntryOriginator,
        size: Number(entry.MDEntrySize),
        price: Number(entry.MDEntryPx),
        firm: entry.MDFirm,
        type: EntryTypes.Bid,
      },
      offer: {
        tenor: message.Tenor,
        product: message.Strategy,
        symbol: message.Symbol,
        user: entry.MDUserId || entry.MDEntryOriginator,
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
    user: original ? (original.MDUserId || original.MDEntryOriginator) : '',
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
