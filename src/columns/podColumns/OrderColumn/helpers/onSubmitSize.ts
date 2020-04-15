import { skipTabIndexAll } from 'utils/skipTab';
import { OrderStore } from 'mobx/stores/orderStore';
import { User } from 'interfaces/user';
import workareaStore from 'mobx/stores/workareaStore';

export const SizeTooSmallError = new Error('size is too small');

export const onSubmitSize = (store: OrderStore) =>
  async (input: HTMLInputElement) => {
    const user: User | null = workareaStore.user;
    if (user === null)
      throw new Error('user cannot be null at this point');
    const personality: string | null = store.personality;
    if (personality === null)
      throw new Error('internal error, personality must be set');
    if (store.editedSize === null || store.editedSize === store.baseSize) {
      skipTabIndexAll(input, 1);
      return;
    }
    if (store.baseSize === null)
      store.resetAllSizes();
    // Get the desired new size
    const size: number | null = store.editedSize;
    if (size !== null && size < store.minimumSize) {
      // Do not create the order in this case
      throw SizeTooSmallError;
    }
    // Update the order's size
    store.create();
    skipTabIndexAll(input, 1);
  };

