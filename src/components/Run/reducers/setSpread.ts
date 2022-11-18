import { RunActions } from 'components/Run/reducer';
import { buildNewOrder, computeRow, getRowStatus } from 'components/Run/reducers/computeRow';
import { RunEntry } from 'components/Run/runEntry';
import deepEqual from 'deep-equal';
import { RunState } from 'stateDefs/runState';
import { PodRow } from 'types/podRow';
import { PodTable } from 'types/podTable';

const updateSpread = (state: RunState, row: PodRow, spread: number): PodRow => {
  const { bid, ofr } = row;
  const initial: RunEntry = {
    spread: spread,
    bid: bid.price,
    ofr: ofr.price,
    mid: row.mid,
  };
  const computed: RunEntry = computeRow(RunActions.Spread, initial, spread);
  if (deepEqual(computed, initial)) {
    return {
      ...row,
      spread: spread,
    };
  }
  return {
    ...row,
    status: getRowStatus(bid, ofr, computed),
    bid: buildNewOrder(state, bid, computed.bid, initial.bid),
    ofr: buildNewOrder(state, ofr, computed.ofr, initial.ofr),
    mid: computed.mid,
    spread: computed.spread,
  };
};

export const setSpread = (state: RunState, value: number): RunState => {
  const { orders } = state;
  const keys: string[] = Object.keys(orders);
  const result: PodTable = keys.reduce((current: PodTable, key: string): PodTable => {
    return {
      ...current,
      [key]: { ...updateSpread(state, orders[key], value) },
    };
  }, {});
  return { ...state, orders: result };
};
