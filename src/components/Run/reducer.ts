import {Computed} from 'components/Run/computed';
import {RunActions} from 'components/Run/enumerator';
import {functionMap} from 'components/Run/fucntionMap';
import {State} from 'components/Run/state';
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
    spread: findCalculator(RunActions.Spread, type, last)(v1, v2),
    mid: findCalculator(RunActions.Mid, type, last)(v1, v2),
    offer: findCalculator(RunActions.Offer, type, last)(v1, v2),
    bid: findCalculator(RunActions.Bid, type, last)(v1, v2),
  };
};

const rowFinder = (table: TOBTable) => ({
  find: (id: string): TOBRow => {
    const key: string | undefined = Object.keys(table)
      .find((key) => key.indexOf(id) !== -1);
    if (key === undefined)
      throw new Error(`row \`${id}' not found`);
    return {...table[key]};
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
  const {history, table} = state;
  const finder = rowFinder(table);
  // Find the interesting row
  const row: TOBRow = finder.find(data.id);
  // Extract the two sides
  const {bid, offer} = row;
  // Original values
  const seed: Computed = {
    spread: row.spread,
    mid: row.mid,
    offer: offer.price,
    bid: bid.price,
    // Overwrite the one that will be replaced
    [type]: data.value,
  };
  const last: string | undefined = history.length > 0 ? (history[0] === type ? history[1] : history[0]) : undefined;
  const computed: Computed = computeRow(type, last, seed, data.value);
  switch (type) {
    case RunActions.Mid:
    case RunActions.Spread:
    case RunActions.Offer:
    case RunActions.Bid:
      return {
        ...state,
        table: {
          ...table,
          [row.id]: {
            ...row,
            spread: computed.spread,
            mid: computed.mid,
            offer: {...row.offer, price: computed.offer},
            bid: {...row.bid, price: computed.bid},
            modified: true,
          },
        },
        history: updateHistory(type, history),
      };
    default:
      return state;
  }
};

const withSpreadAndMid = (row: TOBRow) => {
  const {offer, bid} = row;
  if (offer.price !== null && bid.price !== null) {
    return {
      ...row, spread: offer.price - bid.price, mid: (offer.price + bid.price) / 2,
    };
  }
  return row;
};

export const reducer = (state: State, {type, data}: Action<RunActions>): State => {
  const {table} = state;
  switch (type) {
    case RunActions.UpdateBid:
      return {...state, table: {...table, [data.id]: withSpreadAndMid({...table[data.id], bid: data.entry})}};
    case RunActions.UpdateOffer:
      return {...state, table: {...table, [data.id]: withSpreadAndMid({...table[data.id], offer: data.entry})}};
    case RunActions.SetTable:
      return {...state, table: data};
    case RunActions.OfferQtyChanged:
      return {
        ...state,
        table: {
          ...table,
          [data.id]: {...table[data.id], offer: {...table[data.id].offer, quantity: data.value}},
        },
      };
    case RunActions.BidQtyChanged:
      return {
        ...state,
        table: {
          ...table,
          [data.id]: {...table[data.id], bid: {...table[data.id].bid, quantity: data.value}},
        },
      };
    default:
      return next(state, {type, data});
  }

};
