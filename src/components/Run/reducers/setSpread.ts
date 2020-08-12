import { RunState } from "stateDefs/runState";
import { PodTable } from "types/podTable";

export const setSpread = (state: RunState, value: number): RunState => {
  const { orders } = state;
  const keys: string[] = Object.keys(orders);
  const result: PodTable = keys.reduce(
    (current: PodTable, key: string): PodTable => {
      return { ...current, [key]: { ...orders[key], spread: value } };
    },
    {},
  );
  return { ...state, orders: result };
};
