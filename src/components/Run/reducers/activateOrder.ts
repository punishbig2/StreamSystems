import { RunState } from "stateDefs/runState";
import { OrderTypes } from "interfaces/mdEntry";
import { PodRow } from "interfaces/podRow";
import { fillSpreadAndMid } from "components/Run/reducers/fillSpreadAndMid";
import { activateOrderIfPossible } from "components/Run/reducers/activateOrderIfPossible";

export const activateOrder = (
  state: RunState,
  { rowID, type }: { rowID: string; type: OrderTypes }
): RunState => {
  const { orders } = state;
  const row: PodRow = orders[rowID];
  if (row === undefined) return state;
  const key: "ofr" | "bid" = type === OrderTypes.Bid ? "bid" : "ofr";
  const { [key]: order } = row;
  return {
    ...state,
    orders: {
      ...orders,
      [rowID]: fillSpreadAndMid({
        ...row,
        [key]: {
          ...order,
          status: activateOrderIfPossible(order.status),
        },
      }),
    },
  };
};
