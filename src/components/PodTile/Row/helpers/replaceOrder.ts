import {Order} from 'interfaces/order';
import {OrderTypes} from 'interfaces/mdEntry';
import {State} from 'components/PodTile/Row/reducer';

export const replaceOrder = (state: State, order: Order): State => {
  const {internalRow} = state;
  if (order.type === OrderTypes.Bid) {
    return {...state, internalRow: {...internalRow, bid: order}};
  } else if (order.type === OrderTypes.Ofr) {
    return {...state, internalRow: {...internalRow, ofr: order}};
  } else {
    return state;
  }
};
