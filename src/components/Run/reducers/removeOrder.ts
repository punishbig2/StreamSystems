import { clearIfMatches } from 'components/Run/reducers/clearIfMatches';
import { RunState } from 'stateDefs/runState';
import { PodRow } from 'types/podRow';
import { PodTable } from 'types/podTable';

export const removeOrder = (state: RunState, id: string): RunState => {
  const orders: PodTable = { ...state.orders };
  const rows: Array<[string, PodRow]> = Object.entries(orders);
  const entries = rows.map(([index, row]: [string, PodRow]) => {
    const { bid, ofr } = row;
    return [index, { ...row, bid: clearIfMatches(bid, id), ofr: clearIfMatches(ofr, id) }];
  });
  return { ...state, orders: Object.fromEntries(entries) };
};
