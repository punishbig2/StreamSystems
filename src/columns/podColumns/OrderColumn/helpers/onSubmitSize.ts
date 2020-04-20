import { skipTabIndexAll } from 'utils/skipTab';
import { OrderStore } from 'mobx/stores/orderStore';
import { OrderStatus } from 'interfaces/order';

export const SizeTooSmallError = new Error('size is too small');

export const onSubmitSize = (store: OrderStore) =>
  async (input: HTMLInputElement) => {
    if (store.editedSize === null || store.editedSize === store.baseSize) {
      skipTabIndexAll(input, 1);
      return;
    }
    // Create an order in case it makes sense
    if (store.baseSize === null) {
      store.resetAllSizes();
    } else {
      // Get the desired new size
      const size: number | null = store.editedSize;
      // Force the store to think it's us >)
      store.baseStatus |= OrderStatus.Owned;
      if (size !== null && size < store.minimumSize) {
        // Do not create the order in this case
        throw SizeTooSmallError;
      }
      // Update the order's size
      store.create();
    }
    skipTabIndexAll(input, 1);
  };

