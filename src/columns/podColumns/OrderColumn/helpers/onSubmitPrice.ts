import { isInvertedMarket } from 'columns/podColumns/OrderColumn/helpers/isInvertedMarket';
import { moveToNextPrice } from 'columns/podColumns/OrderColumn/helpers/moveToNextPrice';
import { TabDirection } from 'components/NumericInput';
import { OrderStore } from 'mobx/stores/orderStore';
import { Order } from 'types/order';

export const InvertedMarketsError = new Error('inverted markets are not allowed');

export const onSubmitPrice =
  (store: OrderStore) =>
  async (
    input: HTMLInputElement,
    price: number | null,
    changed: boolean,
    tabDirection: TabDirection
  ): Promise<void> => {
    input.disabled = true;

    moveToNextPrice(input, tabDirection);
    if (changed) {
      const depth: Order[] = store.depth;
      if (isInvertedMarket(store, depth, price)) {
        input.disabled = false;
        // Focus the input
        input.focus();
        throw InvertedMarketsError;
      }
      await store.create(price, store.defaultSize);
    }
    // We are certainly done
    input.disabled = false;
  };
