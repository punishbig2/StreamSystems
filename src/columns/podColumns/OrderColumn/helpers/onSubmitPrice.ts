import {PodRowStatus} from 'interfaces/podRow';
import {dispatchWorkspaceError} from 'utils';
import {createOrder} from 'components/PodTile/helpers';
import {createAction} from 'redux/actionCreator';
import {ActionTypes} from 'columns/podColumns/OrderColumn/reducer';
import {isInvertedMarket} from 'columns/podColumns/OrderColumn/helpers/isInvertedMarket';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {moveToNextPrice} from 'columns/podColumns/OrderColumn/helpers/moveToNextPrice';
import {getFinalSize} from 'columns/podColumns/OrderColumn/helpers/getFinalSize';
import {FXOAction} from 'redux/fxo-action';
import {Dispatch} from 'react';

export const onSubmitPriceListener = (
  order: Order,
  type: OrderTypes,
  submittedSize: number | null,
  defaultSize: number,
  minimumSize: number,
  personality: string,
  dispatch: Dispatch<FXOAction<ActionTypes>>,
  onRowStatusChange: (rowStatus: PodRowStatus) => void,
) =>
  (input: HTMLInputElement, price: number | null, changed: boolean) => {
    input.disabled = true;
    onRowStatusChange(PodRowStatus.Normal);
    dispatchWorkspaceError(null);
    if (changed) {
      if (isInvertedMarket(order, type, price)) {
        onRowStatusChange(PodRowStatus.InvertedMarketsError);
        // Emit a global message to show an error
        dispatchWorkspaceError('Inverted markets not allowed');
        // We finished before finishing
        input.disabled = false;
        // Focus the input
        input.focus();
        return;
      }
      // Pick the appropriate size according to the priority for each
      // possible source
      const size: number = getFinalSize(submittedSize, order.size, defaultSize);
      // Do not wait for this
      createOrder({...order, price, size}, minimumSize, personality)
        .then(() => {
          order.dispatchEvent('CREATED');
        });
    } else {
      dispatch(createAction<ActionTypes>(ActionTypes.ResetAllSizes));
    }
    moveToNextPrice(input);
    // We are certainly done
    input.disabled = false;
  };

