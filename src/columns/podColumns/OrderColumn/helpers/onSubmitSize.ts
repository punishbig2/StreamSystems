import { skipTabIndexAll } from 'utils/skipTab';
import { OrderStore } from 'mobx/stores/orderStore';
import { sizeFormatter } from 'utils/sizeFormatter';

export const SizeTooSmallError = new Error('size is too small');

export const onSubmitSize = (store: OrderStore) =>
  async (input: HTMLInputElement, size: number | null) => {
    if (size === null || sizeFormatter(size) === sizeFormatter(store.baseSize)) {
      skipTabIndexAll(input, 1);
      return;
    }
    if (size < store.minimumSize) {
      // Do not create the order in this case
      throw SizeTooSmallError;
    }
    // Update the order's size
    store.create(null, size);
    skipTabIndexAll(input, 1);
  };

