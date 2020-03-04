import {createAction} from 'redux/actionCreator';
import {ActionTypes} from 'columns/podColumns/OrderColumn/reducer';
import {OrderStatus, Order} from 'interfaces/order';
import {PodRowStatus} from 'interfaces/podRow';
import {dispatchWorkspaceError} from 'utils';
import {createOrder} from 'components/PodTile/helpers';
import {skipTabIndexAll} from 'utils/skipTab';
import {Dispatch} from 'react';
import {FXOAction} from 'redux/fxo-action';

export const onSubmitSizeListener = (
  order: Order,
  editedSize: number | null,
  minimumSize: number,
  personality: string,
  dispatch: Dispatch<FXOAction<ActionTypes>>,
  onRowStatusChange: (rowStatus: PodRowStatus) => void,
) =>
  async (input: HTMLInputElement) => {
    if (order.isCancelled() || order.price === null) {
      dispatch(createAction<ActionTypes>(ActionTypes.ResetAllSizes));
    }
    if (order.isOwnedByCurrentUser() && (order.status & OrderStatus.PreFilled) !== 0 && !order.isCancelled()) {
      // Get the desired new size
      const size: number | null = editedSize;
      if (size !== null && size < minimumSize) {
        onRowStatusChange(PodRowStatus.SizeTooSmall);
        // Emit a global message to show an error
        dispatchWorkspaceError(`Size cannot be smaller than ${minimumSize}`);
        // Do not create the order in this case
        return;
      }
      // Create the order
      createOrder({...order, size}, minimumSize, personality);
    }
    // Please wait until the main loop has ran and then
    // move the focus, because otherwise it could happen
    // that the focus is moved BEFORE the edited size
    // value is updated
    setImmediate(() => {
      skipTabIndexAll(input, 1);
    });
  };
