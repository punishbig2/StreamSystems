import {RunState} from 'redux/stateDefs/runState';
import {PodTable} from 'interfaces/podTable';
import {PodRow} from 'interfaces/podRow';
import {clearIfMatches} from 'components/Run/reducers/clearIfMatches';

export const removeOrder = (state: RunState, id: string) => {
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
