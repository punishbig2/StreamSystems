import {RunActions} from 'components/Run/enumerator';
import {functionMap} from 'components/Run/fucntionMap';
import {RunEntry} from 'components/Run/runEntry';
import {EditHistory, State} from 'components/Run/state';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {Action} from 'redux/action';
import {decompose} from 'utils/debug';

type Calculator = (v1: number | null, v2: number | null) => number | null;

const computeRow = (type: string, last: string | undefined, startingValues: RunEntry, v1: number): RunEntry => {
  if (!last)
    return startingValues;
  // Get the last edited value
  const v2: number = startingValues[last] as number;
  if (type === last)
    return startingValues;
  const findCalculator = (k1: string, k2: string, k3: string): Calculator => {
    const l1: string = k1.charAt(0);
    const l2: string = k2.charAt(0);
    const l3: string = k3.charAt(0);
    const key: string = `${l3}${l2}${l1}`;
    if (l1 === l2) {
      return () => v1;
    } else if (l1 === l3) {
      return () => v2;
    } else {
      return (v1: number | null, v2: number | null): number | null => {
        if (v1 === null || v2 === null)
          return null;
        const fn: (a: number, b: number) => number = functionMap[key];
        if (!fn) {
          throw new Error(`${key} not defined in functions table`);
        }
        return fn(v2, v1);
      };
    }
  };
  return {
    spread: findCalculator(RunActions.Spread, type, last)(v1, v2),
    mid: findCalculator(RunActions.Mid, type, last)(v1, v2),
    ofr: findCalculator(RunActions.Ofr, type, last)(v1, v2),
    bid: findCalculator(RunActions.Bid, type, last)(v1, v2),
  };
};

const updateHistory = (next: RunActions, original: RunActions[]): RunActions[] => {
  if (!original || original.length === 0)
    return [next];
  if (original[0] === next)
    return [...original];
  return [next, ...original].slice(0, 2);
};

const getHistoryItem = (history: RunActions[], type: RunActions): RunActions | undefined => {
  if (!history || history.length === 0)
    return undefined;
  if (history[0] === type)
    return history[1];
  return history[0];
};

const next = (state: State, {type, data}: Action<RunActions>): State => {
  const {history, orders} = state;
  // const finder = rowFinder(orders);
  // Find the interesting row
  const row: TOBRow = orders[data.id];
  // Extract the two sides
  const {bid, ofr} = row;
  // Original values
  const startingEntry: RunEntry = {
    spread: row.spread,
    mid: row.mid,
    ofr: ofr.price,
    bid: bid.price,
    // Overwrite the one that will be replaced
    [type]: data.value,
  };
  const last: string | undefined = getHistoryItem(history[data.id], type);
  const computedEntry: RunEntry = computeRow(type, last, startingEntry, data.value);
  const getRowStatus = (computed: RunEntry): TOBRowStatus => {
    if (computed.bid === null || computed.ofr === null)
      return TOBRowStatus.Normal;
    return computed.bid > computed.ofr ? TOBRowStatus.InvertedMarketsError : TOBRowStatus.Normal;
  };
  const getOrderStatus = (newValue: number | null) => {
    if (newValue === null)
      return OrderStatus.None;
    return OrderStatus.PriceEdited;
  };
  const coalesce = (v1: number | null, v2: number | null) => v1 === null ? v2 : v1;
  switch (type) {
    case RunActions.Mid:
    case RunActions.Spread:
    case RunActions.Ofr:
    case RunActions.Bid:
      return {
        ...state,
        orders: {
          ...orders,
          [row.id]: {
            ...row,
            spread: coalesce(computedEntry.spread, startingEntry.spread),
            mid: coalesce(computedEntry.mid, startingEntry.mid),
            ofr: {
              ...ofr,
              // Update the price
              price: coalesce(computedEntry.ofr, startingEntry.ofr),
              // Update the status and set it as edited/modified
              status: ofr.status | getOrderStatus(computedEntry.of),
            },
            bid: {
              ...bid,
              // Update the price
              price: coalesce(computedEntry.bid, startingEntry.bid),
              // Update the status and set it as edited/modified
              status: bid.status | getOrderStatus(computedEntry.bid),
            },
            status: getRowStatus(computedEntry),
          },
        },
        history: {
          ...history,
          [data.id]: updateHistory(type, history[data.id]),
        },
      };
    default:
      return state;
  }
};

const fillSpreadAndMid = (row: TOBRow) => {
  const {ofr, bid} = row;
  if ((ofr && ofr.price !== null) && (bid && bid.price !== null)) {
    return {
      ...row,
      spread: Number(ofr.price) - Number(bid.price),
      mid: (Number(ofr.price) + Number(bid.price)) / 2,
    };
  }
  return row;
};

const clearIfMatches = (order: Order, id: string): Order => {
  if (order.orderId === id) {
    return {...order, status: order.status | (OrderStatus.Cancelled & ~OrderStatus.Active)};
  } else {
    return order;
  }
};

const removeAll = (state: State, key: 'bid' | 'ofr'): State => {
  const orders: TOBTable = {...state.orders};
  const rows: [string, TOBRow][] = Object.entries(orders);
  const entries = rows.map(([index, row]: [string, TOBRow]) => {
    const order: Order = row[key];
    console.log(decompose(order.status));
    if (order.price !== null)
      return [index, {...row, [key]: {...order, status: order.status | (OrderStatus.Cancelled & ~OrderStatus.Active)}}];
    return [index, row];
  });
  return {...state, orders: Object.fromEntries(entries)};
};

const removeOrder = (state: State, id: string) => {
  const orders: TOBTable = {...state.orders};
  const rows: [string, TOBRow][] = Object.entries(orders);
  console.log(id, orders);
  const entries = rows.map(([index, row]: [string, TOBRow]) => {
    const {bid, ofr} = row;
    return [index, {...row, bid: clearIfMatches(bid, id), ofr: clearIfMatches(ofr, id)}];
  });
  return {...state, orders: Object.fromEntries(entries)};
};

const isValidUpdate = (bid: Order, ofr: Order) => {
  if (bid.price === null || ofr.price === null)
    return true;
  return bid.price < ofr.price;
};

const updateOrder = (state: State, data: { id: string, entry: Order }, key: 'ofr' | 'bid'): State => {
  const {orders} = state;
  const order: Order = data.entry;
  const row: TOBRow = orders[data.id];
  if ((row[key].status & OrderStatus.Active) !== 0 && (order.status & OrderStatus.Cancelled) !== 0)
    return state;
  if (!isValidUpdate(key === 'bid' ? order : row.bid, key === 'ofr' ? order : row.ofr))
    return state;
  const newOrders = {
    ...orders,
    [data.id]: fillSpreadAndMid({
      ...row,
      [key]: order,
    }),
  };
  return {
    ...state,
    history: deriveEditHistory(newOrders),
    orders: newOrders,
  };
};

const updateQty = (state: State, data: { id: string, value: number | null }, key: 'ofr' | 'bid'): State => {
  const {orders} = state;
  // Extract the target row
  const row: TOBRow = orders[data.id];
  // Extract the target order
  const entry: Order = row[key];
  return {
    ...state,
    orders: {
      ...orders,
      [data.id]: {
        ...row,
        [key]: {
          ...entry,
          quantity: data.value,
          status: entry.status | OrderStatus.QuantityEdited,
        },
      },
    },
  };
};

const deriveEditHistory = (table: TOBTable): { [key: string]: RunActions[] } => {
  const entries: [string, TOBRow][] = Object.entries(table);
  return entries.reduce((history: EditHistory, [key, value]: [string, TOBRow]): EditHistory => {
    const {ofr, bid} = value;
    history[key] = [];
    if (ofr.price !== null) {
      history[key].push(RunActions.Ofr);
    }
    if (bid.price !== null) {
      history[key].push(RunActions.Bid);
    }
    return history;
  }, {});
};

export const reducer = (state: State, {type, data}: Action<RunActions>): State => {
  switch (type) {
    case RunActions.RemoveOrder:
      return removeOrder(state, data);
    case RunActions.UpdateDefaultBidQty:
      return {...state, defaultBidSize: data};
    case RunActions.UpdateDefaultOfrQty:
      return {...state, defaultOfrSize: data};
    case RunActions.UpdateBid:
      return updateOrder(state, data, 'bid');
    case RunActions.UpdateOfr:
      return updateOrder(state, data, 'ofr');
    case RunActions.SetTable:
      return {...state, orders: data, history: deriveEditHistory(data), initialized: true};
    case RunActions.OfrQtyChanged:
      return updateQty(state, data, 'ofr');
    case RunActions.BidQtyChanged:
      return updateQty(state, data, 'bid');
    case RunActions.RemoveAllBids:
      return removeAll(state, 'bid');
    case RunActions.RemoveAllOfrs:
      return removeAll(state, 'ofr');
    default:
      return next(state, {type, data});
  }
};

