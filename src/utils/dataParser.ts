import { MDEntry, OrderTypes } from "types/mdEntry";
import { Order } from "types/order";
import { PodRow, PodRowStatus } from "types/podRow";
import { PodTable } from "types/podTable";
import { User } from "types/user";
import { W } from "types/w";
import { $$ } from "utils/stringPaster";

type E = "bid" | "ofr";

export const mdEntryToTOBEntry = (w: W, user: User) => (
  entry: MDEntry,
  fallbackType: OrderTypes
): Order => {
  if (entry) {
    return Order.fromWAndMDEntry(w, entry, user);
  } else {
    return new Order(
      w.Tenor,
      w.Symbol,
      w.Strategy,
      user.email,
      null,
      fallbackType
    );
  }
};

const reshape = (
  w: W,
  user: User,
  bids: MDEntry[],
  offers: MDEntry[]
): PodTable => {
  const reducer = (table: PodTable, row: PodRow): PodTable => {
    table[row.id] = row;
    return table;
  };
  const createMapper = (key1: E, key2: E, user: User) => (other: MDEntry[]) => (
    entry: MDEntry,
    index: number
  ): PodRow => {
    const transform = mdEntryToTOBEntry(w, user);
    if (key1 === "ofr" && key2 === "bid") {
      return {
        id: $$("__DOB", index, w.Tenor, w.Symbol, w.Strategy),
        tenor: w.Tenor,
        ofr: transform(entry, OrderTypes.Ofr),
        bid: transform(other[index], OrderTypes.Bid),
        mid: null,
        spread: null,
        darkPrice: null,
        status: PodRowStatus.Normal,
      };
    } else if (key1 === "bid" && key2 === "ofr") {
      return {
        id: $$("__DOB", index, w.Tenor, w.Symbol, w.Strategy),
        tenor: w.Tenor,
        bid: transform(entry, OrderTypes.Bid),
        ofr: transform(other[index], OrderTypes.Ofr),
        mid: null,
        spread: null,
        darkPrice: null,
        status: PodRowStatus.Normal,
      };
    } else {
      throw new Error("I cannot understand this combination");
    }
  };
  if (bids.length > offers.length) {
    const mapperSelector = createMapper("bid", "ofr", user);
    return bids.map(mapperSelector(offers)).reduce(reducer, {});
  } else {
    const mapperSelector = createMapper("ofr", "bid", user);
    return offers.map(mapperSelector(bids)).reduce(reducer, {});
  }
};

const reorder = (w: W): [MDEntry, MDEntry] => {
  const entries: MDEntry[] = w.Entries !== undefined ? w.Entries : [];
  const e1: MDEntry = entries[0];
  const e2: MDEntry = entries[1];
  // We need the user here
  const now: number = Math.floor(Date.now() / 1000);
  if (e1 === undefined && e2 === undefined) {
    return [
      {
        MDEntryType: OrderTypes.Bid,
        MDEntryPx: "0",
        MDEntrySize: "0",
        MDEntryOriginator: "",
        MDEntryTime: now.toString(),
      },
      {
        MDEntryType: OrderTypes.Ofr,
        MDEntryPx: "0",
        MDEntrySize: "0",
        MDEntryOriginator: "",
        MDEntryTime: now.toString(),
      },
    ];
  } else if (e1 === undefined) {
    return [
      {
        MDEntryType: OrderTypes.Bid,
        MDEntryPx: "0",
        MDEntrySize: "0",
        MDEntryOriginator: "",
        MDEntryTime: now.toString(),
      },
      e2,
    ];
  } else if (e2 === undefined) {
    return [
      e1,
      {
        MDEntryType: OrderTypes.Ofr,
        MDEntryPx: "0",
        MDEntrySize: "0",
        MDEntryOriginator: "",
        MDEntryTime: now.toString(),
      },
    ];
  }
  if (e1.MDEntryType === OrderTypes.Bid) {
    return [e1, e2];
  } else {
    return [e2, e1];
  }
};

export const toPodRow = (w: W, user: User): PodRow => {
  const [bid, ofr]: [MDEntry, MDEntry] = reorder(w);
  const transform = mdEntryToTOBEntry(w, user);
  return {
    id: `${w.Symbol}${w.Strategy}${w.Tenor}`,
    tenor: w.Tenor,
    bid: transform(bid, OrderTypes.Bid),
    ofr: transform(ofr, OrderTypes.Ofr),
    mid: null,
    spread: null,
    darkPrice: null,
    status: PodRowStatus.Normal,
  };
};

export const extractDepth = (w: W, user: User): PodTable => {
  const entries: MDEntry[] = w.Entries || [];
  const bids: MDEntry[] = entries.filter(
    (entry: MDEntry) => entry.MDEntryType === OrderTypes.Bid
  );
  const ofrs: MDEntry[] = entries.filter(
    (entry: MDEntry) => entry.MDEntryType === OrderTypes.Ofr
  );
  const compareEntries = (sign: number) => (a: MDEntry, b: MDEntry) => {
    let value: number = sign * (Number(a.MDEntryPx) - Number(b.MDEntryPx));
    if (value !== 0) return value;
    value = Number(a.MDEntryTime) - Number(b.MDEntryTime);
    if (value !== 0) return value;
    value = Number(a.MDEntrySize) - Number(b.MDEntrySize);
    if (value !== 0) return value;
    return 0;
  };
  // Sort bids
  bids.sort(compareEntries(-1));
  ofrs.sort(compareEntries(1));
  // Change the shape of this thing
  return reshape(w, user, bids, ofrs);
};

export const orderArrayToPodTableReducer = (table: PodTable, order: Order) => {
  const currentBid: Order = table[order.tenor]
    ? table[order.tenor].bid
    : ({} as Order);
  const currentOfr: Order = table[order.tenor]
    ? table[order.tenor].ofr
    : ({} as Order);
  table[order.tenor] = {
    id: order.tenor,
    tenor: order.tenor,
    bid: order.type === OrderTypes.Ofr ? order : currentBid,
    ofr: order.type === OrderTypes.Ofr ? order : currentOfr,
    spread: null,
    mid: null,
    status: PodRowStatus.Normal,
    darkPrice: null,
  };
  return table;
};
