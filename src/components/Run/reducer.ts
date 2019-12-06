import {RunActions} from 'components/Run/enumerator';
import {functionMap} from 'components/Run/fucntionMap';
import {RunEntry} from 'components/Run/runEntry';
import {State} from 'components/Run/state';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {Action} from 'redux/action';

type Calculator = (v1: number | null, v2: number | null) => number | null;

const computeRow = (type: string, last: string | undefined, startingValues: RunEntry, v1: number): RunEntry => {
  console.log(last);
  if (!last)
    return startingValues;
  // Get the last edited value
  const v2: number = startingValues[last] as number;
  if (type === last)
    return startingValues;
  const findCalculator = (k1: string, k2: string, k3: string): Calculator => {
    if (k1 === k2) {
      return () => v1;
    } else if (k1 === k3) {
      return () => v2;
    } else {
      return functionMap[k1][k2][k3];
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
  const seed: RunEntry = {
    spread: row.spread,
    mid: row.mid,
    ofr: ofr.price,
    bid: bid.price,
    // Overwrite the one that will be replaced
    [type]: data.value,
  };
  console.log(history);
  const last: string | undefined = getHistoryItem(history[data.id], type);
  const computed: RunEntry = computeRow(type, last, seed, data.value);
  const getRowStatus = (computed: RunEntry): TOBRowStatus => {
    if (computed.bid === null || computed.ofr === null)
      return TOBRowStatus.Normal;
    return computed.bid > computed.ofr ? TOBRowStatus.BidGreaterThanOfrError : TOBRowStatus.Normal;
  };
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
            spread: computed.spread,
            mid: computed.mid,
            ofr: {
              ...ofr,
              // Update the price
              price: computed.ofr,
              // Update the status and set it as edited/modified
              status: OrderStatus.PriceEdited | ofr.status,
            },
            bid: {
              ...bid,
              // Update the price
              price: computed.bid,
              // Update the status and set it as edited/modified
              status: OrderStatus.PriceEdited | bid.status,
            },
            status: getRowStatus(computed),
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
    return [index, {...row, [key]: {...order, status: order.status | (OrderStatus.Cancelled & ~OrderStatus.Active)}}];
  });
  return {...state, orders: Object.fromEntries(entries)};
};

const removeOrder = (state: State, id: string) => {
  const orders: TOBTable = {...state.orders};
  const rows: [string, TOBRow][] = Object.entries(orders);
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

const updateEntry = (state: State, data: { id: string, entry: Order }, key: 'ofr' | 'bid'): State => {
  const {orders} = state;
  const order: Order = data.entry;
  const row: TOBRow = orders[data.id];
  if ((row[key].status & OrderStatus.Active) !== 0 && (order.status & OrderStatus.Cancelled) !== 0)
    return state;
  if (!isValidUpdate(key === 'bid' ? order : row.bid, key === 'ofr' ? order : row.ofr))
    return state;
  return {
    ...state,
    orders: {
      ...orders,
      [data.id]: fillSpreadAndMid({
        ...row,
        [key]: order,
      }),
    },
  };
};

const updateQty = (state: State, data: { id: string, value: number | null }, key: 'ofr' | 'bid'): State => {
  const {orders} = state;
  // Extract the target row
  const row: TOBRow = orders[data.id];
  // Extract the target entry
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

export const reducer = (state: State, {type, data}: Action<RunActions>): State => {
  switch (type) {
    case RunActions.RemoveOrder:
      return removeOrder(state, data);
    case RunActions.UpdateDefaultBidQty:
      return {...state, defaultBidQty: data};
    case RunActions.UpdateDefaultOfrQty:
      return {...state, defaultOfrQty: data};
    case RunActions.UpdateBid:
      return updateEntry(state, data, 'bid');
    case RunActions.UpdateOffer:
      return updateEntry(state, data, 'ofr');
    case RunActions.SetTable:
      return {...state, orders: data};
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
