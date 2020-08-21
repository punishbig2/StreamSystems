import { RunActions } from "components/Run/reducer";
import { buildNewOrder, computeRow, getRowStatus } from "components/Run/reducers/computeRow";
import { RunEntry } from "components/Run/runEntry";
import { RunState } from "stateDefs/runState";
import { PodRow } from "types/podRow";
import { PodTable } from "types/podTable";

const updateSpread = (state: RunState, row: PodRow, spread: number): PodRow => {
  const { bid, ofr } = row;
  const starting: RunEntry = {
    spread: spread,
    bid: bid.price,
    ofr: ofr.price,
    mid: row.mid,
  };
  const computed: RunEntry = computeRow(RunActions.Spread, starting, spread);
  return {
    ...row,
    status: getRowStatus(bid, ofr, computed),
    bid: buildNewOrder(state, bid, computed.bid, starting.bid),
    ofr: buildNewOrder(state, ofr, computed.ofr, starting.ofr),
    mid: computed.mid,
    spread: computed.spread,
  };
};

export const setSpread = (state: RunState, value: number): RunState => {
  const { orders } = state;
  const keys: string[] = Object.keys(orders);
  const result: PodTable = keys.reduce(
    (current: PodTable, key: string): PodTable => {
      return {
        ...current,
        [key]: { ...updateSpread(state, orders[key], value) },
      };
    },
    {}
  );
  return { ...state, orders: result };
};
