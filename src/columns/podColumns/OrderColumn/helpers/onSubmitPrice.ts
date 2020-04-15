import { isInvertedMarket } from 'columns/podColumns/OrderColumn/helpers/isInvertedMarket';
import { moveToNextPrice } from 'columns/podColumns/OrderColumn/helpers/moveToNextPrice';
import { TabDirection } from 'components/NumericInput';
import { OrderStore } from 'mobx/stores/orderStore';
import { Order } from 'interfaces/order';

export const InvertedMarketsError = new Error('inverted markets are not allowed');

export const onSubmitPrice = (store: OrderStore) =>
  (input: HTMLInputElement, price: number | null, changed: boolean, tabDirection: TabDirection) => {
    input.disabled = true;
    if (changed) {
      const depth: Order[] = store.depth;
      if (isInvertedMarket(store, depth, price)) {
        input.disabled = false;
        // Focus the input
        input.focus();
        throw InvertedMarketsError;
      }
      store.price = price;
      store.create();
    } else {
      store.resetAllSizes();
    }
    moveToNextPrice(input, tabDirection);
    // We are certainly done
    input.disabled = false;
  };

