import {Computed} from 'components/Run/computed';
import {RunActions} from 'components/Run/enumerator';
import {functionMap} from 'components/Run/fucntionMap';
import {State} from 'components/Run/state';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {Action} from 'redux/action';

type Calculator = (v1: number, v2: number) => number;

const computeRow = (type: string, last: string | undefined, data: Computed, v1: number): Computed => {
  if (!last)
    return data;
  // Get the last edited value
  const v2: number = data[last] as number;
  if (type === last)
    return data;
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
    spread: findCalculator(RunActions.Spread, type, last)(Number(v1), Number(v2)),
    mid: findCalculator(RunActions.Mid, type, last)(Number(v1), Number(v2)),
    ofr: findCalculator(RunActions.Ofr, type, last)(Number(v1), Number(v2)),
    bid: findCalculator(RunActions.Bid, type, last)(Number(v1), Number(v2)),
  };
};

const rowFinder = (orders: TOBTable) => ({
  find: (id: string): TOBRow => {
    const key: string | undefined = Object.keys(orders)
      .find((key) => key.indexOf(id) !== -1);
    if (key === undefined)
      throw new Error(`row \`${id}' not found`);
    return {...orders[key]};
  },
});

const updateHistory = (next: RunActions, original: RunActions[]): RunActions[] => {
  if (original.length === 0)
    return [next];
  if (original[0] === next)
    return [...original];
  return [next, ...original].slice(0, 2);
};

const next = (state: State, {type, data}: Action<RunActions>): State => {
  const {history, orders} = state;
  const finder = rowFinder(orders);
  // Find the interesting row
  const row: TOBRow = finder.find(data.id);
  // Extract the two sides
  const {bid, ofr} = row;
  // Original values
  const seed: Computed = {
    spread: row.spread,
    mid: row.mid,
    ofr: ofr.price === null ? null : Number(ofr.price),
    bid: bid.price === null ? null : Number(bid.price),
    // Overwrite the one that will be replaced
    [type]: data.value,
  };
  const last: string | undefined = history.length > 0 ? (history[0] === type ? history[1] : history[0]) : undefined;
  const computed: Computed = computeRow(type, last, seed, data.value);
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
              status: type === 'ofr' ? ofr.status | OrderStatus.PriceEdited : ofr.status,
            },
            bid: {
              ...bid,
              // Update the price
              price: computed.bid,
              // Update the status and set it as edited/modified
              status: type === 'bid' ? bid.status | OrderStatus.PriceEdited : bid.status,
            },
          },
        },
        history: updateHistory(type, history),
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

const updateEntry = (state: State, data: { id: string, entry: Order }, key: 'ofr' | 'bid'): State => {
  const {orders} = state;
  const order: Order = data.entry;
  const row: TOBRow = orders[data.id];
  if ((row[key].status & OrderStatus.Active) !== 0 && (order.status & OrderStatus.Cancelled) !== 0)
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
