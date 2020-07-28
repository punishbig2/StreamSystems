import { RunState } from "stateDefs/runState";
import { OrderTypes } from "types/mdEntry";
import { PodRow } from "types/podRow";
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
          size: !!order.size
            ? order.size
            : order.type === OrderTypes.Bid
            ? state.defaultBidSize
            : state.defaultOfrSize,
        },
      }),
    },
  };
};
