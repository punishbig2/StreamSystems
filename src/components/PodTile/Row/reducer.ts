import { FXOAction } from 'redux/fxo-action';
import { replaceOrder } from 'components/PodTile/Row/helpers/replaceOrder';

export interface State {
  internalRow: { [key: string]: any }
}

export enum ActionTypes {
  SetRow, ReplaceOrder, StartLoading, SetRowStatus
}

export const reducer = (state: State, action: FXOAction<ActionTypes>): State => {
  // const { bid, ofr } = internalRow;
  switch (action.type) {
    case ActionTypes.SetRow:
      return { ...state, internalRow: action.data };
    case ActionTypes.ReplaceOrder:
      return replaceOrder(state, action.data);
    case ActionTypes.StartLoading:
      return state;
    /*return {
      ...state,
      internalRow: {
        ...internalRow,
        bid: { ...bid, status: bid.status | OrderStatus.BeingLoaded },
        ofr: { ...ofr, status: ofr.status | OrderStatus.BeingLoaded },
      },
    };*/
    case ActionTypes.SetRowStatus:
      return { ...state, internalRow: { ...state.internalRow, status: action.data } };
    default:
      return state;
  }
};

