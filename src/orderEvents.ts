import {Order} from 'interfaces/order';
import {$$} from 'utils/stringPaster';

export type OrderAction = 'UPDATE_SIZE' | 'CREATE' | 'CANCEL' | 'CREATED' | 'CREATE_ERROR' | 'CANCELLED' | 'CANCEL_ERROR';
export const createSymbolStrategyTenorListener =
  (symbol: string, strategy: string, tenor: string, name: OrderAction, fn: (order: Order) => void) => {
    const type: string = $$(symbol, strategy, tenor, name);
    const listener = (event: CustomEvent<Order>) => fn(event.detail);
    document.addEventListener(type, listener as EventListener, true);
    return () => {
      document.removeEventListener(type, listener as EventListener, true);
    };
  };

