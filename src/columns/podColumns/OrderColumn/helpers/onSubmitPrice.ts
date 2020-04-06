import { isInvertedMarket } from 'columns/podColumns/OrderColumn/helpers/isInvertedMarket';
import { moveToNextPrice } from 'columns/podColumns/OrderColumn/helpers/moveToNextPrice';
import { TabDirection } from 'components/NumericInput';
import { OrderStore } from 'mobx/stores/orderStore';

export const InvertedMarketsError = new Error('inverted markets are not allowed');

export const onSubmitPrice = (store: OrderStore) =>
  (input: HTMLInputElement, price: number | null, changed: boolean, tabDirection: TabDirection) => {
    input.disabled = true;
    if (changed) {
      if (isInvertedMarket(store, price)) {
        input.disabled = false;
        // Focus the input
        input.focus();
        throw InvertedMarketsError;
      }
      store.setPrice(price);
      store.create();
    } else {
      store.resetAllSizes();
    }
    moveToNextPrice(input, tabDirection);
    // We are certainly done
    input.disabled = false;
  };

