import { OrderStore } from 'mobx/stores/orderStore';
import { skipTabIndexAll } from 'utils/skipTab';

export const SizeTooSmallError = new Error('size is too small');

export const onSubmitSize =
  (store: OrderStore) => async (input: HTMLInputElement, size: number | null) => {
    const shouldCancelReplace: boolean = store.shouldCancelReplace(size);
    if (size !== null && shouldCancelReplace) {
      if (size < store.minimumSize) {
        // Do not create the order in this case
        throw SizeTooSmallError;
      }
      // Update the order's size
      await store.create(null, size);
    }
    skipTabIndexAll(input, 1);
  };
