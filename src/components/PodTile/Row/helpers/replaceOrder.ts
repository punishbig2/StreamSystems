import {Order} from 'interfaces/order';
import {OrderTypes} from 'interfaces/mdEntry';
import {State} from 'components/PodTile/Row/reducer';

/**
 * Replacing an order shouldn't overwrite the dark price ever
 */
export const replaceOrder = (state: State, order: Order): State => {
  const {internalRow} = state;
  const {darkPrice} = internalRow;
  if (order.type === OrderTypes.Bid) {
    return {...state, internalRow: {...internalRow, bid: order, darkPrice}};
  } else if (order.type === OrderTypes.Ofr) {
    return {...state, internalRow: {...internalRow, ofr: order, darkPrice}};
  } else {
    return state;
  }
};
