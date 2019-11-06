import {Computed} from 'components/Run/computed';
import {Changes} from 'components/Run/enumerator';
import {functionMap} from 'components/Run/fucntionMap';
import {State} from 'components/Run/state';
import {TOBRow} from 'interfaces/tobRow';
import {Action} from 'redux/action';
import {$$} from 'utils/stringPaster';

type Calculator = (v1: number, v2: number) => number;
const computeRow = (type: string, last: string | undefined, data: Computed, v1: number): Computed => {
  if (!last)
    return data;
  // Get the last edited value
  const v2: number = data[last as Changes] as number;
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
    spread: findCalculator(Changes.Spread, type, last)(v1, v2),
    mid: findCalculator(Changes.Mid, type, last)(v1, v2),
    offer: findCalculator(Changes.Offer, type, last)(v1, v2),
    bid: findCalculator(Changes.Bid, type, last)(v1, v2),
  };
};

export const reducer = (state: State, {type, data}: Action<string>): State => {
  const {history, table} = state;
  if (type === 'SET_TABLE')
    return {...state, table: data};
  const findRow = (tenor: string): TOBRow | null => {
    if (table === null)
      return null;
    const key: string | undefined = Object.keys(table)
      .find((key) => key.startsWith(tenor));
    if (key === undefined)
      return null;
    return {...table[key]};
  };
  const row: TOBRow | null = findRow(data.tenor);
  if (!row)
    return state;
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
  const updateHistory = (newItem: Changes, original: string[]): string[] => {
    if (original.length === 0)
      return [newItem];
    if (original[0] === newItem)
      return [...original];
    return [type, ...original].slice(0, 2);
  };
  const last: string | undefined = history.length > 0 ? (history[0] === type ? history[1] : history[0]) : undefined;
  const computed: Computed = computeRow(type, last, seed, data.value);
  switch (type) {
    case Changes.Mid:
    case Changes.Spread:
    case Changes.Offer:
    case Changes.Bid:
      return {
        ...state,
        table: {
          ...table,
          [row.tenor]: {
            ...row,
            spread: computed.spread,
            mid: computed.mid,
            offer: {...row.offer, price: computed.offer},
            bid: {...row.bid, price: computed.bid},
          },
        },
        history: updateHistory(type, history),
      };
    default:
      return state;
  }
};
