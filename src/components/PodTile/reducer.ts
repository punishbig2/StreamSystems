import {Order} from 'interfaces/order';
import {PodRow} from 'interfaces/podRow';
import {PodTable} from 'interfaces/podTable';
import {DarkPoolTicketData} from 'components/DarkPoolTicket';

interface Aggregation {
  bid: { [price: string]: number };
  ofr: { [price: string]: number };
}

export type AggregatedSize = {
  [key: string]: Aggregation;
};

export interface State {
  depths: { [key: string]: PodTable };
  tenor: string | null;
  orderTicket: Order | null;
  runWindowVisible: boolean;
  aggregatedSize?: AggregatedSize;
  darkPoolTicket: DarkPoolTicketData | null;
}

export enum ActionTypes {
  InsertDepth,
  SetCurrentTenor,
  ShowRunWindow,
  HideRunWindow,
  SetOrderTicket,
  SetDarkPoolTicket
}

type Group = { [key: string]: number };

const coalesce = (value: number | null, fallback: number): number =>
  value === null ? fallback : value;
const collapse = (depth: any): Aggregation | undefined => {
  if (!depth) return undefined;
  const values: PodRow[] = Object.values(depth);
  const bids: Order[] = values.map((value: PodRow) => value.bid);
  const ofrs: Order[] = values.map((value: PodRow) => value.ofr);
  const groupByPrice = (group: Group, entry: Order): Group => {
    const price: number | null = entry.price;
    if (price === null) return group;
    const key: string = price.toFixed(3);
    if (group[key]) {
      group[key] = coalesce(entry.size, 0) + group[key];
    } else {
      group[key] = coalesce(entry.size, 0);
    }
    return group;
  };
  return {
    bid: bids.reduce(groupByPrice, {}),
    ofr: ofrs.reduce(groupByPrice, {}),
  };
};

export const reducer = (
  state: State,
  {type, data}: { type: ActionTypes; data: any },
): State => {
  switch (type) {
    case ActionTypes.InsertDepth:
      return {
        ...state,
        depths: {...state.depths, [data.tenor]: data.depth},
        aggregatedSize: {
          ...state.aggregatedSize,
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
      if (data && !state.depths[data]) return state;
      return {...state, tenor: data};
    case ActionTypes.SetDarkPoolTicket:
      return {...state, darkPoolTicket: data};
    default:
      return state;
  }
};
