import {Message} from 'interfaces/md';
import {EntryTypes, MDEntry} from 'interfaces/mdEntry';
import {Order, Sides} from 'interfaces/order';
import {User} from 'interfaces/user';

interface MiniOrder {
  price?: string,
  size?: string,
  user: string
}

interface TableRow {
  id: string;
  tenor: string;
  bid: MiniOrder;
  ask: MiniOrder;
}

type DOBEntry = { [index: string]: TableRow };
const emptyOrder = (side: Sides, user: User, tenor: string, strategy: string, symbol: string): Order => {
  return {user: user.id, side: side, tenor: tenor, strategy: strategy, symbol: symbol};
};

/**
 * Extract the best bid and best ask from the W message to generate a TOB table
 *
 * @param data
 * @param self
 */
export const extractTOB = (data: Message[], self: User): TableRow[] => {
  if (!data)
    return [];
  return data
    .map((message: Message) => {
      const {Entries} = message;
      const allBids: MDEntry[] = Entries.filter((entry) => entry.MDEntryType === EntryTypes.Bid);
      // Sort them
      allBids.sort((a: MDEntry, b: MDEntry) => Number(b.MDEntryPx) - Number(a.MDEntryPx));
      const bestBid: MDEntry = allBids[0];
      const allAsks: MDEntry[] = Entries.filter((entry) => entry.MDEntryType === EntryTypes.Ask);
      // Sort them
      allAsks.sort((a: MDEntry, b: MDEntry) => Number(a.MDEntryPx) - Number(b.MDEntryPx));
      const bestAsk: MDEntry = allAsks[0];
      return {
        id: message.Tenor,
        tenor: message.Tenor,
        bid: bestBid ? {
          ...emptyOrder(Sides.Buy, self, message.Tenor, message.Strategy, message.Symbol),
          size: bestBid.MDEntrySize,
          price: bestBid.MDEntryPx,
          user: bestBid.MDUserId || message.User,
          dob: allBids.map((entry: MDEntry) => ({price: entry.MDEntryPx, size: entry.MDEntrySize})),
        } : emptyOrder(Sides.Buy, self, message.Tenor, message.Strategy, message.Symbol),
        ask: bestAsk ? {
          ...emptyOrder(Sides.Sell, self, message.Tenor, message.Strategy, message.Symbol),
          size: bestAsk.MDEntrySize,
          price: bestAsk.MDEntryPx,
          user: bestAsk.MDUserId || message.User,
          dob: allAsks.map((entry: MDEntry) => ({price: entry.MDEntryPx, size: entry.MDEntrySize})),
          side: Sides.Sell,
        } : emptyOrder(Sides.Sell, self, message.Tenor, message.Strategy, message.Symbol),
      };
    });
};

/**
 * Extract the DOB for a given tenor from a W message
 *
 * @param tenor
 * @param data
 * @param self
 */
export const extractDOB = (tenor: string, data: Message[], self: User): any[] => {
  const object = data
    .filter((message: Message) => message.Tenor === tenor) // Filter all the entries for the wanted tenor
    .map((message: Message) => { // Map to R entries (match entries of a given firm)
      const {Entries} = message;
      return Entries.reduce((reduced: DOBEntry, entry: MDEntry): DOBEntry => {
        if (reduced[entry.MDFirm] === undefined) {
          reduced[entry.MDFirm] = {bid: {user: self.id}, ask: {user: self.id}, id: entry.MDFirm, tenor: message.Tenor};
        }
        const row = reduced[entry.MDFirm];
        if (entry.MDEntryType === EntryTypes.Bid) {
          reduced[entry.MDFirm] = {
            ...row,
            bid: {price: entry.MDEntryPx, size: entry.MDEntrySize, user: entry.MDUserId},
          };
        } else {
          reduced[entry.MDFirm] = {
            ...row,
            ask: {price: entry.MDEntryPx, size: entry.MDEntrySize, user: entry.MDUserId},
          };
        }
        return reduced;
      }, {} as DOBEntry);
    });
  const populated = Object
    .entries(object[0])
    .map(([firm, row]) => {
      return {
        tenor: tenor,
        id: firm,
        ...row,
      };
    })
  ;
  const placeholder = (id: number): TableRow => ({
    bid: {user: self.id},
    ask: {user: self.id},
    id: `r${id}`,
    tenor: tenor,
  });
  for (let i = 0; i < data.length - populated.length; ++i)
    populated.push(placeholder(i));
  return populated;
};
