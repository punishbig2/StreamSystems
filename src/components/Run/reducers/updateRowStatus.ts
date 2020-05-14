import { RunState } from "stateDefs/runState";
import { PodRowStatus, PodRow } from "interfaces/podRow";

export const updateRowStatus = (
  state: RunState,
  { id, status }: { id: string; status: PodRowStatus }
): RunState => {
  const { orders } = state;
  const row: PodRow | undefined = orders[id];
  if (row === undefined) return state; // Just ignore this, we don't want any trouble
  return {
    ...state,
    orders: {
      ...orders,
      [id]: {
        ...row,
        status,
      },
    },
  };
};
