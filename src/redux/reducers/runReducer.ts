import equal from 'deep-equal';
import {RunEntry} from 'components/Run/runEntry';
import {Order, OrderStatus} from 'interfaces/order';
import {PodRow, TOBRowStatus} from 'interfaces/podRow';
import {PodTable} from 'interfaces/podTable';
import {RunState} from 'redux/stateDefs/runState';
import {$$} from 'utils/stringPaster';
import {priceFormatter} from 'utils/priceFormatter';
import {OrderTypes} from 'interfaces/mdEntry';
import {FXOAction} from 'redux/fxo-action';

const genesisState: RunState = {
  orders: {},
  initialized: false,
  defaultOfrSize: 0,
  defaultBidSize: 0,
  originalOrders: {},
};

export enum RunActions {
  Mid = 'mid',
  Spread = 'spread',
  Ofr = 'ofr',
  Bid = 'bid',
  // Other
  SetTable = 'Run.SetTable',
  OfrQtyChanged = 'Run.OfferQuantityChanged',
  BidQtyChanged = 'Run.BidQuantityChanged',
  UpdateBid = 'Run.UpdateBid',
  UpdateDefaultOfrQty = 'Run.UpdateDefaultOfrQty',
  UpdateOfr = 'Run.UpdateOffer',
  DeactivateAllOrders = 'Run/DeactivateAllOrders',
  UpdateDefaultBidQty = 'Run.UpdateDefaultBidQty',
  RemoveOrder = 'Run.RemoveOrder',
  RemoveAllOfrs = 'Run.RemoveAllOfrs',
  RemoveAllBids = 'Run.RemoveAllBids',
  SetDefaultSize = 'Run.SetDefaultSize',
  ActivateRow = 'Run.ActivateRow',
  ActivateOrder = 'Run.ActivateOrder',
  ResetOrder = 'Run.ResetOrder',
  ResetAll = 'Run.ResetAll',
}

const computeRow = (type: string, initial: RunEntry, v1: number): RunEntry => {
  switch (type) {
    case RunActions.Mid:
      if (initial.spread === null) return initial;
      return {
        spread: initial.spread,
        mid: v1,
        bid: (2 * v1 - initial.spread) / 2,
        ofr: (2 * v1 + initial.spread) / 2,
      };
    case RunActions.Spread:
      if (initial.mid === null) return initial;
      return {
        spread: v1,
        mid: initial.mid,
        bid: (2 * initial.mid - v1) / 2,
        ofr: (2 * initial.mid + v1) / 2,
      };
    case RunActions.Ofr:
      if (initial.bid === null) return initial;
      return {
        spread: v1 - initial.bid,
        mid: (v1 + initial.bid) / 2,
        bid: initial.bid,
        ofr: v1,
      };
    case RunActions.Bid:
      if (initial.ofr === null) return initial;
      return {
        spread: initial.ofr - v1,
        mid: (v1 + initial.ofr) / 2,
        bid: v1,
        ofr: initial.ofr,
      };
    default:
      return initial;
  }
};

const valueChangeReducer = (state: RunState, {type, data}: FXOAction<RunActions>): RunState => {
  const {orders} = state;
  // const finder = rowFinder(orders);
  const row: PodRow = orders[data.id];
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
  const computedEntry: RunEntry = computeRow(type, startingEntry, data.value);
  const getRowStatus = (computed: RunEntry): TOBRowStatus => {
    if (computed.bid === null || computed.ofr === null)
      return TOBRowStatus.Normal;
    return computed.bid > computed.ofr
      ? TOBRowStatus.InvertedMarketsError
      : TOBRowStatus.Normal;
  };
  const getOrderStatus = (status: OrderStatus, newValue: number | null, oldValue: number | null) => {
    if (priceFormatter(newValue) === priceFormatter(oldValue))
      return status;
    return (status | OrderStatus.PriceEdited) & ~OrderStatus.Owned & ~OrderStatus.SameBank;
  };
  const coalesce = (v1: number | null, v2: number | null) => v1 === null ? v2 : v1;
  const newOfr: Order = {
    ...ofr,
    // Update the price
    price: coalesce(computedEntry.ofr, startingEntry.ofr),
    // Update the status and set it as edited/modified
    status: getOrderStatus(ofr.status, computedEntry.ofr, ofr.price),
  };
  const newBid: Order = {
    ...bid,
    // Update the price
    price: coalesce(computedEntry.bid, startingEntry.bid),
    // Update the status and set it as edited/modified
    status: getOrderStatus(bid.status, computedEntry.bid, bid.price),
  };
  const isQuantityEdited = (order: Order) => (order.status & OrderStatus.QuantityEdited) !== 0;
  const quantitiesChanged: boolean = isQuantityEdited(bid) || isQuantityEdited(ofr);
  const ordersChanged: boolean = !equal(newOfr, ofr) || !equal(newBid, bid);
  switch (type) {
    case RunActions.Ofr:
    case RunActions.Bid:
      if (!ordersChanged && !quantitiesChanged)
        return state;
    // eslint-disable-next-line no-fallthrough
    case RunActions.Mid:
    case RunActions.Spread:
      return {
        ...state,
        orders: {
          ...orders,
          [row.id]: {
            ...row,
            spread: coalesce(computedEntry.spread, startingEntry.spread),
            mid: coalesce(computedEntry.mid, startingEntry.mid),
            ofr: newOfr,
            bid: newBid,
            status: getRowStatus(computedEntry),
          },
        },
      };
    default:
      return state;
  }
};

const fillSpreadAndMid = (row: PodRow): PodRow => {
  const {ofr, bid} = row;
  if (ofr && ofr.price !== null && (bid && bid.price !== null)) {
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
    return {
      ...order,
      status: order.status | (OrderStatus.Cancelled & ~OrderStatus.Active),
    };
  } else {
    return order;
  }
};

const removeAll = (state: RunState, key: 'bid' | 'ofr'): RunState => {
  const orders: PodTable = {...state.orders};
  const rows: [string, PodRow][] = Object.entries(orders);
  const entries = rows.map(([index, row]: [string, PodRow]) => {
    const order: Order = row[key];
    if (order.price !== null)
      return [
        index,
        {
          ...row,
          [key]: {
            ...order,
            status: order.status | (OrderStatus.Cancelled & ~OrderStatus.Active),
          },
        },
      ];
    return [index, row];
  });
  return {...state, orders: Object.fromEntries(entries)};
};

const removeOrder = (state: RunState, id: string) => {
  const orders: PodTable = {...state.orders};
  const rows: [string, PodRow][] = Object.entries(orders);
  const entries = rows.map(([index, row]: [string, PodRow]) => {
    const {bid, ofr} = row;
    return [
      index,
      {...row, bid: clearIfMatches(bid, id), ofr: clearIfMatches(ofr, id)},
    ];
  });
  return {...state, orders: Object.fromEntries(entries)};
};

const isValidUpdate = (bid: Order, ofr: Order) => {
  if (bid.price === null || ofr.price === null) return true;
  return bid.price < ofr.price;
};

const activateOrderIfPossible = (status: OrderStatus): OrderStatus => {
  if ((status & OrderStatus.Cancelled) === 0)
    return status;
  const edited: OrderStatus = OrderStatus.PriceEdited | OrderStatus.QuantityEdited;
  return status | edited;
};

const resetOrder = (state: RunState, {rowID, type}: { rowID: string, type: OrderTypes }): RunState => {
  const {orders} = state;
  const row: PodRow = orders[rowID];
  if (row === undefined)
    return state;
  const key: 'ofr' | 'bid' = type === OrderTypes.Bid ? 'bid' : 'ofr';
  const {[key]: order} = state.originalOrders[rowID];
  return {
    ...state,
    orders: {
      ...orders,
      [rowID]: {
        ...row,
        [key]: order,
      },
    },
  };
};

const activateOrder = (state: RunState, {rowID, type}: { rowID: string, type: OrderTypes }): RunState => {
  const {orders} = state;
  const row: PodRow = orders[rowID];
  if (row === undefined)
    return state;
  const key: 'ofr' | 'bid' = type === OrderTypes.Bid ? 'bid' : 'ofr';
  const {[key]: order} = row;
  return {
    ...state,
    orders: {
      ...orders,
      [rowID]: {
        ...row,
        [key]: {
          ...order,
          status: activateOrderIfPossible(order.status),
        },
      },
    },
  };
};

const deactivateAll = (state: RunState, rowID: string): RunState => {
  const {orders} = state;
  if (orders === undefined || rowID === undefined)
    return state;
  const row: PodRow = orders[rowID];
  if (row === undefined)
    return state;
  const {bid, ofr} = row;
  return {
    ...state,
    orders: {
      ...orders,
      [rowID]: {
        ...row,
        bid: {...bid, status: bid.status & ~OrderStatus.PriceEdited & ~OrderStatus.QuantityEdited},
        ofr: {...ofr, status: ofr.status & ~OrderStatus.PriceEdited & ~OrderStatus.QuantityEdited},
      },
    },
  };
};

const activateRow = (state: RunState, rowID: string): RunState => {
  const {orders} = state;
  const row: PodRow = orders[rowID];
  if (row === undefined)
    return state;
  const {bid, ofr} = row;
  return {
    ...state,
    orders: {
      ...orders,
      [rowID]: {
        ...row,
        bid: {...bid, status: activateOrderIfPossible(bid.status)},
        ofr: {...ofr, status: activateOrderIfPossible(ofr.status)},
      },
    },
  };
};

const updateOrder = (state: RunState, data: { id: string; order: Order }, key: 'ofr' | 'bid'): RunState => {
  const {orders} = state;
  const {order} = data;
  if (orders === undefined)
    return state;
  const row: PodRow = orders[data.id];
  if (row === undefined)
    return state;
  if ((row[key].status & OrderStatus.Active) !== 0 && (order.status & OrderStatus.Cancelled) !== 0)
    return state;
  if (!isValidUpdate(key === 'bid' ? order : row.bid, key === 'ofr' ? order : row.ofr))
    return state;
  const newRow: PodRow = fillSpreadAndMid({
    ...row,
    [key]: order,
  });
  if (equal(newRow, row))
    return state;
  const newOrders = {
    ...orders,
    [data.id]: newRow,
  };
  return {
    ...state,
    // originalOrders: orders,
    orders: newOrders,
  };
};

const updateQty = (state: RunState, data: { id: string; value: number | null }, key: 'ofr' | 'bid'): RunState => {
  const {orders} = state;
  const row: PodRow = orders[data.id];
  // Extract the target order
  const order: Order = row[key];
  return {
    ...state,
    orders: {
      ...orders,
      [data.id]: {
        ...row,
        [key]: {
          ...order,
          size: data.value,
          // In this case also set `PriceEdited' bit because we want to make
          // the value eligible for submission
          status: order.status | OrderStatus.QuantityEdited | OrderStatus.PriceEdited,
        },
      },
    },
  };
};

export default (id: string, initialState: RunState = genesisState) => {
  return (state: RunState = initialState, {type, data}: FXOAction<RunActions>): RunState => {
    switch (type) {
      case $$(id, RunActions.SetDefaultSize):
        return {...state, defaultOfrSize: data, defaultBidSize: data};
      case $$(id, RunActions.RemoveOrder):
        return removeOrder(state, data);
      case $$(id, RunActions.UpdateDefaultBidQty):
        return {...state, defaultBidSize: data};
      case $$(id, RunActions.UpdateDefaultOfrQty):
        return {...state, defaultOfrSize: data};
      case $$(id, RunActions.UpdateBid):
        return updateOrder(state, data, 'bid');
      case $$(id, RunActions.UpdateOfr):
        return updateOrder(state, data, 'ofr');
      case $$(id, RunActions.SetTable):
        return {...state, orders: data, originalOrders: data};
      case $$(id, RunActions.OfrQtyChanged):
        return updateQty(state, data, 'ofr');
      case $$(id, RunActions.BidQtyChanged):
        return updateQty(state, data, 'bid');
      case $$(id, RunActions.RemoveAllBids):
        return removeAll(state, 'bid');
      case $$(id, RunActions.RemoveAllOfrs):
        return removeAll(state, 'ofr');
      case $$(id, RunActions.Bid):
        return valueChangeReducer(state, {type: RunActions.Bid, data});
      case $$(id, RunActions.Ofr):
        return valueChangeReducer(state, {type: RunActions.Ofr, data});
      case $$(id, RunActions.Mid):
        return valueChangeReducer(state, {type: RunActions.Mid, data});
      case $$(id, RunActions.Spread):
        return valueChangeReducer(state, {type: RunActions.Spread, data});
      case $$(id, RunActions.ActivateRow):
        return activateRow(state, data);
      case $$(id, RunActions.DeactivateAllOrders):
        return deactivateAll(state, data);
      case $$(id, RunActions.ActivateOrder):
        return activateOrder(state, data);
      case $$(id, RunActions.ResetOrder):
        return resetOrder(state, data);
      case $$(id, RunActions.ResetAll):
        return {...initialState, orders: state.originalOrders, originalOrders: state.originalOrders};
      default:
        return state;
    }
  };
};
