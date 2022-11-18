import { activateOrderIfPossible } from 'components/Run/reducers/activateOrderIfPossible';
import { fillSpreadAndMid } from 'components/Run/reducers/fillSpreadAndMid';
import { RunState } from 'stateDefs/runState';
import { PodRow, PodRowStatus } from 'types/podRow';

const getRowStatus = (newRow: PodRow): PodRowStatus => {
  const { bid, ofr } = newRow;
  if (bid.price === null || ofr.price === null) return newRow.status;
  return bid.price > ofr.price ? newRow.status | PodRowStatus.InvertedMarketsError : newRow.status;
};

export const activateRow = (state: RunState, rowID: string): RunState => {
  const { orders } = state;
  const row: PodRow = orders[rowID];
  if (row === undefined) return state;
  const { bid, ofr } = row;
  const newRow: PodRow = fillSpreadAndMid({
    ...row,
    bid: {
      ...bid,
      status: activateOrderIfPossible(bid.status),
      size: bid.size ? bid.size : state.defaultBidSize,
    },
    ofr: {
      ...ofr,
      status: activateOrderIfPossible(ofr.status),
      size: ofr.size ? ofr.size : state.defaultOfrSize,
    },
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
