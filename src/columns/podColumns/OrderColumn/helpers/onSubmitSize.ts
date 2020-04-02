import { createAction } from 'redux/actionCreator';
import { ActionTypes } from 'columns/podColumns/OrderColumn/reducer';
import { Order } from 'interfaces/order';
import { PodRowStatus } from 'interfaces/podRow';
import { dispatchWorkspaceError } from 'utils';
import { createOrder, findMyOrder } from 'components/PodTile/helpers';
import { skipTabIndexAll } from 'utils/skipTab';
import { Dispatch } from 'react';
import { FXOAction } from 'redux/fxo-action';
import { User } from 'interfaces/user';

export const onSubmitSizeListener = (
  order: Order,
  editedSize: number | null,
  minimumSize: number,
  personality: string,
  dispatch: Dispatch<FXOAction<ActionTypes>>,
  user: User,
  onRowStatusChange: (rowStatus: PodRowStatus) => void,
) =>
  async (input: HTMLInputElement) => {
    if (editedSize === null || editedSize === order.size) {
      skipTabIndexAll(input, 1);
      return;
    }
    if (order.isCancelled() || order.price === null)
      dispatch(createAction<ActionTypes>(ActionTypes.ResetAllSizes));
    const myOrder: Order | undefined = findMyOrder(order, user);
    if (!!myOrder && !myOrder.isCancelled()) {
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
      createOrder({ ...order, size }, minimumSize, personality, user)
        .then(() => {
          console.log('order created');
        });
    }
    // Please wait until the main loop has ran and then
    // move the focus, because otherwise it could happen
    // that the focus is moved BEFORE the edited size
    // value is updated
    skipTabIndexAll(input, 1);
  };
