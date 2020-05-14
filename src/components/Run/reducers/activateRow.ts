import { RunState } from "stateDefs/runState";
import { PodRow, PodRowStatus } from "interfaces/podRow";
import { fillSpreadAndMid } from "components/Run/reducers/fillSpreadAndMid";
import { activateOrderIfPossible } from "components/Run/reducers/activateOrderIfPossible";

const getRowStatus = (newRow: PodRow): PodRowStatus => {
  const { bid, ofr } = newRow;
  if (bid.price === null || ofr.price === null) return newRow.status;
  return bid.price > ofr.price
    ? newRow.status | PodRowStatus.InvertedMarketsError
    : newRow.status;
};

export const activateRow = (state: RunState, rowID: string): RunState => {
  const { orders } = state;
  const row: PodRow = orders[rowID];
  if (row === undefined) return state;
  const { bid, ofr } = row;
  const newRow: PodRow = fillSpreadAndMid({
    ...row,
    bid: { ...bid, status: activateOrderIfPossible(bid.status) },
    ofr: { ...ofr, status: activateOrderIfPossible(ofr.status) },
  });
  return {
    ...state,
    orders: {
      ...orders,
      [rowID]: {
        ...newRow,
        status: getRowStatus(newRow),
      },
    },
  };
};
