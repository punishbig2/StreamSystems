import { MDEntry, OrderTypes } from "types/mdEntry";
import { Order } from "types/order";
import { PodRow, PodRowStatus } from "types/podRow";
import { PodTable } from "types/podTable";
import { User } from "types/user";
import { W } from "types/w";

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
