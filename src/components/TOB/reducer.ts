import {Order} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';

interface Aggregation {
  bid: { [price: string]: number };
  ofr: { [price: string]: number };
}

export type AggregatedSz = {
  [key: string]: Aggregation
};

export interface State {
  depths: { [key: string]: TOBTable };
  tenor: string | null;
  orderTicket: Order | null;
  runWindowVisible: boolean;
  aggregatedSz?: AggregatedSz;
}

export enum ActionTypes {
  InsertDepth,
  SetCurrentTenor,
  ShowRunWindow,
  HideRunWindow,
  SetOrderTicket,
}

type Group = { [key: string]: number };

const coalesce = (value: number | null, fallback: number): number => value === null ? fallback : value;
const collapse = (depth: any): Aggregation | undefined => {
  if (!depth)
    return undefined;
  const values: TOBRow[] = Object.values(depth);
  const bids: Order[] = values.map((value: TOBRow) => value.bid);
  const ofrs: Order[] = values.map((value: TOBRow) => value.ofr);
  const groupByPrice = (group: Group, entry: Order): Group => {
    const price: number | null = entry.price;
    if (price === null)
      return group;
    const key: string = price.toFixed(3);
    if (group[key]) {
      const total: number = coalesce(entry.quantity, 0) + group[key];
      group[key] = total;
    } else {
      group[key] = coalesce(entry.quantity, 0);
    }
    return group;
  };
  return {
    bid: bids.reduce(groupByPrice, {}),
    ofr: ofrs.reduce(groupByPrice, {}),
  };
};

export const reducer = (state: State, {type, data}: { type: ActionTypes, data: any }): State => {
  switch (type) {
    case ActionTypes.InsertDepth:
      return {
        ...state,
        depths: {...state.depths, [data.tenor]: data.depth},
        aggregatedSz: {
          ...state.aggregatedSz,
          [data.tenor]: collapse(data.depth),
        },
      };
    case ActionTypes.ShowRunWindow:
      return {...state, runWindowVisible: true};
    case ActionTypes.HideRunWindow:
      return {...state, runWindowVisible: false};
    case ActionTypes.SetOrderTicket:
      return {...state, orderTicket: data};
    case ActionTypes.SetCurrentTenor:
      return {...state, tenor: data};
    default:
      return state;
  }
};
